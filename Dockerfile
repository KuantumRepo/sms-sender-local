# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
# Copy package files
COPY frontend/package.json frontend/pnpm-lock.yaml ./
# Install dependencies
RUN npm install -g pnpm && pnpm install --frozen-lockfile
# Copy source code
COPY frontend/ .
# Build static export
RUN pnpm build

# Stage 2: Backend & Final Image
FROM python:3.12-slim

WORKDIR /app

# Copy Backend Requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Backend Code
COPY . .

# Copy Built Frontend from Stage 1
# Create directory for static files
# Note: Next.js 'export' output is in 'out' folder
COPY --from=frontend-builder /app/frontend/out /app/frontend/out

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
