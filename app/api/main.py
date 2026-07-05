"""
DataPulse REST API
FastAPI application with automatic Swagger/OpenAPI documentation.
Provides endpoints for job data access, search, filtering, and export.
"""

from contextlib import asynccontextmanager
from typing import Optional, List
from datetime import date, datetime
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
import csv
import io
import json
from loguru import logger

from app.config import settings
from app.models.database import get_db, init_db
from app.models.job import Job
from app.api.rate_limiter import RateLimiter


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: initialize database on startup."""
    logger.info("Starting DataPulse API...")
    try:
        await init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.warning(f"Database init skipped: {e}")
    yield
    logger.info("Shutting down DataPulse API...")


app = FastAPI(
    title="DataPulse API",
    description="""
    DataPulse REST API for job vacancy data.
    
    ## Features
    * Browse and search job listings
    * Filter by company, location, category, salary range
    * Export data to CSV/JSON
    * Automatic Swagger documentation
    
    ## Rate Limiting
    API requests are rate-limited to prevent abuse.
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware - allow dashboard to access API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiter
rate_limiter = RateLimiter()


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Apply rate limiting to all requests."""
    client_ip = request.client.host if request.client else "unknown"
    allowed, remaining = rate_limiter.check_rate_limit(client_ip)

    if not allowed:
        return Response(
            content=json.dumps({
                "detail": "Rate limit exceeded. Please try again later.",
                "retry_after": settings.api_rate_limit_window,
            }),
            status_code=429,
            media_type="application/json",
            headers={
                "X-RateLimit-Limit": str(settings.api_rate_limit),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(settings.api_rate_limit_window),
            }
        )

    response = await call_next(request)
    response.headers["X-RateLimit-Limit"] = str(settings.api_rate_limit)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    return response


# ===== Health & Info Endpoints =====

@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "DataPulse API",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/api/info", tags=["System"])
async def api_info():
    """API information endpoint."""
    return {
        "name": "DataPulse API",
        "version": "1.0.0",
        "docs": "/docs",
        "redoc": "/redoc",
        "endpoints": {
            "health": "/health",
            "jobs": "/api/jobs",
            "jobs_search": "/api/jobs/search",
            "jobs_stats": "/api/jobs/stats",
            "jobs_export": "/api/jobs/export",
            "jobs_categories": "/api/jobs/categories",
            "jobs_companies": "/api/jobs/companies",
        }
    }


# ===== Job Endpoints =====

@app.get("/api/jobs", tags=["Jobs"])
async def get_jobs(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Max records to return"),
    db: AsyncSession = Depends(get_db),
):
    """Get paginated list of jobs."""
    query = select(Job).offset(skip).limit(limit).order_by(Job.scraped_at.desc())
    result = await db.execute(query)
    jobs = result.scalars().all()

    # Get total count
    count_query = select(func.count(Job.id))
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "data": [job.to_dict() for job in jobs],
    }


@app.get("/api/jobs/search", tags=["Jobs"])
async def search_jobs(
    q: str = Query("", description="Search query for title, company, or description"),
    company: Optional[str] = Query(None, description="Filter by company name"),
    location: Optional[str] = Query(None, description="Filter by location"),
    category: Optional[str] = Query(None, description="Filter by category"),
    employment_type: Optional[str] = Query(None, description="Filter by employment type"),
    salary_min: Optional[float] = Query(None, ge=0, description="Minimum salary"),
    salary_max: Optional[float] = Query(None, ge=0, description="Maximum salary"),
    date_from: Optional[date] = Query(None, description="Posted date from (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="Posted date to (YYYY-MM-DD)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
):
    """Search and filter jobs with multiple criteria."""
    conditions = []

    if q:
        search_pattern = f"%{q}%"
        conditions.append(
            and_(
                Job.title.ilike(search_pattern),
                Job.company.ilike(search_pattern),
                Job.description.ilike(search_pattern),
            )
        )

    if company:
        conditions.append(Job.company.ilike(f"%{company}%"))
    if location:
        conditions.append(Job.location.ilike(f"%{location}%"))
    if category:
        conditions.append(Job.category == category)
    if employment_type:
        conditions.append(Job.employment_type == employment_type)
    if salary_min is not None:
        conditions.append(Job.salary_max >= salary_min)
    if salary_max is not None:
        conditions.append(Job.salary_min <= salary_max)
    if date_from:
        conditions.append(Job.posted_date >= date_from)
    if date_to:
        conditions.append(Job.posted_date <= date_to)

    query = select(Job)
    if conditions:
        query = query.where(and_(*conditions))

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    count_result = await db.execute(count_query)
    total = count_result.scalar()

    # Get paginated results
    query = query.offset(skip).limit(limit).order_by(Job.scraped_at.desc())
    result = await db.execute(query)
    jobs = result.scalars().all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "query": q,
        "data": [job.to_dict() for job in jobs],
    }


@app.get("/api/jobs/stats", tags=["Jobs"])
async def get_job_stats(db: AsyncSession = Depends(get_db)):
    """Get aggregate statistics about jobs."""
    # Total jobs
    total_query = select(func.count(Job.id))
    total_result = await db.execute(total_query)
    total_jobs = total_result.scalar()

    # Jobs by category
    cat_query = select(Job.category, func.count(Job.id).label("count")).where(
        Job.category.isnot(None)
    ).group_by(Job.category).order_by(func.count(Job.id).desc())
    cat_result = await db.execute(cat_query)
    by_category = [{"category": row[0], "count": row[1]} for row in cat_result]

    # Jobs by company (top 10)
    comp_query = select(Job.company, func.count(Job.id).label("count")).group_by(
        Job.company
    ).order_by(func.count(Job.id).desc()).limit(10)
    comp_result = await db.execute(comp_query)
    by_company = [{"company": row[0], "count": row[1]} for row in comp_result]

    # Jobs by location (top 10)
    loc_query = select(Job.location, func.count(Job.id).label("count")).where(
        Job.location.isnot(None)
    ).group_by(Job.location).order_by(func.count(Job.id).desc()).limit(10)
    loc_result = await db.execute(loc_query)
    by_location = [{"location": row[0], "count": row[1]} for row in loc_result]

    # Jobs by employment type
    emp_query = select(Job.employment_type, func.count(Job.id).label("count")).where(
        Job.employment_type.isnot(None)
    ).group_by(Job.employment_type).order_by(func.count(Job.id).desc())
    emp_result = await db.execute(emp_query)
    by_employment = [{"type": row[0], "count": row[1]} for row in emp_result]

    # Average salary by category
    salary_query = select(
        Job.category,
        func.avg(Job.salary_min).label("avg_min"),
        func.avg(Job.salary_max).label("avg_max"),
        func.count(Job.id).label("count"),
    ).where(
        and_(Job.category.isnot(None), Job.salary_min.isnot(None))
    ).group_by(Job.category).order_by(func.avg(Job.salary_max).desc())
    salary_result = await db.execute(salary_query)
    avg_salary = [
        {
            "category": row[0],
            "avg_salary_min": float(row[1]) if row[1] else 0,
            "avg_salary_max": float(row[2]) if row[2] else 0,
            "count": row[3],
        }
        for row in salary_result
    ]

    # Jobs posted over time (last 30 days)
    from sqlalchemy import cast, Date
    time_query = select(
        cast(Job.posted_date, Date).label("date"),
        func.count(Job.id).label("count"),
    ).where(
        Job.posted_date >= date.today().replace(day=1)  # Current month
    ).group_by(cast(Job.posted_date, Date)).order_by(cast(Job.posted_date, Date))
    time_result = await db.execute(time_query)
    by_date = [{"date": str(row[0]), "count": row[1]} for row in time_result]

    return {
        "total_jobs": total_jobs,
        "by_category": by_category,
        "by_company": by_company,
        "by_location": by_location,
        "by_employment_type": by_employment,
        "average_salary": avg_salary,
        "by_date": by_date,
    }


@app.get("/api/jobs/export", tags=["Jobs"])
async def export_jobs(
    format: str = Query("csv", regex="^(csv|json)$", description="Export format"),
    company: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Export jobs data to CSV or JSON format."""
    conditions = []
    if company:
        conditions.append(Job.company.ilike(f"%{company}%"))
    if location:
        conditions.append(Job.location.ilike(f"%{location}%"))
    if category:
        conditions.append(Job.category == category)

    query = select(Job)
    if conditions:
        query = query.where(and_(*conditions))
    query = query.order_by(Job.scraped_at.desc())

    result = await db.execute(query)
    jobs = result.scalars().all()
    data = [job.to_dict() for job in jobs]

    if format == "json":
        content = json.dumps(data, indent=2, default=str)
        return Response(
            content=content,
            media_type="application/json",
            headers={"Content-Disposition": "attachment; filename=datapulse_export.json"},
        )
    else:
        # CSV export
        output = io.StringIO()
        if data:
            writer = csv.DictWriter(output, fieldnames=data[0].keys())
            writer.writeheader()
            writer.writerows(data)
        else:
            output.write("No data found")

        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=datapulse_export.csv"},
        )


@app.get("/api/jobs/categories", tags=["Jobs"])
async def get_categories(db: AsyncSession = Depends(get_db)):
    """Get list of all job categories."""
    query = select(Job.category).where(
        Job.category.isnot(None)
    ).distinct().order_by(Job.category)
    result = await db.execute(query)
    categories = [row[0] for row in result]
    return {"categories": categories}


@app.get("/api/jobs/companies", tags=["Jobs"])
async def get_companies(db: AsyncSession = Depends(get_db)):
    """Get list of all companies."""
    query = select(Job.company).distinct().order_by(Job.company)
    result = await db.execute(query)
    companies = [row[0] for row in result]
    return {"companies": companies}


@app.get("/api/jobs/{job_id}", tags=["Jobs"])
async def get_job(
    job_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a single job by ID."""
    query = select(Job).where(Job.id == job_id)
    result = await db.execute(query)
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return job.to_dict()


# ===== Frontend Static Files (SPA) =====

FRONTEND_DIR = Path(__file__).parent.parent.parent / "frontend" / "dist"

if FRONTEND_DIR.exists():
    logger.info(f"Serving frontend from {FRONTEND_DIR}")
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIR / "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        """Serve frontend SPA - all non-API routes return index.html."""
        file_path = FRONTEND_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(FRONTEND_DIR / "index.html"))
else:
    logger.warning(f"Frontend dist not found at {FRONTEND_DIR}. Run 'cd frontend && npm run build' to build it.")
