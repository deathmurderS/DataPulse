"""
Scheduler Module
Runs the scraping and ETL pipeline on a scheduled basis using APScheduler.
"""

import asyncio
from datetime import datetime
from loguru import logger
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.config import settings
from app.scraper.job_scraper import JobScraper
from app.etl.pipeline import ETLPipeline
from app.notifications.alerter import Alerter
from app.models.database import init_db


class DataPipelineScheduler:
    """Scheduler for running the data pipeline at configured intervals."""

    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.scraper = JobScraper(source_name="Remotive")
        self.etl = ETLPipeline()
        self.alerter = Alerter()
        self.pipeline_runs = 0
        self.pipeline_successes = 0

    async def run_pipeline(self):
        """Execute the complete data pipeline: scrape -> ETL -> load."""
        run_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        logger.info(f"=== Pipeline Run [{run_id}] started ===")
        self.pipeline_runs += 1

        try:
            # Step 1: Scrape data
            logger.info("Step 1: Scraping data...")
            raw_jobs = await self.scraper.scrape(max_jobs=50)
            logger.info(f"Scraped {len(raw_jobs)} raw jobs")

            if not raw_jobs:
                logger.warning("No jobs scraped, skipping ETL")
                await self.alerter.send_scraping_failure_alert(
                    source_name="Remotive",
                    error="No data returned from scraper"
                )
                return

            # Step 2: Run ETL pipeline
            logger.info("Step 2: Running ETL pipeline...")
            stats = await self.etl.run(raw_jobs)

            # Step 3: Log results
            self.pipeline_successes += 1
            uptime = (self.pipeline_successes / max(self.pipeline_runs, 1)) * 100

            logger.success(f"=== Pipeline Run [{run_id}] completed ===")
            logger.info(f"Stats: {stats}")
            logger.info(f"Pipeline uptime: {uptime:.1f}%")

            # Alert if uptime drops below 95%
            if uptime < 95 and self.pipeline_runs >= 10:
                await self.alerter.send_alert(
                    title="Pipeline Uptime Below Threshold",
                    message=f"Pipeline uptime is {uptime:.1f}% (target: >=95%)\n"
                            f"Total runs: {self.pipeline_runs}, Successes: {self.pipeline_successes}"
                )

        except Exception as e:
            logger.error(f"Pipeline run [{run_id}] failed: {e}")
            await self.alerter.send_scraping_failure_alert(
                source_name="Remotive",
                error=str(e)
            )

    async def start(self):
        """Initialize database and start the scheduler."""
        logger.info("Initializing DataPulse Scheduler...")

        # Initialize database tables
        try:
            await init_db()
        except Exception as e:
            logger.warning(f"Database initialization skipped (may already exist): {e}")

        # Run pipeline immediately on startup
        logger.info("Running initial pipeline...")
        await self.run_pipeline()

        # Schedule recurring runs
        interval_hours = settings.scraper_interval_hours
        self.scheduler.add_job(
            self.run_pipeline,
            trigger=IntervalTrigger(hours=interval_hours),
            id="data_pipeline",
            name="Data scraping and ETL pipeline",
            replace_existing=True,
        )

        logger.info(f"Scheduler configured to run every {interval_hours} hours")
        self.scheduler.start()

        # Keep running
        try:
            while True:
                await asyncio.sleep(60)
        except KeyboardInterrupt:
            logger.info("Shutting down scheduler...")
            self.scheduler.shutdown()


def run_scheduler():
    """Entry point for the scheduler service."""
    scheduler = DataPipelineScheduler()
    asyncio.run(scheduler.start())


if __name__ == "__main__":
    run_scheduler()