import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..core.config import settings
import logging

logger = logging.getLogger(__name__)

# ── Notification type → colour + icon mapping ─────────────────────────────────
_TYPE_STYLE = {
    "EXPIRING_FOOD":        ("#f59e0b", "⚠️",  "Expiring Food Alert"),
    "EXPIRING_LEFTOVER":    ("#f97316", "🍽️",  "Leftover Expiry Alert"),
    "BUDGET_OVER":          ("#ef4444", "🚨",  "Budget Exceeded"),
    "BUDGET_WARNING":       ("#f59e0b", "💸",  "Budget Warning"),
}

def _type_meta(notif_type: str):
    for key, val in _TYPE_STYLE.items():
        if notif_type.startswith(key):
            return val
    if notif_type.startswith("MEAL_MISSING"):
        return ("#ef4444", "⚠️", "Missing Ingredients Alert")
    if notif_type.startswith("MEAL_REMINDER"):
        return ("#3b82f6", "📅", "Meal Reminder")
    return ("#10b981", "🔔", "SmartMeal Notification")


def send_notification_email(recipient_email: str, notif_type: str, message: str):
    """
    Sends a styled HTML notification email for a single notification.
    """
    color, icon, title = _type_meta(notif_type)

    subject = f"SmartMeal — {title}"
    body = f"""
    <html>
    <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
      <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

        <!-- Header -->
        <div style="background:{color};padding:28px 32px;text-align:center;">
          <div style="font-size:40px;margin-bottom:8px;">{icon}</div>
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">{title}</h1>
        </div>

        <!-- Body -->
        <div style="padding:32px;">
          <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 24px;">
            {message}
          </p>
          <a href="http://localhost:7001" style="display:inline-block;padding:12px 28px;background:{color};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
            Open SmartMeal →
          </a>
        </div>

        <!-- Footer -->
        <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            &copy; 2025 SmartMeal &nbsp;|&nbsp; You received this because you have an active SmartMeal account.
          </p>
        </div>
      </div>
    </body>
    </html>
    """

    if not settings.SMTP_USER:
        logger.warning(f"[EMAIL] SMTP not configured. Notification for {recipient_email}: {message}")
        return False

    msg = MIMEMultipart("alternative")
    msg["From"]    = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
    msg["To"]      = recipient_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        logger.info(f"[EMAIL] Notification sent to {recipient_email} — {title}")
        return True
    except Exception as e:
        logger.error(f"[EMAIL] Failed to send notification to {recipient_email}: {e}")
        return False


def send_digest_email(recipient_email: str, notifications: list):
    """
    Sends a single digest email containing multiple notifications.
    Used when several new alerts fire at once.
    """
    if not notifications:
        return False

    rows = ""
    for n in notifications:
        color, icon, title = _type_meta(n.get("type", ""))
        rows += f"""
        <tr>
          <td style="padding:14px 16px;border-bottom:1px solid #f3f4f6;">
            <span style="font-size:20px;margin-right:10px;">{icon}</span>
            <span style="font-size:14px;color:#374151;">{n.get('message','')}</span>
          </td>
        </tr>"""

    subject = f"SmartMeal — You have {len(notifications)} new notification{'s' if len(notifications)>1 else ''}"
    body = f"""
    <html>
    <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
      <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <div style="background:#10b981;padding:28px 32px;text-align:center;">
          <div style="font-size:40px;margin-bottom:8px;">🔔</div>
          <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">SmartMeal Notifications</h1>
          <p style="margin:6px 0 0;color:#d1fae5;font-size:14px;">{len(notifications)} new alert{'s' if len(notifications)>1 else ''}</p>
        </div>
        <div style="padding:24px 32px;">
          <table style="width:100%;border-collapse:collapse;">
            {rows}
          </table>
          <div style="margin-top:24px;text-align:center;">
            <a href="http://localhost:7001" style="display:inline-block;padding:12px 28px;background:#10b981;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
              View All in SmartMeal →
            </a>
          </div>
        </div>
        <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            &copy; 2025 SmartMeal &nbsp;|&nbsp; You received this because you have an active SmartMeal account.
          </p>
        </div>
      </div>
    </body>
    </html>
    """

    if not settings.SMTP_USER:
        logger.warning(f"[EMAIL] SMTP not configured. Digest for {recipient_email}: {len(notifications)} items")
        return False

    msg = MIMEMultipart("alternative")
    msg["From"]    = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
    msg["To"]      = recipient_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        logger.info(f"[EMAIL] Digest sent to {recipient_email} — {len(notifications)} notifications")
        return True
    except Exception as e:
        logger.error(f"[EMAIL] Failed to send digest to {recipient_email}: {e}")
        return False

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
