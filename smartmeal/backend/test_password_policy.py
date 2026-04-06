import asyncio
import sys
import os

# Add the app directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.utils.password_utils import validate_password, hash_password, verify_password, check_password_reuse

def test_validation():
    print("--- Testing Validation ---")
    
    # Test valid password
    errors = validate_password("Pass1234!@#$")
    print(f"Valid password: {errors} (Expected: [])")
    assert len(errors) == 0
    
    # Test short password
    errors = validate_password("Pass1!")
    print(f"Short password: {errors} (Expected error for length)")
    assert any("at least 12 characters" in e for e in errors)
    
    # Test missing uppercase
    errors = validate_password("pass12345678!")
    print(f"Missing uppercase: {errors} (Expected error for uppercase)")
    assert any("uppercase letter" in e for e in errors)
    
    # Test missing lowercase
    errors = validate_password("PASS12345678!")
    print(f"Missing lowercase: {errors} (Expected error for lowercase)")
    assert any("lowercase letter" in e for e in errors)
    
    # Test missing number
    errors = validate_password("PassWord!!!!!!")
    print(f"Missing number: {errors} (Expected error for number)")
    assert any("number" in e for e in errors)
    
    # Test missing special
    errors = validate_password("PassWord12345")
    print(f"Missing special: {errors} (Expected error for special)")
    assert any("special character" in e for e in errors)
    
    # Test containing user data
    user_data = {"name": "Raashidh", "email": "raashidh@example.com"}
    errors = validate_password("Raashidh1234!", user_data)
    print(f"Contains name: {errors} (Expected error for name)")
    assert any("contain your name" in e for e in errors)
    
    errors = validate_password("raashidh1234!", user_data)
    print(f"Contains username: {errors} (Expected error for username)")
    assert any("contain your username" in e for e in errors)
    
    # Test common password
    errors = validate_password("Password123!")
    print(f"Common password: {errors} (Expected error for common password)")
    assert any("common, weak password" in e for e in errors)

def test_hashing():
    print("\n--- Testing Hashing ---")
    password = "StrongPassword123!"
    hashed = hash_password(password)
    print(f"Hashed: {hashed}")
    
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword123!", hashed) is False
    print("Hashing and verification successful")

def test_reuse():
    print("\n--- Testing Password Reuse ---")
    password = "StrongPassword123!"
    hashed = hash_password(password)
    history = [hashed]
    
    assert check_password_reuse(password, history) is True
    assert check_password_reuse("AnotherPassword123!", history) is False
    print("Password reuse check successful")

if __name__ == "__main__":
    try:
        test_validation()
        test_hashing()
        test_reuse()
        print("\nALL TESTS PASSED!")
    except AssertionError as e:
        print(f"\nTEST FAILED!")
        sys.exit(1)
    except Exception as e:
        print(f"\nAN ERROR OCCURRED: {e}")
        sys.exit(1)
