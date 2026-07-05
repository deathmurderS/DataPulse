"""
Job Scraper Module
Scrapes job vacancy data from public sources.
For demo purposes, uses sample/seed data to simulate scraping.
"""

import hashlib
import random
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

from app.config import settings


class JobScraper:
    """Base scraper for job vacancies. Uses sample data for demo purposes."""

    def __init__(self, source_name: str = "demo_source"):
        self.source_name = source_name
        self.source_url = "https://example.com/jobs"  # Placeholder

    def _generate_external_id(self, title: str, company: str) -> str:
        """Generate a unique external ID based on title and company."""
        raw = f"{title}|{company}|{datetime.now().isoformat()}"
        return hashlib.md5(raw.encode()).hexdigest()

    def _generate_sample_jobs(self, count: int = 50) -> List[Dict]:
        """Generate sample job data for demo purposes."""
        companies = [
            "PT Teknologi Maju", "CV Kreatif Digital", "PT Inovasi Solusi",
            "PT Data Utama", "Startup Hub Indonesia", "PT Global Tech",
            "CV Bangun Negeri", "PT Sejahtera Bersama", "Edukasi Online ID",
            "PT Fintech Nusantara", "CV Media Kreatif", "PT Solusi Bisnis",
            "AI Research Lab", "PT E-commerce Indonesia", "CV Digital Agency"
        ]
        job_titles = [
            "Software Engineer", "Data Analyst", "Data Scientist", "Backend Developer",
            "Frontend Developer", "Full Stack Developer", "DevOps Engineer",
            "Product Manager", "UI/UX Designer", "System Analyst",
            "Database Administrator", "Machine Learning Engineer", "QA Engineer",
            "Business Analyst", "IT Project Manager", "Mobile Developer",
            "Cloud Engineer", "Security Engineer", "Technical Writer", "SEO Specialist"
        ]
        categories = [
            "Technology", "Engineering", "Data", "Design", "Management",
            "Marketing", "Finance", "Education", "Healthcare", "Consulting"
        ]
        locations = [
            "Jakarta", "Bandung", "Surabaya", "Yogyakarta", "Bali",
            "Semarang", "Medan", "Makassar", "Palembang", "Remote"
        ]
        employment_types = ["Full-time", "Part-time", "Contract", "Internship", "Freelance"]
        currencies = ["IDR", "USD"]

        jobs = []
        for i in range(count):
            title = random.choice(job_titles)
            company = random.choice(companies)
            category = random.choice(categories)
            location = random.choice(locations)
            emp_type = random.choice(employment_types)
            currency = random.choice(currencies)

            if currency == "IDR":
                salary_min = random.choice([5, 8, 10, 15, 20]) * 1_000_000
                salary_max = salary_min + random.choice([5, 10, 15, 20, 30]) * 1_000_000
            else:
                salary_min = random.choice([500, 800, 1000, 1500, 2000])
                salary_max = salary_min + random.choice([500, 1000, 1500, 2000])

            posted_date = (datetime.now() - timedelta(days=random.randint(0, 30))).date()

            # Some jobs may have missing data to test ETL validation
            has_missing_data = random.random() < 0.05  # 5% chance

            job = {
                "external_id": self._generate_external_id(title, company),
                "title": title,
                "company": company,
                "location": location if not has_missing_data else None,
                "description": f"We are looking for an experienced {title} to join {company}. "
                              f"This role involves working with cutting-edge technology to build innovative solutions.",
                "requirements": f"- Minimum 2 years experience in {title}\n"
                               f"- Strong problem-solving skills\n"
                               f"- Excellent communication skills\n"
                               f"- Bachelor's degree in related field",
                "salary_min": salary_min,
                "salary_max": salary_max,
                "salary_currency": currency,
                "employment_type": emp_type,
                "category": category,
                "source_url": f"{self.source_url}/job/{i}",
                "source_name": self.source_name,
                "posted_date": posted_date,
                "is_active": True,
            }
            jobs.append(job)

        return jobs

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True
    )
    async def scrape(self, max_jobs: int = 50) -> List[Dict]:
        """
        Scrape job data from source.
        For demo: generates sample data. In production, replace with actual HTTP scraping.
        """
        logger.info(f"Starting scrape from {self.source_name} (max {max_jobs} jobs)")
        try:
            jobs = self._generate_sample_jobs(count=max_jobs)
            logger.success(f"Successfully scraped {len(jobs)} jobs from {self.source_name}")
            return jobs
        except Exception as e:
            logger.error(f"Scraping failed for {self.source_name}: {e}")
            raise

    async def scrape_single(self) -> Optional[Dict]:
        """Scrape a single job (for testing)."""
        jobs = self._generate_sample_jobs(count=1)
        return jobs[0] if jobs else None