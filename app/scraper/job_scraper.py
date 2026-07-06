"""
Job Scraper Module
Fetches real job vacancy data from the Remotive public API (remotive.com).

Remotive API usage terms (see https://github.com/remotive-com/remote-jobs-api):
- Free, no API key required.
- We must attribute Remotive as the source and link back to the original
  listing URL for every job we display (handled via source_name/source_url).
- Remotive explicitly asks integrators not to poll too frequently — this
  scraper is meant to be run at most a few times per day, not every few
  minutes.
"""

import hashlib
import re
from datetime import datetime, date
from typing import List, Dict, Optional

import httpx
from bs4 import BeautifulSoup
from loguru import logger
from tenacity import retry, stop_after_attempt, wait_exponential

REMOTIVE_API_URL = "https://remotive.com/api/remote-jobs"

# Rough salary parser: pulls the first one or two numbers out of strings like
# "$40,000 - $50,000" or "$70k - $90k". Remotive salary strings are freeform
# and not guaranteed to be present or well-formatted, so this is best-effort.
_SALARY_NUMBER_RE = re.compile(r"(\d[\d,]*\.?\d*)\s*(k)?", re.IGNORECASE)


def _parse_salary(raw: Optional[str]):
    """Extract (min, max, currency) from a freeform Remotive salary string."""
    if not raw:
        return None, None, None

    currency = "USD" if "$" in raw else ("EUR" if "\u20ac" in raw else ("IDR" if "Rp" in raw else "USD"))

    numbers = []
    for match in _SALARY_NUMBER_RE.finditer(raw):
        num_str, k_suffix = match.groups()
        if not num_str:
            continue
        try:
            value = float(num_str.replace(",", ""))
        except ValueError:
            continue
        if k_suffix:
            value *= 1000
        numbers.append(value)

    if not numbers:
        return None, None, None
    if len(numbers) == 1:
        return numbers[0], numbers[0], currency
    return min(numbers[:2]), max(numbers[:2]), currency


def _clean_html(raw_html: Optional[str]) -> str:
    """Strip HTML tags from Remotive's description field into plain text."""
    if not raw_html:
        return ""
    text = BeautifulSoup(raw_html, "lxml").get_text(separator=" ", strip=True)
    return re.sub(r"\s+", " ", text).strip()


def _map_employment_type(job_type: Optional[str]) -> Optional[str]:
    mapping = {
        "full_time": "Full-time",
        "part_time": "Part-time",
        "contract": "Contract",
        "internship": "Internship",
        "freelance": "Freelance",
    }
    if not job_type:
        return None
    return mapping.get(job_type.lower(), job_type.replace("_", " ").title())


class JobScraper:
    """Fetches real, live job listings from the Remotive public API."""

    def __init__(self, source_name: str = "Remotive", category: Optional[str] = None, search: Optional[str] = None):
        self.source_name = source_name
        self.category = category
        self.search = search
        self.api_url = REMOTIVE_API_URL

    def _map_job(self, raw: Dict) -> Dict:
        salary_min, salary_max, currency = _parse_salary(raw.get("salary"))

        posted_date = None
        if raw.get("publication_date"):
            try:
                posted_date = datetime.fromisoformat(
                    raw["publication_date"].replace("Z", "+00:00")
                ).date()
            except ValueError:
                posted_date = None

        return {
            "external_id": f"remotive_{raw.get('id')}",
            "title": raw.get("title"),
            "company": raw.get("company_name"),
            "location": raw.get("candidate_required_location") or "Remote",
            "description": _clean_html(raw.get("description"))[:2000],
            "requirements": None,
            "salary_min": salary_min,
            "salary_max": salary_max,
            "salary_currency": currency,
            "employment_type": _map_employment_type(raw.get("job_type")),
            "category": raw.get("category"),
            "source_url": raw.get("url"),
            "source_name": self.source_name,
            "posted_date": posted_date or date.today(),
            "is_active": True,
        }

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True,
    )
    async def scrape(self, max_jobs: int = 50) -> List[Dict]:
        """Fetch live job listings from the Remotive API."""
        params = {"limit": max_jobs}
        if self.category:
            params["category"] = self.category
        if self.search:
            params["search"] = self.search

        logger.info(f"Fetching jobs from Remotive API (limit={max_jobs})")
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                response = await client.get(self.api_url, params=params)
                response.raise_for_status()
                payload = response.json()

            raw_jobs = payload.get("jobs", [])
            jobs = [self._map_job(job) for job in raw_jobs]
            logger.success(f"Fetched {len(jobs)} jobs from Remotive")
            return jobs
        except httpx.HTTPStatusError as e:
            logger.error(f"Remotive API returned an error: {e.response.status_code}")
            raise
        except Exception as e:
            logger.error(f"Fetching jobs from Remotive failed: {e}")
            raise

    async def scrape_single(self) -> Optional[Dict]:
        """Fetch a single job (for testing)."""
        jobs = await self.scrape(max_jobs=1)
        return jobs[0] if jobs else None
