from pydantic import BaseModel
from typing import Optional, Union
from datetime import date


class RecurrenceRule(BaseModel):
    type: str
    interval: Optional[int] = None
    daysOfWeek: Optional[list[int]] = None
    count: Optional[int] = None


class SubtaskOut(BaseModel):
    id: int
    title: str
    completed: bool

    model_config = {"from_attributes": True}


class TaskOut(BaseModel):
    id: int
    title: str
    completed: bool
    date: Optional[str] = None
    category: str
    isLabel: bool
    color: str
    notes: str
    subtasks: list[SubtaskOut]
    recurrence: Optional[RecurrenceRule] = None
    recurringParentId: Optional[int] = None
    order: int

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_task(cls, task) -> "TaskOut":
        rec = None
        if task.recurrence:
            rec = RecurrenceRule(**task.recurrence)
        subs = [
            SubtaskOut(id=s.id, title=s.title, completed=s.completed)
            for s in sorted(task.subtasks, key=lambda s: s.subtask_order)
        ]
        return cls(
            id=task.id,
            title=task.title,
            completed=task.completed,
            date=task.date.isoformat() if task.date else None,
            category=task.category,
            isLabel=task.is_label,
            color=task.color,
            notes=task.notes,
            subtasks=subs,
            recurrence=rec,
            recurringParentId=task.recurring_parent_id,
            order=task.task_order,
        )


class TaskCreate(BaseModel):
    title: str
    date: Optional[str] = None
    category: str = "personal"


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    completed: Optional[bool] = None
    date: Union[str, None] = None
    category: Optional[str] = None
    isLabel: Optional[bool] = None
    color: Optional[str] = None
    notes: Optional[str] = None
    order: Optional[int] = None


class MoveTask(BaseModel):
    taskId: int
    newDate: Optional[str] = None
    newCategory: str
    newIndex: int


class SubtaskCreate(BaseModel):
    title: str


class SubtaskUpdate(BaseModel):
    completed: Optional[bool] = None
    title: Optional[str] = None
