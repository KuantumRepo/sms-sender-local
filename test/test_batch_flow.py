import httpx
import asyncio
import os

# Create a dummy CSV file
csv_content = """phone
2025550100
2025550101
2025550102
"""
files = {'file': ('test.csv', csv_content, 'text/csv')}

async def test_batch_flow():
    base_url = "http://localhost:8000"
    
    async with httpx.AsyncClient() as client:
        print("1. Creating Batch...")
        try:
            resp = await client.post(
                f"{base_url}/batches", 
                data={"template_key": "vee_pee_AMAZON_UPDATE"}, 
                files=files,
                timeout=10.0
            ) 
            resp.raise_for_status()
            batch = resp.json()
            batch_id = batch['id']
            print(f"Batch Created: ID={batch_id}, Status={batch['status']}")
        except Exception as e:
            print(f"Failed to create batch: {e}")
            if 'resp' in locals(): print(resp.text)
            return

        print("\n2. Polling Batch Status...")
        for _ in range(5):
            await asyncio.sleep(1)
            resp = await client.get(f"{base_url}/batches/{batch_id}")
            data = resp.json()
            print(f"Time={_}s | Status={data['status']} | Success={data['success_count']} | Failed={data['failure_count']}")
            
            if data['status'] in ['completed', 'failed']:
                break
        
        print("\n3. Final Batch Details:")
        print(data)

if __name__ == "__main__":
    asyncio.run(test_batch_flow())
