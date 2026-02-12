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
- **Docker Ready**: Single container for both Frontend and Backend.

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

1.  Create a `.env` file in the root directory:
    ```env
    PROVIDER_BASE_URL=https://core.vitemobile.com
    PROVIDER_BEARER_TOKEN=your_vitemobile_access_token_here
    DEFAULT_REGION=US
    RATE_LIMIT_PER_SECOND=5.0
    DATABASE_PATH=./sms.db
    
    # ViteMobile Specific Settings
    VITEMOBILE_SERVER_TYPE=PUBLIC  # Options: PUBLIC, PRIVATE
    VITEMOBILE_PROTOCOL=SMS        # Options: SMS, MMS
    ```

2.  Customize `templates.json` with your message templates.

## Running the Application

### Option 1: Docker (Recommended)
Builds a single image containing both the backend API and the frontend UI.

```bash
docker build -t sms-sender .
docker run -p 8000:8000 --env-file .env sms-sender
```

Access the **Dashboard** at `http://localhost:8000`.

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
