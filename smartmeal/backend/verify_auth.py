import logging
logging.basicConfig(level=logging.INFO)

from fastapi.testclient import TestClient
from app.main import app
import uuid

def run_tests():
    test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    
    with TestClient(app) as client:
        print("Testing /auth/register...")
        res = client.post("/auth/register", json={
            "name": "Test User",
            "email": test_email,
            "password": "testpassword123"
        })
        print("Register Status:", res.status_code)
        print("Register Response:", res.text)
        
        if res.status_code != 201:
            print("Failed to register!")
            return

        print("\nTesting /auth/login...")
        res2 = client.post("/auth/login", data={
            "username": test_email,
            "password": "testpassword123"
        })
        print("Login Status:", res2.status_code)
        print("Login Response:", res2.text)
        
        if res2.status_code == 200:
            token = res2.json()["accessToken"]
            print("\nTesting /auth/me...")
            res3 = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
            print("Me Status:", res3.status_code)
            print("Me Response:", res3.text)
            
            print("\nTesting /users/me update...")
            res4 = client.put("/users/me", headers={"Authorization": f"Bearer {token}"}, json={
                "name": "Updated Test User",
                "email": test_email,
                "preferences": {
                    "dietType": "veg",
                    "allergies": ["peanuts"],
                    "cuisinePreferences": ["Italian"],
                    "budgetLevel": "medium",
                    "householdSize": 2
                }
            })
            print("Update Status:", res4.status_code)
            print("Update Response:", res4.text)

if __name__ == "__main__":
    run_tests()
