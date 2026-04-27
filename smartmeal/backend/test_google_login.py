import requests

def test_google_login():
    url = "http://localhost:8001/api/auth/google"
    payload = {
        "email": "raashidhrizvi03@gmail.com",
        "name": "Raashidh Rizvi",
        "firebaseToken": "mock_token",
        "uid": "mock_uid"
    }
    
    try:
        response = requests.post(url, json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_google_login()
