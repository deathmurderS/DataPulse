"""
Job model - represents job vacancy data scraped from public sources.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, Date
from sqlalchemy.sql import func
from app.models.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    external_id = Column(String(255), unique=True, nullable=False, comment="Unique ID from source")
    title = Column(String(500), nullable=False, comment="Job title")
    company = Column(String(500), nullable=False, comment="Company name")
    location = Column(String(500), nullable=True, comment="Job location")
    description = Column(Text, nullable=True, comment="Full job description")
    requirements = Column(Text, nullable=True, comment="Job requirements")
    salary_min = Column(Float, nullable=True, comment="Minimum salary")
    salary_max = Column(Float, nullable=True, comment="Maximum salary")
    salary_currency = Column(String(10), nullable=True, comment="Salary currency (IDR, USD)")
    employment_type = Column(String(100), nullable=True, comment="Full-time, Part-time, Contract")
    category = Column(String(255), nullable=True, comment="Job category/field")
    source_url = Column(String(1000), nullable=False, comment="Original source URL")
    source_name = Column(String(100), nullable=False, comment="Source website name")
    posted_date = Column(Date, nullable=True, comment="Date job was posted")
    is_active = Column(Boolean, default=True, comment="Whether the job is still active")
    scraped_at = Column(DateTime(timezone=True), server_default=func.now(), comment="When data was scraped")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<Job(id={self.id}, title='{self.title}', company='{self.company}')>"

    def to_dict(self):
        return {
            "id": self.id,
            "external_id": self.external_id,
            "title": self.title,
            "company": self.company,
            "location": self.location,
            "description": self.description,
            "requirements": self.requirements,
            "salary_min": self.salary_min,
            "salary_max": self.salary_max,
            "salary_currency": self.salary_currency,
            "employment_type": self.employment_type,
            "category": self.category,
            "source_url": self.source_url,
            "source_name": self.source_name,
            "posted_date": str(self.posted_date) if self.posted_date else None,
            "is_active": self.is_active,
            "scraped_at": str(self.scraped_at) if self.scraped_at else None,
        }