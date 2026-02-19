"""
Email Service

Handles sending emails with support for multiple providers
"""

import html as html_module
import logging
import os
from typing import Any, Optional

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails"""

    def __init__(self):
        self.provider = os.getenv("EMAIL_PROVIDER", "smtp")  # smtp, sendgrid, aws_ses
        self.from_email = os.getenv("EMAIL_FROM", "noreply@10x.local")
        self.from_name = os.getenv("EMAIL_FROM_NAME", "10x PM")

    def send_invitation_email(
        self,
        to_email: str,
        invite_link: str,
        inviter_name: str,
        role: str,
        org_name: str,
        personal_message: Optional[str] = None,
    ) -> bool:
        """
        Send invitation email to new user.

        Args:
            to_email: Recipient email
            invite_link: Invitation acceptance link
            inviter_name: Name of person who sent invite
            role: Role being offered
            org_name: Organization name
            personal_message: Optional personal message

        Returns:
            True if sent successfully
        """
        try:
            subject = f"You're invited to join {org_name} on 10x PM"

            # Build email body
            html_body = self._build_invitation_html(
                invite_link=invite_link,
                inviter_name=inviter_name,
                role=role,
                org_name=org_name,
                personal_message=personal_message,
            )

            text_body = self._build_invitation_text(
                invite_link=invite_link,
                inviter_name=inviter_name,
                role=role,
                org_name=org_name,
                personal_message=personal_message,
            )

            # Send via selected provider
            if self.provider == "smtp":
                return self._send_via_smtp(to_email, subject, html_body, text_body)
            elif self.provider == "sendgrid":
                return self._send_via_sendgrid(to_email, subject, html_body, text_body)
            elif self.provider == "aws_ses":
                return self._send_via_aws_ses(to_email, subject, html_body, text_body)
            else:
                logger.warning(f"Unknown email provider: {self.provider}")
                return False

        except Exception as e:
            logger.error(f"Failed to send invitation email: {e}", exc_info=True)
            return False

    def send_verification_email(
        self,
        to_email: str,
        display_name: str,
        token: str,
        base_url: str,
    ) -> bool:
        """
        Send email verification link to a newly registered user.

        Args:
            to_email: Recipient email address
            display_name: User's display name
            token: Secure verification token
            base_url: Application base URL (e.g. http://localhost:3737)

        Returns:
            True if sent successfully
        """
        try:
            verify_link = f"{base_url}/verify-email?token={token}"
            subject = "Verify your 10x PM email address"

            html_body = self._build_verification_html(display_name, verify_link)
            text_body = self._build_verification_text(display_name, verify_link)

            if self.provider == "smtp":
                return self._send_via_smtp(to_email, subject, html_body, text_body)
            elif self.provider == "sendgrid":
                return self._send_via_sendgrid(to_email, subject, html_body, text_body)
            elif self.provider == "aws_ses":
                return self._send_via_aws_ses(to_email, subject, html_body, text_body)
            else:
                logger.warning(f"Unknown email provider: {self.provider}")
                return False

        except Exception as e:
            logger.error(f"Failed to send verification email: {e}", exc_info=True)
            return False

    def _send_via_smtp(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str,
    ) -> bool:
        """Send email via SMTP (Gmail, etc.)"""
        try:
            import smtplib
            from email.mime.multipart import MIMEMultipart
            from email.mime.text import MIMEText

            smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
            smtp_port = int(os.getenv("SMTP_PORT", "587"))
            smtp_user = os.getenv("SMTP_USER")
            smtp_password = os.getenv("SMTP_PASSWORD")

            if not smtp_user or not smtp_password:
                logger.warning("SMTP credentials not configured")
                logger.info(f"Email not sent (no SMTP configured). Content:\n{text_body}")
                return False

            # Create message
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = to_email

            # Attach text and HTML
            msg.attach(MIMEText(text_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))

            # Send email
            with smtplib.SMTP(smtp_host, smtp_port) as server:
                server.starttls()
                server.login(smtp_user, smtp_password)
                server.send_message(msg)

            logger.info(f"Invitation email sent via SMTP to {to_email}")
            return True

        except Exception as e:
            logger.error(f"SMTP send failed: {e}", exc_info=True)
            return False

    def _send_via_sendgrid(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str,
    ) -> bool:
        """Send email via SendGrid"""
        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail

            api_key = os.getenv("SENDGRID_API_KEY")

            if not api_key:
                logger.warning("SendGrid API key not configured")
                return False

            message = Mail(
                from_email=(self.from_email, self.from_name),
                to_emails=to_email,
                subject=subject,
                html_content=html_body,
                plain_text_content=text_body,
            )

            sg = SendGridAPIClient(api_key)
            response = sg.send(message)

            logger.info(f"Invitation email sent via SendGrid to {to_email}")
            return response.status_code == 202

        except Exception as e:
            logger.error(f"SendGrid send failed: {e}", exc_info=True)
            return False

    def _send_via_aws_ses(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str,
    ) -> bool:
        """Send email via AWS SES"""
        try:
            import boto3

            aws_region = os.getenv("AWS_REGION", "us-east-1")
            client = boto3.client("ses", region_name=aws_region)

            response = client.send_email(
                Source=f"{self.from_name} <{self.from_email}>",
                Destination={"ToAddresses": [to_email]},
                Message={
                    "Subject": {"Data": subject},
                    "Body": {
                        "Text": {"Data": text_body},
                        "Html": {"Data": html_body},
                    },
                },
            )

            logger.info(f"Invitation email sent via AWS SES to {to_email}")
            return True

        except Exception as e:
            logger.error(f"AWS SES send failed: {e}", exc_info=True)
            return False

    def _build_verification_html(self, display_name: str, verify_link: str) -> str:
        """Build HTML template for email verification."""
        safe_name = html_module.escape(display_name)
        safe_link = html_module.escape(verify_link)
        return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #C0745F; font-size: 32px; margin: 0;">10x PM</h1>
            <p style="color: #64748b; margin: 10px 0 0 0;">Project Management</p>
        </div>
        <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px;">Verify your email address</h2>
            <p style="color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
                Hi <strong>{safe_name}</strong>, thanks for signing up! Click the button below to verify your email address.
            </p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="{safe_link}" style="display: inline-block; background: linear-gradient(135deg, #C0745F 0%, #D4917A 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Verify Email
                </a>
            </div>
            <p style="color: #94a3b8; font-size: 12px; margin: 20px 0 0 0; text-align: center;">
                Or copy this link: <a href="{safe_link}" style="color: #C0745F; text-decoration: none;">{safe_link}</a>
            </p>
        </div>
        <div style="text-align: center; margin-top: 32px; color: #94a3b8; font-size: 12px;">
            <p>This link expires in 24 hours.</p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
        </div>
    </div>
</body>
</html>
"""

    def _build_verification_text(self, display_name: str, verify_link: str) -> str:
        """Build plain text template for email verification."""
        return f"""
Verify your 10x PM email address

Hi {display_name}, thanks for signing up!

Click the link below to verify your email address:
{verify_link}

This link expires in 24 hours.

If you didn't create an account, you can safely ignore this email.

---
10x PM - Project Management
"""

    def _build_invitation_html(
        self,
        invite_link: str,
        inviter_name: str,
        role: str,
        org_name: str,
        personal_message: Optional[str],
    ) -> str:
        """Build HTML email template"""
        safe_inviter = html_module.escape(inviter_name)
        safe_org = html_module.escape(org_name)
        safe_role = html_module.escape(role.title())
        safe_link = html_module.escape(invite_link)
        personal_msg_html = (
            f'<p style="color: #64748b; font-style: italic; margin: 20px 0; padding: 15px; background: #f8fafc; border-left: 3px solid #C0745F;">"{html_module.escape(personal_message)}"</p>'
            if personal_message
            else ""
        )

        return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #C0745F; font-size: 32px; margin: 0;">10x PM</h1>
            <p style="color: #64748b; margin: 10px 0 0 0;">Project Management</p>
        </div>

        <!-- Main Content -->
        <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #1e293b; margin: 0 0 20px 0; font-size: 24px;">You've Been Invited!</h2>

            <p style="color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
                <strong>{safe_inviter}</strong> has invited you to join <strong>{safe_org}</strong> on 10x PM as a <strong style="color: #C0745F;">{safe_role}</strong>.
            </p>

            {personal_msg_html}

            <p style="color: #475569; line-height: 1.6; margin: 20px 0;">
                Click the button below to accept the invitation and create your account:
            </p>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 32px 0;">
                <a href="{safe_link}" style="display: inline-block; background: linear-gradient(135deg, #C0745F 0%, #D4917A 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Accept Invitation
                </a>
            </div>

            <!-- Link fallback -->
            <p style="color: #94a3b8; font-size: 12px; margin: 20px 0 0 0; text-align: center;">
                Or copy this link: <a href="{safe_link}" style="color: #C0745F; text-decoration: none;">{safe_link}</a>
            </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px; color: #94a3b8; font-size: 12px;">
            <p>This invitation expires in 7 days.</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
    </div>
</body>
</html>
"""

    def _build_invitation_text(
        self,
        invite_link: str,
        inviter_name: str,
        role: str,
        org_name: str,
        personal_message: Optional[str],
    ) -> str:
        """Build plain text email template"""
        personal_msg_text = f'\n\n"{personal_message}"\n' if personal_message else ""

        return f"""
You've Been Invited to 10x PM!

{inviter_name} has invited you to join {org_name} as a {role.title()}.
{personal_msg_text}

Accept your invitation by clicking this link:
{invite_link}

This invitation expires in 7 days.

If you didn't expect this invitation, you can safely ignore this email.

---
10x PM - Project Management
"""
