# Local SMS Batch Sender

A simple, local SMS batch sender built with Python (FastAPI) and SQLite. Designed for personal use to send bulk SMS messages via the ViteMobile API (or any future provider).

## Features

- **API-Agnostic Architecture**: Easy to swap SMS providers. Currently integrated with **ViteMobile**.
- **Message Templating**: Define templates with multiple variations for random distribution.
- **CSV Ingestion**: Upload recipients via CSV. Handles dirty numbers and duplicates.
- **Normalization**: Automatically formats phone numbers to E.164.
- **Rate Limiting**: Configurable send rate to avoid throttles.
- **Reporting**: Track batch status, view failed numbers, and export full results to CSV.
- **Docker Ready**: Includes Dockerfile for containerized deployment.

## Prerequisites

- Python 3.12+
- Git

## Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd sms-sender
    ```

2.  **Create and activate a virtual environment**:
    ```powershell
    # Windows
    python -m venv venv
    .\venv\Scripts\Activate
    ```

3.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

## Configuration

1.  Create a `.env` file in the root directory (copy from example or create new):
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

2.  (Optional) Customize `templates.json` with your message templates.

## Running the Application

Ensure your virtual environment is active, then run:

```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
or
```powershell
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at `http://localhost:8000`.
API Documentation (Swagger UI) is available at `http://localhost:8000/docs`.

## Usage

### 1. Upload a Batch
- **Endpoint**: `POST /batches`
- **Parameters**: 
  - `template_key`: The key from `templates.json` (e.g., `promo_winter`).
  - `file`: A CSV file with a phone number column (e.g., `phone`, `mobile`).

### 2. Monitor Progress
- **Endpoint**: `GET /batches` or `GET /batches/{id}`

### 3. Export Results
- **Endpoint**: `GET /batches/{id}/export`
- Downloads a CSV with detailed status for every number in the batch.

## Docker Usage

Build and run the container:

```bash
docker build -t sms-sender .
docker run -p 8000:8000 --env-file .env sms-sender
```
