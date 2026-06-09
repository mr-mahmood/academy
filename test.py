#!/usr/bin/env python3
import requests
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import Counter

DOMAIN = "https://academy.sepahansc.com/football/register"

def send_request(url):
    try:
        response = requests.get(url, timeout=5, verify=False)
        return response.status_code
    except:
        return 0

def test_endpoint_fast(name, url, requests_count):
    print(f"\n{'='*50}")
    print(f"Testing: {name}")
    print(f"Sending {requests_count} requests AS FAST AS POSSIBLE")
    print(f"{'='*50}")
    
    start_time = time.time()
    
    # Send all requests in parallel
    with ThreadPoolExecutor(max_workers=50) as executor:
        futures = [executor.submit(send_request, url) for _ in range(requests_count)]
        results = [f.result() for f in as_completed(futures)]
    
    end_time = time.time()
    duration = end_time - start_time
    
    counter = Counter(results)
    
    print(f"\n📊 Results (completed in {duration:.2f} seconds):")
    print(f"  Requests per second: {requests_count/duration:.1f}")
    print(f"  ✅ OK (200): {counter.get(200, 0)} requests")
    print(f"  ❌ Rate Limited (429): {counter.get(429, 0)} requests")
    print(f"  ⚠️ Other: {counter.get(400, 0) + counter.get(0, 0)} requests")
    
    return counter

def main():
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    
    print("🚀 FAST Rate Limiting Test")
    print("=" * 50)
    
    # Test 1: API endpoint (should hit 20/sec limit)
    test_endpoint_fast(
        "Frontend", 
        f"{DOMAIN}", 
        100, 
    )
    
    print("\n" + "=" * 50)
    print("✅ Test Complete!")
    print("If you see HTTP 429 responses, rate limiting is working!")
    print("=" * 50)

if __name__ == "__main__":
    main()