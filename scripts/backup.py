"""
Database Backup Script
Runs daily to backup PostgreSQL database and clean old backups.
"""

import os
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path
from loguru import logger

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.config import settings
from app.notifications.alerter import Alerter


def run_backup():
    """Execute database backup using pg_dump."""
    backup_dir = Path(settings.backup_dir)
    backup_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = backup_dir / f"datapulse_backup_{timestamp}.sql.gz"

    logger.info(f"Starting database backup to {backup_file}")

    # Build pg_dump command
    env = os.environ.copy()
    env["PGPASSWORD"] = settings.postgres_password

    cmd = [
        "pg_dump",
        "-h", settings.postgres_host,
        "-p", str(settings.postgres_port),
        "-U", settings.postgres_user,
        "-d", settings.postgres_db,
        "--no-owner",
        "--no-acl",
        "--compress=9",  # gzip compression level 9
        "-f", str(backup_file),
    ]

    try:
        result = subprocess.run(
            cmd,
            env=env,
            capture_output=True,
            text=True,
            timeout=300,  # 5 minute timeout
        )

        if result.returncode == 0:
            file_size = backup_file.stat().st_size
            logger.success(f"Backup completed: {backup_file} ({file_size:,} bytes)")

            # Send success notification
            alerter = Alerter()
            import asyncio
            asyncio.run(alerter.send_backup_alert(
                success=True,
                backup_path=str(backup_file)
            ))

            # Clean old backups
            clean_old_backups(backup_dir)

            return True
        else:
            logger.error(f"Backup failed: {result.stderr}")
            alerter = Alerter()
            import asyncio
            asyncio.run(alerter.send_backup_alert(
                success=False,
                error=result.stderr
            ))
            return False

    except subprocess.TimeoutExpired:
        logger.error("Backup timed out after 5 minutes")
        return False
    except Exception as e:
        logger.error(f"Backup failed with exception: {e}")
        return False


def clean_old_backups(backup_dir: Path):
    """Remove backup files older than retention period."""
    retention_days = settings.backup_retention_days
    cutoff = datetime.now() - timedelta(days=retention_days)
    removed = 0

    for backup_file in backup_dir.glob("datapulse_backup_*.sql.gz"):
        file_time = datetime.fromtimestamp(backup_file.stat().st_mtime)
        if file_time < cutoff:
            backup_file.unlink()
            removed += 1
            logger.info(f"Removed old backup: {backup_file}")

    if removed > 0:
        logger.info(f"Cleaned {removed} old backup(s)")
    else:
        logger.debug("No old backups to clean")


def main():
    """Main entry point for backup script."""
    logger.info("=" * 50)
    logger.info("DataPulse Database Backup")
    logger.info(f"Time: {datetime.now().isoformat()}")
    logger.info("=" * 50)

    success = run_backup()

    if success:
        logger.success("Backup process completed successfully")
        sys.exit(0)
    else:
        logger.error("Backup process failed")
        sys.exit(1)


if __name__ == "__main__":
    main()