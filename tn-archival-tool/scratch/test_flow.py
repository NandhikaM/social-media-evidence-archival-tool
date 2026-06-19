import asyncio
import httpx
import time
import sys
import os

# We will test the login, request creation, queueing, and completion flow
BACKEND_URL = "http://localhost:8000/api/v1"

async def main():
    print("Starting integration test...")
    
    # 1. Login
    async with httpx.AsyncClient() as client:
        print("Attempting to login as User_1...")
        login_res = await client.post(
            f"{BACKEND_URL}/auth/login",
            data={"username": "User_1", "password": "password123"}
        )
        if login_res.status_code != 200:
            print(f"Login failed: {login_res.status_code} - {login_res.text}")
            sys.exit(1)
            
        token = login_res.json()["access_token"]
        print("Login successful! Token acquired.")
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Create an Archive Request pointing to our local mock Instagram post
        request_payload = {
            "case_number": "CYB-2026-888",
            "fir_number": "88/2026",
            "district": "Coimbatore City",
            "priority": "urgent",
            "url": "http://localhost:8000/evidence/mock_insta_post.html",
            "platform": "instagram",
            "target_handle": "@evidence_poster",
            "justification": "E2E Instagram media download integration test"
        }
        
        print("Creating a new archival request for mock Instagram post...")
        req_res = await client.post(
            f"{BACKEND_URL}/requests/",
            json=request_payload,
            headers=headers
        )
        
        if req_res.status_code != 200:
            print(f"Failed to create request: {req_res.status_code} - {req_res.text}")
            sys.exit(1)
            
        req_data = req_res.json()
        request_id = req_data["id"]
        print(f"Archival request created successfully! Request ID: {request_id}")
        
        # 3. Poll for status
        print("Polling request status... Waiting for worker to process...")
        max_attempts = 15
        for attempt in range(1, max_attempts + 1):
            await asyncio.sleep(2)
            
            # Query all requests and find our ID
            list_res = await client.get(f"{BACKEND_URL}/requests/", headers=headers)
            if list_res.status_code != 200:
                print(f"Failed to list requests: {list_res.text}")
                continue
                
            requests_list = list_res.json()
            matching_req = next((r for r in requests_list if r["id"] == request_id), None)
            
            if not matching_req:
                print("Request not found in list!")
                continue
                
            status = matching_req["status"]
            print(f"Attempt {attempt}/{max_attempts}: Status is '{status}'")
            
            if status == "completed":
                print("Success! Request status changed to completed.")
                break
            elif status == "failed":
                print(f"Failed! Request status changed to failed.")
                sys.exit(1)
        else:
            print("Timeout waiting for request to complete!")
            sys.exit(1)
            
        # 4. Fetch the record details to check evidence
        print("Fetching record list to check evidence files...")
        rec_list_res = await client.get(f"{BACKEND_URL}/records/", headers=headers)
        if rec_list_res.status_code != 200:
            print(f"Failed to fetch records list: {rec_list_res.text}")
            sys.exit(1)
            
        records = rec_list_res.json()
        matching_record = next((r for r in records if r["request_id"] == request_id), None)
        
        if not matching_record:
            print(f"No database record found for request ID {request_id}!")
            sys.exit(1)
            
        print("Record details found in database:")
        print(f"  Record ID: {matching_record['id']}")
        print(f"  Screenshot Path: {matching_record['screenshot_path']}")
        print(f"  HTML Path: {matching_record['html_path']}")
        print(f"  SHA256 Hash: {matching_record['sha256_hash']}")
        print(f"  Is Verified: {matching_record['is_verified']}")
        print("  Metadata details:")
        meta = matching_record["metadata"]
        for k, v in meta.items():
            if k != "browser_logs" and k != "downloaded_media":
                print(f"    {k}: {v}")
                
        # 5. Check if downloaded media files are listed in metadata
        downloaded_media = meta.get("downloaded_media", [])
        print(f"\nDownloaded Media Attachments Count: {len(downloaded_media)}")
        if len(downloaded_media) < 2:
            print(f"Error: Expected at least 2 media files (1 image + 1 video), found {len(downloaded_media)}")
            sys.exit(1)
            
        # 6. Check if static files and media files exist and are downloadable
        print("\nChecking if evidence files and media files are downloadable...")
        sc_res = await client.get(f"http://localhost:8000/{matching_record['screenshot_path']}")
        print(f"  Screenshot download response: {sc_res.status_code} (size: {len(sc_res.content)} bytes)")
        
        html_res = await client.get(f"http://localhost:8000/{matching_record['html_path']}")
        print(f"  HTML download response: {html_res.status_code} (size: {len(html_res.content)} bytes)")
        
        for idx, media in enumerate(downloaded_media):
            print(f"  Media File {idx + 1}:")
            print(f"    Type: {media['type']}")
            print(f"    Path: {media['path']}")
            print(f"    SHA256: {media['sha256']}")
            
            med_res = await client.get(f"http://localhost:8000/{media['path']}")
            print(f"    Download response: {med_res.status_code} (size: {len(med_res.content)} bytes)")
            
            if med_res.status_code != 200:
                print(f"Error: Media file {media['path']} failed to download!")
                sys.exit(1)
        
        if sc_res.status_code == 200 and html_res.status_code == 200:
            print("\n*** INTEGRATION TEST PASSED SUCCESSFULLY! ***")
            print("Automatic media downloads, hashing, metadata creation, and file serving are working perfectly!")
        else:
            print("\n*** INTEGRATION TEST FAILED ON EVIDENCE DOWNLOADS! ***")
            sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
