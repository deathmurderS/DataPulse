"""
Alerter / Notification Module
Sends notifications via Telegram Bot or Email based on configuration.
Supports rule-based alerts for scraping failures, anomalies, and errors.
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from loguru import logger

from app.config import settings


class Alerter:
    """Alert and notification system for DataPulse."""

    def __init__(self):
        self.enabled = settings.notification_enabled
        self.notification_type = settings.notification_type

    async def send_alert(self, title: str, message: str, level: str = "WARNING") -> bool:
        """
        Send an alert via configured notification channel.
        Returns True if sent successfully, False otherwise.
        """
        if not self.enabled:
            logger.debug(f"Notifications disabled. Would send: [{level}] {title}: {message}")
            return False

        logger.info(f"Sending alert: [{level}] {title}")

        try:
            if self.notification_type == "telegram":
                return await self._send_telegram(title, message)
            elif self.notification_type == "email":
                return await self._send_email(title, message)
            else:
                logger.warning(f"Unknown notification type: {self.notification_type}")
                return False
        except Exception as e:
            logger.error(f"Failed to send alert: {e}")
            return False

    async def _send_telegram(self, title: str, message: str) -> bool:
        """Send notification via Telegram Bot."""
        try:
            import asyncio
            from telegram import Bot

            if not settings.telegram_bot_token or not settings.telegram_chat_id:
                logger.warning("Telegram bot token or chat ID not configured")
                return False

            bot = Bot(token=settings.telegram_bot_token)
            text = f"*{title}*\n\n{message[:4000]}"  # Telegram has 4096 char limit

            await bot.send_message(
                chat_id=settings.telegram_chat_id,
                text=text,
                parse_mode="Markdown",
            )
            logger.info("Telegram alert sent successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to send Telegram alert: {e}")
            return False

    async def _send_email(self, title: str, message: str) -> bool:
        """Send notification via Email."""
        try:
            if not all([settings.smtp_host, settings.email_from, settings.email_to]):
                logger.warning("Email configuration incomplete")
                return False

            msg = MIMEMultipart()
            msg["From"] = settings.email_from
            msg["To"] = settings.email_to
            msg["Subject"] = f"[DataPulse] {title}"

            body = MIMEText(message, "plain", "utf-8")
            msg.attach(body)

            with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
                if settings.smtp_user and settings.smtp_password:
                    server.starttls()
                    server.login(settings.smtp_user, settings.smtp_password)
                server.send_message(msg)

            logger.info("Email alert sent successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to send email alert: {e}")
            return False

    async def send_scraping_failure_alert(self, source_name: str, error: str) -> bool:
        """Send alert when scraping fails."""
        title = f"Scraping Failed: {source_name}"
        message = (
            f"Source: {source_name}\n"
            f"Error: {error}\n"
            f"Time: {__import__('datetime').datetime.now().isoformat()}\n\n"
            f"Action required: Check scraper configuration and network connectivity."
        )
        return await self.send_alert(title, message, level="ERROR")

    async def send_backup_alert(self, success: bool, backup_path: str = "", error: str = "") -> bool:
        """Send alert about backup status."""
        if success:
            title = "Backup Successful"
            message = f"Database backup completed successfully.\nPath: {backup_path}"
        else:
            title = "Backup Failed"
            message = f"Database backup failed.\nError: {error}"
        return await self.send_alert(title, message, level="SUCCESS" if success else "ERROR")