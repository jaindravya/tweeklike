from sqlalchemy import (
    Column, Integer, String, Boolean, Date, ForeignKey, Text, JSON, Index
)
from sqlalchemy.orm import relationship
from .database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, default="")
    completed = Column(Boolean, nullable=False, default=False)
    date = Column(Date, nullable=True, index=True)
    category = Column(String, nullable=False, default="personal", index=True)
    is_label = Column(Boolean, nullable=False, default=False)
    color = Column(String, nullable=False, default="none")
    notes = Column(Text, nullable=False, default="")
    recurrence = Column(JSON, nullable=True)
    recurring_parent_id = Column(Integer, ForeignKey("tasks.id"), nullable=True, index=True)
    task_order = Column(Integer, nullable=False, default=0)

    __table_args__ = (
        Index("ix_tasks_date_category", "date", "category"),
    )

    subtasks = relationship(
        "Subtask", back_populates="task", cascade="all, delete-orphan"
    )
    recurring_children = relationship(
        "Task", foreign_keys=[recurring_parent_id], cascade="all, delete-orphan"
    )


class Subtask(Base):
    __tablename__ = "subtasks"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False, default="")
    completed = Column(Boolean, nullable=False, default=False)
    subtask_order = Column(Integer, nullable=False, default=0)

    task = relationship("Task", back_populates="subtasks")
