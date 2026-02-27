from datetime import date, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from .database import get_db
from .models import Task, Subtask
from .schemas import (
    TaskOut, TaskCreate, TaskUpdate, MoveTask,
    SubtaskCreate, SubtaskUpdate, SubtaskOut, RecurrenceRule,
)

router = APIRouter(prefix="/api")


def parse_date(s: str | None) -> date | None:
    if not s:
        return None
    return date.fromisoformat(s)


def task_response(task: Task) -> TaskOut:
    return TaskOut.from_orm_task(task)


@router.get("/tasks", response_model=list[TaskOut])
def get_tasks(
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Task)
    if date_from and date_to:
        d_from = date.fromisoformat(date_from)
        d_to = date.fromisoformat(date_to)
        query = query.filter(
            or_(
                Task.date.between(d_from, d_to),
                Task.date == None,  # noqa: E711 — always include someday tasks
            )
        )
    tasks = query.all()
    return [task_response(t) for t in tasks]


@router.post("/tasks", response_model=TaskOut)
def create_task(body: TaskCreate, db: Session = Depends(get_db)):
    task_date = parse_date(body.date)
    max_order = (
        db.query(Task.task_order)
        .filter(Task.date == task_date, Task.category == body.category)
        .order_by(Task.task_order.desc())
        .first()
    )
    order = (max_order[0] + 1) if max_order else 0

    task = Task(
        title=body.title,
        date=task_date,
        category=body.category,
        task_order=order,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task_response(task)


@router.patch("/tasks/{task_id}", response_model=TaskOut)
def update_task(task_id: int, body: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "task not found")

    updates = body.model_dump(exclude_unset=True)
    field_map = {"isLabel": "is_label", "order": "task_order"}
    for key, val in updates.items():
        if key == "date":
            val = parse_date(val)
        setattr(task, field_map.get(key, key), val)

    db.commit()
    db.refresh(task)
    return task_response(task)


@router.delete("/tasks/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "task not found")
    db.delete(task)
    db.commit()
    return {"ok": True}


@router.delete("/tasks/{task_id}/future")
def delete_task_and_future(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "task not found")

    parent_id = task.recurring_parent_id or task_id

    if task.date:
        future = (
            db.query(Task)
            .filter(
                Task.recurring_parent_id == parent_id,
                Task.date >= task.date,
                Task.id != task_id,
            )
            .all()
        )
        for t in future:
            db.delete(t)

    db.delete(task)
    db.commit()
    return {"ok": True}


# --- subtasks ---

@router.post("/tasks/{task_id}/subtasks", response_model=SubtaskOut)
def add_subtask(task_id: int, body: SubtaskCreate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "task not found")

    max_order = (
        db.query(Subtask.subtask_order)
        .filter(Subtask.task_id == task_id)
        .order_by(Subtask.subtask_order.desc())
        .first()
    )
    order = (max_order[0] + 1) if max_order else 0

    sub = Subtask(task_id=task_id, title=body.title, subtask_order=order)
    db.add(sub)
    db.commit()
    db.refresh(sub)
    return SubtaskOut(id=sub.id, title=sub.title, completed=sub.completed)


@router.patch("/subtasks/{subtask_id}", response_model=SubtaskOut)
def update_subtask(subtask_id: int, body: SubtaskUpdate, db: Session = Depends(get_db)):
    sub = db.query(Subtask).filter(Subtask.id == subtask_id).first()
    if not sub:
        raise HTTPException(404, "subtask not found")

    updates = body.model_dump(exclude_unset=True)
    for key, val in updates.items():
        setattr(sub, key, val)

    db.commit()
    db.refresh(sub)
    return SubtaskOut(id=sub.id, title=sub.title, completed=sub.completed)


@router.delete("/subtasks/{subtask_id}")
def delete_subtask(subtask_id: int, db: Session = Depends(get_db)):
    sub = db.query(Subtask).filter(Subtask.id == subtask_id).first()
    if not sub:
        raise HTTPException(404, "subtask not found")
    db.delete(sub)
    db.commit()
    return {"ok": True}


# --- recurrence ---

def _get_recurrence_dates(
    start: date, rule: RecurrenceRule, weeks_ahead: int = 4
) -> list[date]:
    end = start + timedelta(weeks=weeks_ahead)
    max_count = rule.count if rule.count else float("inf")
    dates: list[date] = []

    if rule.type == "daily":
        d = start + timedelta(days=1)
        while d <= end and len(dates) < max_count:
            dates.append(d)
            d += timedelta(days=1)

    elif rule.type == "weekly":
        d = start + timedelta(weeks=1)
        while d <= end and len(dates) < max_count:
            dates.append(d)
            d += timedelta(weeks=1)

    elif rule.type == "monthly":
        day_of_month = start.day
        for m in range(1, 4):
            if len(dates) >= max_count:
                break
            month = start.month + m
            year = start.year + (month - 1) // 12
            month = ((month - 1) % 12) + 1
            try:
                dates.append(date(year, month, day_of_month))
            except ValueError:
                pass

    elif rule.type == "custom":
        interval = rule.interval or 1
        if rule.daysOfWeek:
            d = start + timedelta(days=1)
            while d <= end and len(dates) < max_count:
                if d.weekday() in _iso_from_js_days(rule.daysOfWeek):
                    dates.append(d)
                d += timedelta(days=1)
        else:
            d = start + timedelta(days=interval)
            while d <= end and len(dates) < max_count:
                dates.append(d)
                d += timedelta(days=interval)

    return dates


def _iso_from_js_days(js_days: list[int]) -> set[int]:
    """convert JS day-of-week (0=sun) to python weekday (0=mon)."""
    mapping = {0: 6, 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5}
    return {mapping[d] for d in js_days}


@router.post("/tasks/{task_id}/recurrence", response_model=list[TaskOut])
def set_recurrence(
    task_id: int,
    body: RecurrenceRule,
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "task not found")

    # remove old uncompleted instances
    old = (
        db.query(Task)
        .filter(Task.recurring_parent_id == task_id, Task.completed == False)
        .all()
    )
    for t in old:
        db.delete(t)

    task.recurrence = body.model_dump(exclude_none=True)
    db.flush()

    if not task.date:
        db.commit()
        db.refresh(task)
        return [task_response(task)]

    # generate new instances
    future_dates = _get_recurrence_dates(task.date, body)
    existing = {
        t.date
        for t in db.query(Task)
        .filter(Task.recurring_parent_id == task_id, Task.completed == True)
        .all()
    }

    new_tasks = []
    for d in future_dates:
        if d in existing:
            continue
        t = Task(
            title=task.title,
            date=d,
            category=task.category,
            color=task.color,
            notes=task.notes,
            recurring_parent_id=task_id,
            task_order=0,
        )
        db.add(t)
        new_tasks.append(t)

    db.commit()
    db.refresh(task)
    for t in new_tasks:
        db.refresh(t)

    return [task_response(task)] + [task_response(t) for t in new_tasks]


@router.delete("/tasks/{task_id}/recurrence")
def remove_recurrence(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(404, "task not found")

    # remove old uncompleted instances
    old = (
        db.query(Task)
        .filter(Task.recurring_parent_id == task_id, Task.completed == False)
        .all()
    )
    for t in old:
        db.delete(t)

    task.recurrence = None
    db.commit()
    return {"ok": True}


# --- move / reorder ---

@router.post("/tasks/move", response_model=list[TaskOut])
def move_task(body: MoveTask, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == body.taskId).first()
    if not task:
        raise HTTPException(404, "task not found")

    new_date = parse_date(body.newDate)
    task.date = new_date
    task.category = body.newCategory

    # reorder all tasks in the target slot
    target_tasks = (
        db.query(Task)
        .filter(
            Task.date == new_date,
            Task.category == body.newCategory,
            Task.id != body.taskId,
            Task.is_label == False,
        )
        .order_by(Task.task_order)
        .all()
    )

    ordered = []
    for t in target_tasks:
        ordered.append(t)

    ordered.insert(body.newIndex, task)
    for i, t in enumerate(ordered):
        t.task_order = i

    db.commit()

    all_updated = [task] + target_tasks
    for t in all_updated:
        db.refresh(t)
    return [task_response(t) for t in all_updated]


# --- rollover ---

@router.post("/tasks/rollover")
def rollover_tasks(db: Session = Depends(get_db)):
    today = date.today()
    stale = (
        db.query(Task)
        .filter(
            Task.date < today,
            Task.completed == False,
            Task.is_label == False,
            Task.recurring_parent_id == None,
        )
        .all()
    )
    count = 0
    for t in stale:
        t.date = today
        count += 1
    db.commit()
    return {"rolled_over": count}
