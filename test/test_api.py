import requests
import time

try:
    print("Testing /templates endpoint...")
    response = requests.get("http://127.0.0.1:8000/templates")
    print(f"Status: {response.status_code}")
    print(f"Content: {response.json()}")
    
    print("\nTesting /batches endpoint...")
    response = requests.get("http://127.0.0.1:8000/batches")
    print(f"Status: {response.status_code}")
except Exception as e:
    print(f"Error: {e}")
