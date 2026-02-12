# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Install pnpm and dependencies
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source and build
COPY frontend/ .
RUN pnpm build


# Stage 2: Final Image
FROM python:3.12-slim

# Create a non-root user
RUN useradd -m -u 1000 appuser

WORKDIR /app

# Install system dependencies if needed (e.g. for some python packages)
# RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev && rm -rf /var/lib/apt/lists/*

# Copy Backend Requirements and Install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Backend Code
COPY app/ ./app/
COPY templates.json .

# Copy Built Frontend from Stage 1
COPY --from=frontend-builder /app/frontend/out ./frontend/out

# Set ownership to non-root user
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Run application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
