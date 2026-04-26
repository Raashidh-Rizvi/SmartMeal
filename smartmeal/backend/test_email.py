import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from pathlib import Path

# Load env manually
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path, override=True)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

print(f"Testing with: {SMTP_USER} on {SMTP_HOST}:{SMTP_PORT}")

msg = MIMEMultipart()
msg["From"] = SMTP_USER
msg["To"] = SMTP_USER  # Send to self for test
msg["Subject"] = "SmartRecipe Email Test"
msg.attach(MIMEText("This is a test email from SmartRecipe backend.", "plain"))

try:
    print("Connecting to server...")
    server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
    print("Starting TLS...")
    server.starttls()
    print("Logging in...")
    server.login(SMTP_USER, SMTP_PASSWORD)
    print("Sending message...")
    server.send_message(msg)
    server.quit()
    print("SUCCESS: Email sent successfully!")
except Exception as e:
    print(f"FAILURE: {str(e)}")
