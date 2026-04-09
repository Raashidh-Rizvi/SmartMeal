import re
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from typing import List, Optional

ph = PasswordHasher()

# Top 100 common passwords (simplified for this implementation)
# In a real-world scenario, this would be a much larger list from a database or file.
COMMON_PASSWORDS = {
    "password", "123456", "123456789", "12345", "12345678", "qwerty", "password123",
    "111111", "admin", "123123", "abc123", "password!", "password123!", "welcome",
    "p@ssword", "login", "secret", "smartrecipe", "smartmeal", "user123",
}

def validate_password(password: str, user_data: dict = {}) -> List[str]:
    """
    Validates a password against the policy:
    - 12-64 characters
    - 1 uppercase, 1 lowercase, 1 number, 1 special character
    - Not containing user name, email, or app name
    - Not in the common password list
    """
    errors = []
    
    # Length check
    if len(password) < 12:
        errors.append("Password must be at least 12 characters long")
    if len(password) > 64:
        errors.append("Password must not exceed 64 characters")
        
    # Character types check
    if not re.search(r"[A-Z]", password):
        errors.append("Password must include at least one uppercase letter")
    if not re.search(r"[a-z]", password):
        errors.append("Password must include at least one lowercase letter")
    if not re.search(r"\d", password):
        errors.append("Password must include at least one number")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        errors.append("Password must include at least one special character")
        
    # User data check
    app_name = "smartrecipe"
    if app_name in password.lower():
        errors.append("Password must not contain the application name")
        
    if user_data:
        name = user_data.get("name", "").lower()
        email = user_data.get("email", "").lower()
        username = email.split("@")[0] if "@" in email else ""
        
        if name and name in password.lower():
            errors.append("Password must not contain your name")
        if email and email in password.lower():
            errors.append("Password must not contain your email")
        if username and username in password.lower():
            errors.append("Password must not contain your username")
            
    # Common password check
    if password.lower() in COMMON_PASSWORDS:
        errors.append("This is a common, weak password. Please choose a more unique one.")
        
    return errors

def hash_password(password: str) -> str:
    """Hashes a password using Argon2id."""
    return ph.hash(password)

def verify_password(password: str, hashed: str) -> bool:
    """Verifies a password against an Argon2id hash."""
    try:
        return ph.verify(hashed, password)
    except (VerifyMismatchError, Exception):
        return False

def check_password_reuse(new_password: str, history: List[str]) -> bool:
    """Checks if the new password matches any in the history of Argon2id hashes."""
    for old_hash in history:
        if verify_password(new_password, old_hash):
            return True
    return False
