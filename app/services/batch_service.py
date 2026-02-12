import asyncio
from sqlalchemy.orm import Session
from datetime import datetime
from app.models import Batch, Message
from app.adapters.vite_mobile_adapter import ViteMobileAdapter
from app.services.template_service import template_service
from app.config import settings
from app.utils.logger import logger

class BatchService:
    def __init__(self, db: Session):
        self.db = db
        self.adapter = ViteMobileAdapter()

    async def process_batch(self, batch_id: str, numbers: list[str], template_key: str):
        """
        Background task to process the batch.
        """
        # Create a new session for the background task
        from app.database import SessionLocal
        db = SessionLocal()
        
        try:
            logger.info(f"Starting batch {batch_id} with {len(numbers)} numbers.")
            
            batch = db.query(Batch).filter(Batch.id == batch_id).first()
            if not batch:
                logger.error(f"Batch {batch_id} not found in background task.")
                return

            delay = 1.0 / settings.RATE_LIMIT_PER_SECOND

            for number in numbers:
                # 0. Check for Cancellation
                # Refresh to get latest status
                self.db.refresh(batch)
                if batch.status == "cancelling":
                    logger.info(f"Batch {batch_id} cancelled by user.")
                    batch.status = "cancelled"
                    batch.completed_at = datetime.utcnow()
                    db.commit()
                    return

                # 1. Get Message Variation
                message_text = template_service.get_variation(template_key)
                if not message_text:
                    logger.error(f"No variation found for template {template_key}")
                    message_text = "Error: Template not found" 

                # 2. Send SMS
                result = await self.adapter.send_sms(number, message_text)
                
                # 3. Record Result
                status = result["status"]
                error_message = result.get("error")
                status_code = result.get("status_code")

                msg_entry = Message(
                    batch_id=batch_id,
                    phone_number=number,
                    message_text=message_text,
                    status=status,
                    error_message=error_message,
                    provider_status_code=status_code
                )
                db.add(msg_entry)
                
                # Update Batch Counts
                if status == "success":
                    batch.success_count += 1
                else:
                    batch.failure_count += 1
                
                db.commit()

                # 4. Rate Limit
                await asyncio.sleep(delay)

            # Finish Batch
            batch.status = "completed"
            batch.completed_at = datetime.utcnow()
            db.commit()
            logger.info(f"Batch {batch_id} completed. Success: {batch.success_count}, Failed: {batch.failure_count}")
        
        except Exception as e:
            logger.error(f"Fatal error in batch {batch_id}: {e}")
            # Try to mark batch as failed
            try:
                if batch:
                    batch.status = "failed"
                    db.commit()
            except:
                pass
        finally:
            db.close()

    def create_batch(self, template_key: str, total_numbers: int) -> Batch:
        new_batch = Batch(
            template_key=template_key,
            total_numbers=total_numbers,
            status="running"
        )
        self.db.add(new_batch)
        self.db.commit()
        self.db.refresh(new_batch)
        return new_batch
