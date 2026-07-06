"""
ETL Pipeline Module
Extract, Transform, Load - handles cleaning, validation, and deduplication.
"""

import math
from typing import List, Dict, Tuple
import pandas as pd
from datetime import datetime
from loguru import logger

from app.models.database import SyncSessionLocal
from app.models.job import Job
from app.notifications.alerter import Alerter


class ETLPipeline:
    """ETL pipeline for cleaning, validating, and loading job data."""

    def __init__(self):
        self.stats = {
            "total_raw": 0,
            "cleaned": 0,
            "duplicates_removed": 0,
            "invalid_removed": 0,
            "loaded": 0,
            "errors": 0,
        }
        self.alerter = Alerter()

    def validate_schema(self, jobs: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        """
        Validate data schema and completeness.
        Returns (valid_jobs, invalid_jobs).
        """
        valid = []
        invalid = []

        required_fields = ["external_id", "title", "company", "source_url", "source_name"]

        for job in jobs:
            is_valid = True
            missing_fields = []

            for field in required_fields:
                if not job.get(field):
                    missing_fields.append(field)
                    is_valid = False

            if not is_valid:
                job["validation_error"] = f"Missing required fields: {', '.join(missing_fields)}"
                invalid.append(job)
                logger.warning(f"Invalid job data: {job.get('title', 'N/A')} - {job['validation_error']}")
            else:
                valid.append(job)

        return valid, invalid

    def clean_data(self, jobs: List[Dict]) -> List[Dict]:
        """Clean and normalize job data."""
        cleaned = []
        for job in jobs:
            cleaned_job = job.copy()

            # Strip whitespace from text fields
            for key in ["title", "company", "location", "employment_type", "category"]:
                if cleaned_job.get(key) and isinstance(cleaned_job[key], str):
                    cleaned_job[key] = cleaned_job[key].strip()

            # Normalize salary values
            if cleaned_job.get("salary_min") is not None:
                try:
                    cleaned_job["salary_min"] = float(cleaned_job["salary_min"])
                except (ValueError, TypeError):
                    cleaned_job["salary_min"] = None

            if cleaned_job.get("salary_max") is not None:
                try:
                    cleaned_job["salary_max"] = float(cleaned_job["salary_max"])
                except (ValueError, TypeError):
                    cleaned_job["salary_max"] = None

            # Ensure salary_min <= salary_max
            if (cleaned_job.get("salary_min") is not None and 
                cleaned_job.get("salary_max") is not None):
                if cleaned_job["salary_min"] > cleaned_job["salary_max"]:
                    cleaned_job["salary_min"], cleaned_job["salary_max"] = (
                        cleaned_job["salary_max"], cleaned_job["salary_min"]
                    )

            # Default currency if salary exists
            if (cleaned_job.get("salary_min") is not None and 
                not cleaned_job.get("salary_currency")):
                cleaned_job["salary_currency"] = "IDR"

            cleaned.append(cleaned_job)

        return cleaned

    def remove_duplicates(self, jobs: List[Dict]) -> Tuple[List[Dict], int]:
        """
        Remove duplicate jobs based on external_id.
        Returns (unique_jobs, duplicates_removed_count).
        """
        df = pd.DataFrame(jobs)
        if df.empty:
            return [], 0

        # Check for duplicate external_ids
        before_count = len(df)
        df_unique = df.drop_duplicates(subset=["external_id"], keep="first")
        after_count = len(df_unique)
        duplicates_removed = before_count - after_count

        if duplicates_removed > 0:
            logger.info(f"Removed {duplicates_removed} duplicate jobs")

        # IMPORTANT: pandas silently turns missing values (None) into NaN
        # once a column has a mix of numbers and Nones (e.g. salary_min is
        # populated for some jobs but None for others, which is common with
        # real scraped data). NaN/Infinity are not valid JSON. Note that
        # df.where(pd.notnull(df), None) does NOT fix this: pandas coerces
        # None back into NaN for float-dtype columns on assignment. The
        # only reliable fix is to sanitize each value after to_dict().
        records = df_unique.to_dict("records")
        for record in records:
            for key, value in record.items():
                if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
                    record[key] = None
        return records, duplicates_removed

    def detect_anomalies(self, jobs: List[Dict]) -> List[Dict]:
        """Detect anomalies in the data (for notification purposes)."""
        anomalies = []

        if not jobs:
            anomalies.append({"type": "empty_dataset", "message": "No jobs found after ETL"})
            return anomalies

        # Check for unusual salary values
        salaries_min = [j.get("salary_min") for j in jobs if j.get("salary_min") is not None]
        if salaries_min:
            avg_salary = sum(salaries_min) / len(salaries_min)
            for job in jobs:
                if job.get("salary_min") and job["salary_min"] > avg_salary * 5:
                    anomalies.append({
                        "type": "high_salary",
                        "message": f"Unusually high salary detected: {job['title']} at {job['company']} - {job['salary_min']}",
                        "job": job
                    })

        # Check for missing critical fields
        for job in jobs:
            if not job.get("description") or len(job.get("description", "")) < 10:
                anomalies.append({
                    "type": "missing_description",
                    "message": f"Job missing description: {job['title']} at {job['company']}",
                    "job": job
                })

        return anomalies

    async def run(self, raw_jobs: List[Dict]) -> Dict:
        """
        Run the complete ETL pipeline.
        Returns stats dictionary.
        """
        self.stats["total_raw"] = len(raw_jobs)
        logger.info(f"ETL Pipeline started with {len(raw_jobs)} raw jobs")

        # Step 1: Validate schema
        valid_jobs, invalid_jobs = self.validate_schema(raw_jobs)
        self.stats["invalid_removed"] = len(invalid_jobs)
        logger.info(f"Schema validation: {len(valid_jobs)} valid, {len(invalid_jobs)} invalid")

        # Step 2: Clean data
        cleaned_jobs = self.clean_data(valid_jobs)
        self.stats["cleaned"] = len(cleaned_jobs)
        logger.info(f"Data cleaning completed: {len(cleaned_jobs)} jobs cleaned")

        # Step 3: Remove duplicates
        unique_jobs, duplicates_removed = self.remove_duplicates(cleaned_jobs)
        self.stats["duplicates_removed"] = duplicates_removed
        logger.info(f"Deduplication: {len(unique_jobs)} unique, {duplicates_removed} duplicates removed")

        # Step 4: Detect anomalies
        anomalies = self.detect_anomalies(unique_jobs)
        if anomalies:
            logger.warning(f"Detected {len(anomalies)} anomalies in data")
            await self.alerter.send_alert(
                title="Data Anomaly Detected",
                message=f"Found {len(anomalies)} anomalies during ETL:\n" + 
                        "\n".join([a["message"] for a in anomalies[:5]])
            )

        # Step 5: Load to database
        loaded_count = await self._load_to_db(unique_jobs)
        self.stats["loaded"] = loaded_count

        # Check final error rate
        error_rate = ((self.stats["invalid_removed"] + self.stats["duplicates_removed"]) / 
                     max(self.stats["total_raw"], 1)) * 100
        logger.info(f"ETL Pipeline completed. Error rate: {error_rate:.2f}%")

        if error_rate > 2:
            await self.alerter.send_alert(
                title="High ETL Error Rate",
                message=f"ETL error rate is {error_rate:.2f}% (target: <2%)\n"
                        f"Total: {self.stats['total_raw']}, Invalid: {self.stats['invalid_removed']}, "
                        f"Duplicates: {self.stats['duplicates_removed']}"
            )

        return self.stats

    async def _load_to_db(self, jobs: List[Dict]) -> int:
        """Load cleaned jobs into PostgreSQL database."""
        loaded = 0
        session = SyncSessionLocal()
        try:
            for job_data in jobs:
                try:
                    # Check if job already exists
                    existing = session.query(Job).filter(
                        Job.external_id == job_data["external_id"]
                    ).first()

                    if existing:
                        # Update existing record
                        for key, value in job_data.items():
                            if hasattr(existing, key) and key != "external_id":
                                setattr(existing, key, value)
                    else:
                        # Create new record
                        job = Job(**job_data)
                        session.add(job)

                    session.flush()
                    loaded += 1

                except Exception as e:
                    logger.error(f"Failed to load job {job_data.get('external_id')}: {e}")
                    self.stats["errors"] += 1

            session.commit()
            logger.success(f"Successfully loaded {loaded} jobs to database")

        except Exception as e:
            session.rollback()
            logger.error(f"Database load failed: {e}")
            await self.alerter.send_alert(
                title="Database Load Failed",
                message=f"Failed to load jobs to database: {str(e)}"
            )
        finally:
            session.close()

        return loaded