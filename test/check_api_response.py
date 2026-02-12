import httpx
import asyncio

async def check_api():
    async with httpx.AsyncClient() as client:
        # 1. Get all batches
        print("--- GET /batches ---")
        resp = await client.get("http://localhost:8000/batches")
        print(resp.json())
        
        batches = resp.json()
        if batches:
            latest_batch_id = batches[0]['id']
            print(f"\n--- GET /batches/{latest_batch_id} ---")
            resp = await client.get(f"http://localhost:8000/batches/{latest_batch_id}")
            print(resp.json())

            print(f"\n--- GET /batches/{latest_batch_id}/failed ---")
            resp = await client.get(f"http://localhost:8000/batches/{latest_batch_id}/failed")
            print(resp.json())

if __name__ == "__main__":
    asyncio.run(check_api())
