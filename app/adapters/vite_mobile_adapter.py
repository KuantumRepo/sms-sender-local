import httpx
from app.adapters.base import SMSProviderAdapter
from app.config import settings
from app.utils.logger import logger

class ViteMobileAdapter(SMSProviderAdapter):
    def __init__(self):
        self.base_url = settings.PROVIDER_BASE_URL.rstrip("/")
        self.headers = {
            "Authorization": f"Bearer {settings.PROVIDER_BEARER_TOKEN}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        self.server_type = settings.VITEMOBILE_SERVER_TYPE
        self.protocol = settings.VITEMOBILE_PROTOCOL

    async def send_sms(self, to: str, message: str) -> dict:
        url = f"{self.base_url}/api/messages/send/"
        
        # ViteMobile expects 'lead' for phone numbers and specific fields
        payload = {
            "lead": to, # Can be single number or newline separated
            "message": message,
            "server_type": self.server_type,
            "protocol": self.protocol
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    url, json=payload, headers=self.headers, timeout=10.0
                )
                response.raise_for_status()
                data = response.json()
                
                # Check if API returns a specific status
                return {
                    "status": "success",
                    "status_code": response.status_code,
                    "response": data,
                    "message_id": data.get("id")
                }
            except httpx.HTTPStatusError as e:
                logger.error(f"HTTP error sending SMS to {to}: {e.response.text}")
                return {
                    "status": "failed",
                    "status_code": e.response.status_code,
                    "error": str(e),
                    "response": e.response.text
                }
            except Exception as e:
                logger.error(f"Unexpected error sending SMS to {to}: {e}")
                return {
                    "status": "failed",
                    "status_code": 0,
                    "error": str(e)
                }
