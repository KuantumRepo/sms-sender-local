# Local SMS Batch Sender

A local SMS batch sender with a web dashboard, built with Python (FastAPI), Next.js, and SQLite. Designed for personal use to send bulk SMS messages via the ViteMobile API (or other providers).

## Features

- **Web Dashboard**: Simple UI to upload CSVs, select templates, and monitor batches.
- **API-Agnostic Architecture**: Easy to swap SMS providers. Currently integrated with **ViteMobile**.
- **Message Templating**: Define templates with multiple variations for random distribution.
- **CSV Ingestion**: Upload recipients via CSV. Handles dirty numbers and duplicates.
- **Normalization**: Automatically formats phone numbers to E.164.
- **Rate Limiting**: Configurable send rate to avoid throttles.
- **Reporting**: Track batch status, view failed numbers, and export full results to CSV.
- **Production Ready**: Ships with a one-click deployment script (`deploy.sh`) for lightweight VPS hosting using Native Systemd + Caddy SSL.
- **Docker Ready**: Isolated containerization for both Frontend and Backend.

## Prerequisites

- Python 3.12+
- Node.js 20+ (for local frontend development)
- Docker (optional, for containerized deployment)

## Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd sms-sender
    ```

2.  **Backend Setup**:
    ```powershell
    python -m venv venv
    .\venv\Scripts\Activate
    pip install -r requirements.txt
    ```

3.  **Frontend Setup** (for local dev):
    ```powershell
    cd frontend
    npm install -g pnpm
    pnpm install
    ```

## Configuration

1.  **Environment Variables**:
    Copy the example environment file and configure it with your credentials:
    ```bash
    cp .env.example .env
    ```
    
    Edit `.env` and fill in your values:
    ```env
    PROVIDER_BASE_URL=https://core.vitemobile.com
    PROVIDER_BEARER_TOKEN=your_vitemobile_access_token_here
    DEFAULT_REGION=US
    RATE_LIMIT_PER_SECOND=5.0
    DATABASE_PATH=./sms.db
    ```

2.  **Templates**:
    Customize `templates.json` with your message templates.

## Running the Application

### Option 1: Docker Compose (Recommended)
The easiest way to run the application is with Docker Compose. This handles the database volume and environment variables automatically.

```bash
docker compose up --build
```

Access the **Dashboard** at `http://localhost:8000`.

### Option 2: Docker Build (Manual)
Build and run the container manually:

```bash
docker build -t sms-sender .
docker run -p 8000:8000 --env-file .env -v $(pwd)/sms.db:/app/sms.db -v $(pwd)/logs:/app/logs sms-sender
```

Access the **Dashboard** at `http://localhost:8000`.

### Option 3: Production VPS Deployment (Native)
Optimized for ultra-lightweight VPS hosting (e.g., 1GB RAM DigitalOcean Droplet or EC2 `t2.micro`). This script natively bypasses Docker's heavy resource overhead by compiling the Next.js frontend into static HTML and daemonizing the Python FastAPI backend via `systemd`. 

It includes a temporary 1GB Swapfile initialization to prevent Next.js `Out-Of-Memory` build crashing, and wires up a `Caddy` reverse proxy for automatic SSL certificate generation.

**Steps:**
1. Provision a fresh Ubuntu-based VPS and SSH into it as `root`:
   ```bash
   ssh root@<your-server-ip>
   ```
2. Clone the repository:
   ```bash
   git clone <repository-url>
   cd sms-sender
   ```
3. Run the automated deployment script:
   ```bash
   sudo bash deploy.sh
   ```
4. *Note: If a `.env` file is missing, the script will create one and pause, asking you to configure your API keys before proceeding.*

### Option 2: Local Development
Run backend and frontend separately.

1.  **Backend**:
    ```powershell
    # Terminal 1
    .\venv\Scripts\Activate
    python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    ```

2.  **Frontend**:
    ```powershell
    # Terminal 2
    cd frontend
    pnpm dev
    ```
    Access the **Dashboard** at `http://localhost:3000`.

## Usage

### 1. Send SMS Batch
- Go to the Dashboard.
- Select a **Template** from the dropdown.
- Upload a **CSV File** containing a phone number column (e.g., `phone`, `mobile`).
- Click **Upload & Send**.

### 2. Monitor Progress
- The "Recent Batches" table updates automatically.
- View real-time success/failure counts.

### 3. Export Results
- Click **Export CSV** next to any batch to download a detailed report including status and error messages for every recipient.

## API Documentation

The backend exposes a full REST API.
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
