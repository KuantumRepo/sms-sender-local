import asyncio
import httpx
import os
import sys

# Add project root to path
sys.path.append(os.getcwd())

from app.config import settings

async def test_provider():
    url = f"{settings.PROVIDER_BASE_URL.rstrip('/')}/api/messages/send/"
    headers = {
        "Authorization": f"Bearer {settings.PROVIDER_BEARER_TOKEN}",
    }
    
    # Payload
    payload = {
        "lead": "15551234567", # Dummy number
        "message": "Debug test message",
        "server_type": settings.VITEMOBILE_SERVER_TYPE,
        "protocol": settings.VITEMOBILE_PROTOCOL
    }

    print(f"Testing URL: {url}")
    
    # Test 1: JSON
    print("\n--- Test 1: JSON ---")
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(url, json=payload, headers=headers)
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.text}")
        except Exception as e:
            print(f"Error: {e}")

    # Test 2: Form Data
    print("\n--- Test 2: Form Data ---")
    async with httpx.AsyncClient() as client:
        try:
            # httpx.post(data=...) sends application/x-www-form-urlencoded
            resp = await client.post(url, data=payload, headers=headers)
            print(f"Status: {resp.status_code}")
            print(f"Response: {resp.text}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_provider())
