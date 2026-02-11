from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Batch(Base):
    __tablename__ = "batches"

    id = Column(String, primary_key=True, default=generate_uuid)
    template_key = Column(String, nullable=False)
    total_numbers = Column(Integer, nullable=False)
    success_count = Column(Integer, default=0)
    failure_count = Column(Integer, default=0)
    status = Column(String, nullable=False, default="running") # running | completed | failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

    messages = relationship("Message", back_populates="batch")

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    batch_id = Column(String, ForeignKey("batches.id"), nullable=False)
    phone_number = Column(String, nullable=False)
    message_text = Column(String, nullable=False)
    status = Column(String, nullable=False) # success | failed
    error_message = Column(Text, nullable=True)
    provider_status_code = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    batch = relationship("Batch", back_populates="messages")
