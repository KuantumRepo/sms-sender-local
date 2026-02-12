from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import engine, Base, get_db
from app.models import Batch, Message
from app.schemas import BatchResponse, MessageResponse
from app.utils.logger import logger
from app.services.csv_service import CSVService
from app.services.template_service import template_service
from app.services.batch_service import BatchService
from typing import List
import uvicorn
import io

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Local SMS Batch Sender", version="1.0.0")

# Allow CORS for local development (frontend running on port 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Services
csv_service = CSVService()

@app.on_event("startup")
async def startup_event():
    logger.info("Application starting up...")
    template_service.load_templates()

# API Routes
@app.get("/api/health")
def read_root():
    return {"message": "SMS Sender API is running"}

@app.get("/templates")
def get_templates():
    """Returns the list of available template keys."""
    return [
        {"key": key, "label": key.replace("_", " ").title()} 
        for key in template_service.get_template_keys()
    ]





@app.post("/batches", response_model=BatchResponse, status_code=201)
async def create_batch(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    template_key: str = Form(...),
    db: Session = Depends(get_db)
):
    # 1. Validate Template
    if not template_service.validate_template_key(template_key):
        raise HTTPException(status_code=400, detail=f"Invalid template key. Available: {template_service.get_template_keys()}")

    # 2. Process CSV
    try:
        content = await file.read()
        valid_numbers, total, failed = await csv_service.process_csv(content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV Error: {str(e)}")

    if not valid_numbers:
        raise HTTPException(status_code=400, detail="No valid phone numbers found in CSV.")

    # 3. Create Batch Record
    batch_service = BatchService(db)
    batch = batch_service.create_batch(template_key, len(valid_numbers))
    
    # 4. Start Background Task
    background_tasks.add_task(
        batch_service.process_batch, 
        batch.id, 
        valid_numbers, 
        template_key
    )

    return batch

@app.get("/batches", response_model=list[BatchResponse])
def get_batches(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    batches = db.query(Batch).order_by(Batch.created_at.desc()).offset(skip).limit(limit).all()
    return batches

from fastapi.responses import StreamingResponse
import csv

@app.get("/batches/{batch_id}", response_model=BatchResponse)
def get_batch(batch_id: str, db: Session = Depends(get_db)):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch

@app.get("/batches/{batch_id}/failed", response_model=List[MessageResponse]) # Needs List import from typing
def get_batch_failed(batch_id: str, db: Session = Depends(get_db)):
    messages = db.query(Message).filter(
        Message.batch_id == batch_id, 
        Message.status != "success"
    ).all()
    return messages

@app.get("/batches/{batch_id}/export")
def export_batch_csv(batch_id: str, db: Session = Depends(get_db)):
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    
    messages = db.query(Message).filter(Message.batch_id == batch_id).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["phone_number", "message_text", "status", "error_message", "provider_status_code", "created_at"])
    
    for msg in messages:
        writer.writerow([
            msg.phone_number,
            msg.message_text,
            msg.status,
            msg.error_message,
            msg.provider_status_code,
            msg.created_at
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=batch_{batch_id}.csv"}
    )


# Serve Static Files (Frontend)
# Ensure 'frontend/out' exists or is copied there in Docker
if os.path.exists('frontend/out'):
    app.mount('/', StaticFiles(directory='frontend/out', html=True), name='static')

