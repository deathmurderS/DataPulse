-- DataPulse Database Initialization Script
-- This script runs automatically when PostgreSQL container starts for the first time.

-- Create extension for UUID generation (optional, for future use)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create extension for full-text search (for future use)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Note: Tables are created by SQLAlchemy ORM on application startup.
-- This file is for any additional database configuration needed.