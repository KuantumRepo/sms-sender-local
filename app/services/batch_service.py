import asyncio
from sqlalchemy.orm import Session
from datetime import datetime
from app.models import Batch, Message
from app.adapters.vite_mobile_adapter import ViteMobileAdapter
from app.services.template_service import template_service
from app.config import settings
from app.utils.logger import logger

# Global dictionary to hold cancellation events for active batches
active_tasks = {}

class BatchService:
    def __init__(self, db: Session):
        self.db = db
        self.adapter = ViteMobileAdapter()

    def cancel_task(self, batch_id: str):
        """Signals the background task to stop instantly."""
        if batch_id in active_tasks:
            logger.info(f"Firing complete cancellation event for batch {batch_id}")
            active_tasks[batch_id].set()

    async def process_batch(self, batch_id: str, numbers: list[str], template_key: str, batch_size: int = 100):
        """
        Background task to process the batch.
        """
        # Create a new session for the background task
        from app.database import SessionLocal
        db = SessionLocal()
        
        try:
            logger.info(f"Starting batch {batch_id} with {len(numbers)} numbers.")
            
            # Register the cancellation event for this batch
            active_tasks[batch_id] = asyncio.Event()
            
            batch = db.query(Batch).filter(Batch.id == batch_id).first()
            if not batch:
                logger.error(f"Batch {batch_id} not found in background task.")
                return

            delay = 1.0 / settings.RATE_LIMIT_PER_SECOND

            # Chunk the numbers list by batch_size
            for i in range(0, len(numbers), batch_size):
                chunk = numbers[i:i + batch_size]
                
                # 0. Check for Cancellation Event instantly
                if active_tasks[batch_id].is_set():
                    logger.info(f"Batch {batch_id} halted by instant event.")
                    # Refresh to get latest status (could be 'cancelled' or might be deleted entirely)
                    db.refresh(batch)
                    if batch:
                        batch.status = "cancelled"
                        batch.completed_at = datetime.utcnow()
                        db.commit()
                    return

                # 1. Get Message Variation (same variation for whole chunk)
                message_text = template_service.get_variation(template_key)
                if not message_text:
                    logger.error(f"No variation found for template {template_key}")
                    message_text = "Error: Template not found" 

                # 2. Join numbers with newline for ViteMobile bulk sending
                leads_string = "\n".join(chunk)

                # 3. Send SMS (Bulk request)
                logger.info(f"Sending bulk chunk of {len(chunk)} numbers to ViteMobile.")
                result = await self.adapter.send_sms(leads_string, message_text)
                
                # 4. Record Result for EACH number in the chunk
                status = result["status"]
                error_message = result.get("error")
                status_code = result.get("status_code")

                for number in chunk:
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

                # 5. Rate Limit sleep between chunks (Interruptible)
                try:
                    # Wait for either the delay to pass, OR the cancellation event to be set
                    await asyncio.wait_for(active_tasks[batch_id].wait(), timeout=delay)
                    # If we reach here without TimeoutError, it means the event was SET (cancelled)
                    logger.info(f"Interrupting sleep for batch {batch_id} due to cancel event.")
                    db.refresh(batch)
                    if batch:
                        batch.status = "cancelled"
                        batch.completed_at = datetime.utcnow()
                        db.commit()
                    return
                except asyncio.TimeoutError:
                    # Timeout is the expected outcome for a normal sleep
                    pass

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
            # Clean up the event from memory
            active_tasks.pop(batch_id, None)
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
