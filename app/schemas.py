from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class BatchBase(BaseModel):
    template_key: str
    total_numbers: int
    success_count: int
    failure_count: int
    status: str

class BatchCreate(BatchBase):
    pass

class BatchResponse(BatchBase):
    id: str
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class MessageBase(BaseModel):
    phone_number: str
    message_text: str
    status: str
    error_message: Optional[str] = None
    provider_status_code: Optional[int] = None

class MessageResponse(MessageBase):
    id: int
    batch_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class BatchDetailResponse(BatchResponse):
    messages: List[MessageResponse] = []

