"""
Database connection and session management for DataPulse.
Supports both async (asyncpg) and sync (psycopg2) connections.
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy import create_engine
from app.config import settings
from loguru import logger


class Base(DeclarativeBase):
    pass


# Async engine for API (FastAPI async endpoints)
async_engine = create_async_engine(
    settings.database_url,
    echo=False,
    pool_size=5,
    max_overflow=10,
)

AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# Sync engine for scripts, scheduler, and ETL (lazy-loaded)
_sync_engine = None
_SyncSessionLocal = None


def _get_sync_engine():
    """Lazily create sync engine - avoids import errors when psycopg2 is not available."""
    global _sync_engine
    if _sync_engine is None:
        _sync_engine = create_engine(
            settings.database_url_sync,
            echo=False,
            pool_size=5,
            max_overflow=10,
        )
    return _sync_engine


def _get_sync_session_factory():
    global _SyncSessionLocal
    if _SyncSessionLocal is None:
        _SyncSessionLocal = sessionmaker(
            bind=_get_sync_engine(),
            expire_on_commit=False,
        )
    return _SyncSessionLocal


async def get_db() -> AsyncSession:
    """Dependency for FastAPI endpoints - provides async DB session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:
            await session.close()


def get_db_sync():
    """Provides sync DB session for ETL, scheduler, scripts."""
    session = _get_sync_session_factory()()
    try:
        yield session
        session.commit()
    except Exception as e:
        session.rollback()
        logger.error(f"Database session error: {e}")
        raise
    finally:
        session.close()


async def init_db():
    """Create all tables."""
    async with async_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created successfully")