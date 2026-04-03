import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..core.config import settings
import logging

logger = logging.getLogger(__name__)

def send_otp_email(recipient_email: str, otp: str):
    """
    Sends an OTP email using SMTP.
    If SMTP_USER is not set, it logs the OTP to the console.
    """
    subject = f"{settings.EMAILS_FROM_NAME} - Password Reset OTP"
    body = f"""
    <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #10b981; text-align: center;">SmartRecipe Password Reset</h2>
                <p>Hello,</p>
                <p>You requested a password reset. Please use the following One-Time Password (OTP) to reset your password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #10b981; background: #f0fdf4; padding: 10px 20px; border-radius: 5px; border: 1px dashed #10b981;">
                        {otp}
                    </span>
                </div>
                <p>This OTP is valid for 10 minutes. If you did not request this, please ignore this email.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #888; text-align: center;">
                    &copy; 2026 SmartRecipe. All rights reserved.
                </p>
            </div>
        </body>
    </html>
    """

    if not settings.SMTP_USER:
        logger.warning(f"SMTP_USER not set. OTP for {recipient_email}: {otp}")
        print(f"\n[DEV MODE] OTP for {recipient_email}: {otp}\n")
        return True

    msg = MIMEMultipart()
    msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
    msg["To"] = recipient_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        logger.info(f"OTP email sent to {recipient_email}")
        return True
    except Exception as e:
        logger.error(f"Error sending OTP email: {str(e)}")
        # In dev, still print the OTP even if SMTP fails
        print(f"\n[ERROR/DEV] SMTP Fail. OTP for {recipient_email}: {otp}\n")
        return False
