import requests
import sys

BASE_URL = "http://localhost:8001/api"

def test_auth_flow():
    email = "test_auth_flow@example.com"
    password = "password123"
    new_password = "password456"

    print(f"1. Registering user {email}...")
    res = requests.post(f"{BASE_URL}/auth/register", json={"email": email, "password": password})
    if res.status_code != 200:
        # Maybe user exists from previous run, try login
        print("   User might exist, trying login to delete first...")
        res = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
        if res.status_code == 200:
            token = res.json()["access_token"]
            requests.delete(f"{BASE_URL}/auth/me", headers={"Authorization": f"Bearer {token}"})
            print("   Deleted old user. Registering again...")
            res = requests.post(f"{BASE_URL}/auth/register", json={"email": email, "password": password})
    
    assert res.status_code == 200, f"Register failed: {res.text}"
    token = res.json()["access_token"]
    user_id = res.json()["user"]["id"]
    print("   Registration successful.")

    print("2. Changing password...")
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.post(f"{BASE_URL}/auth/change-password", headers=headers, json={
        "current_password": password,
        "new_password": new_password
    })
    assert res.status_code == 200, f"Change password failed: {res.text}"
    print("   Password changed.")

    print("3. Verifying old password fails...")
    res = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
    assert res.status_code == 401, "Old password should not work"
    print("   Old password rejected.")

    print("4. Verifying new password works...")
    res = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": new_password})
    assert res.status_code == 200, "New password should work"
    new_token = res.json()["access_token"]
    print("   New password accepted.")

    print("5. Deleting account...")
    res = requests.delete(f"{BASE_URL}/auth/me", headers={"Authorization": f"Bearer {new_token}"})
    assert res.status_code == 200, f"Delete account failed: {res.text}"
    print("   Account deleted.")

    print("6. Verifying login fails after delete...")
    res = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": new_password})
    assert res.status_code == 401, "Login should fail after delete"
    print("   Login rejected.")

    print("7. Verifying re-registration...")
    res = requests.post(f"{BASE_URL}/auth/register", json={"email": email, "password": password})
    assert res.status_code == 200, "Re-registration should work"
    print("   Re-registration successful.")

    print("\nALL BACKEND TESTS PASSED!")

if __name__ == "__main__":
    try:
        test_auth_flow()
    except Exception as e:
        print(f"\nTEST FAILED: {e}")
        sys.exit(1)
