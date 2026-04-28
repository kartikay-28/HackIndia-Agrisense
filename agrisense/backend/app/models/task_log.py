from sqlalchemy import Column, Integer, String, DateTime, CheckConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.database import Base


class TaskLog(Base):
    """Task log model for tracking scheduled tasks and background jobs."""
    
    __tablename__ = "task_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    task_name = Column(String(100), nullable=False, index=True)
    status = Column(String(20), nullable=False, index=True)  # 'started', 'completed', 'failed'
    details = Column(JSONB, nullable=True)  # Task-specific details
    started_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Constraints
    __table_args__ = (
        CheckConstraint("status IN ('started', 'completed', 'failed')", name='valid_status'),
    )
    
    def __repr__(self):
        return f"<TaskLog(task='{self.task_name}', status='{self.status}')>"
