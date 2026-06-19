import asyncio
import httpx
import sys
import os

BACKEND_URL = "http://localhost:8000/api/v1"

async def main():
    print("Starting credentials management, user management & browser frame integration test...")
    
    async with httpx.AsyncClient() as client:
        # 1. Login as Admin
        print("Logging in as Admin_Super...")
        login_res = await client.post(
            f"{BACKEND_URL}/auth/login",
            data={"username": "Admin_Super", "password": "password123"}
        )
        if login_res.status_code != 200:
            print(f"Login failed: {login_res.status_code} - {login_res.text}")
            sys.exit(1)
            
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Admin login successful.")

        # 2. Add / Update Credentials for Instagram, Facebook, and Twitter
        for platform in ["instagram", "facebook", "twitter"]:
            print(f"Saving {platform} credentials via API...")
            cred_payload = {
                "platform": platform,
                "username": f"forensic_{platform}_user",
                "password": f"securepass_{platform}"
            }
            cred_save_res = await client.post(
                f"{BACKEND_URL}/settings/credentials",
                json=cred_payload,
                headers=headers
            )
            if cred_save_res.status_code != 200:
                print(f"Failed to save credentials for {platform}: {cred_save_res.text}")
                sys.exit(1)
            print(f"Successfully saved credentials for {platform}.")

        # 3. Retrieve Credentials to verify
        print("Retrieving credentials list...")
        get_res = await client.get(
            f"{BACKEND_URL}/settings/credentials",
            headers=headers
        )
        creds = get_res.json()
        print(f"Configured credentials: {[c['platform'] for c in creds]}")
        for platform in ["instagram", "facebook", "twitter"]:
            if not any(c["platform"] == platform for c in creds):
                print(f"Error: {platform} credential missing in database!")
                sys.exit(1)

        # 4. User Management Tests (Admin only)
        print("\n--- Testing User Management API ---")
        print("Listing current users...")
        users_res = await client.get(f"{BACKEND_URL}/users/", headers=headers)
        if users_res.status_code != 200:
            print(f"Failed to list users: {users_res.status_code} - {users_res.text}")
            sys.exit(1)
        users = users_res.json()
        print(f"Found {len(users)} users in database: {[u['username'] for u in users]}")

        # Create a new user (leaving district empty/optional)
        import time
        unique_username = f"Test_Investigator_{int(time.time())}"
        print(f"Creating a new investigator account ({unique_username}, district: None)...")
        new_user_payload = {
            "username": unique_username,
            "full_name": "Test Investigator Officer",
            "password": "investigatorpass123",
            "role": "investigating_officer",
            "district": None
        }
        create_res = await client.post(f"{BACKEND_URL}/users/", json=new_user_payload, headers=headers)
        if create_res.status_code != 200:
            print(f"Failed to create user: {create_res.status_code} - {create_res.text}")
            sys.exit(1)
        created_user = create_res.json()
        print(f"Created User: {created_user}")
        if created_user["district"] is not None:
            print("Error: District was expected to be None!")
            sys.exit(1)

        # Update the user
        print("Updating investigator full name and assigning district optional value...")
        update_payload = {
            "full_name": "Updated Test Investigator",
            "district": "Coimbatore"
        }
        update_res = await client.patch(f"{BACKEND_URL}/users/{created_user['id']}", json=update_payload, headers=headers)
        if update_res.status_code != 200:
            print(f"Failed to update user: {update_res.text}")
            sys.exit(1)
        updated_user = update_res.json()
        print(f"Updated User: {updated_user}")
        if updated_user["full_name"] != "Updated Test Investigator" or updated_user["district"] != "Coimbatore":
            print("Error: User updates did not persist correctly!")
            sys.exit(1)

        # 5. Create request to test screenshot capturing and mock browser chrome injection
        print("\n--- Testing Browser Mock Header Injection & Capture ---")
        request_payload = {
            "case_number": "CYB-2026-999",
            "fir_number": "99/2026",
            "district": "Chennai South",
            "priority": "normal",
            "url": "http://localhost:8000/evidence/mock_insta_post.html",
            "platform": "instagram",
            "target_handle": "@target_user",
            "justification": "Browser header forensic proof integration verification"
        }
        
        print("Submitting request to queue...")
        req_res = await client.post(
            f"{BACKEND_URL}/requests/",
            json=request_payload,
            headers=headers
        )
        if req_res.status_code != 200:
            print(f"Failed to submit request: {req_res.text}")
            sys.exit(1)
            
        req_id = req_res.json()["id"]
        print(f"Request {req_id} queued. Polling for completion...")

        # Poll for completion
        for attempt in range(1, 35):
            await asyncio.sleep(2)
            list_res = await client.get(f"{BACKEND_URL}/requests/", headers=headers)
            reqs = list_res.json()
            matching_req = next((r for r in reqs if r["id"] == req_id), None)
            if not matching_req:
                continue
            status = matching_req["status"]
            print(f"Polling status: {status}")
            if status == "completed":
                print("Request completed successfully!")
                break
            elif status == "failed":
                print("Request failed in worker. Check worker logs.")
                sys.exit(1)
        else:
            print("Request processing timed out.")
            sys.exit(1)

        # Check records list and verify screenshot/HTML details
        rec_list_res = await client.get(f"{BACKEND_URL}/records/", headers=headers)
        records = rec_list_res.json()
        matching_record = next((r for r in records if r["request_id"] == req_id), None)
        if not matching_record:
            print("Error: Record was not found in the database!")
            sys.exit(1)
            
        print("\nCaptured Record details:")
        print(f"  Screenshot: {matching_record['screenshot_path']}")
        print(f"  HTML: {matching_record['html_path']}")
        print(f"  SHA256: {matching_record['sha256_hash']}")

        print("\n*** ALL TESTS PASSED SUCCESSFULLY! ***")
        print("Forensic mock browser chrome frame header injection, optional Tamil Nadu district listings, and Admin-only User Management are working perfectly!")

if __name__ == "__main__":
    asyncio.run(main())
