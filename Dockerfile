FROM python:3.11-slim AS backend

WORKDIR /app

# Install system dependencies for Python
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /app/data/backup /app/data/sample

# ===== Frontend Build Stage =====
FROM node:20-slim AS frontend-builder

WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

COPY frontend/ .
RUN npm run build

# ===== Final Stage =====
FROM backend

# Copy built frontend from frontend-builder
COPY --from=frontend-builder /frontend/dist /app/frontend/dist

# Expose port
EXPOSE 8000

# Default command
CMD ["uvicorn", "app.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
