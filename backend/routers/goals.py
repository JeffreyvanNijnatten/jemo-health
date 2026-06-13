from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import Goal

router = APIRouter(prefix="/api/profiles", tags=["goals"])


class GoalUpsert(BaseModel):
    target_value: float


class GoalOut(BaseModel):
    id: int
    profile_id: int
    metric: str
    target_value: float
    updated_at: datetime

    class Config:
        from_attributes = True


@router.get("/{slot_id}/goals", response_model=list[GoalOut])
def get_goals(slot_id: int, db: Session = Depends(get_db)):
    return db.query(Goal).filter(Goal.profile_id == slot_id).all()


@router.put("/{slot_id}/goals/{metric}", response_model=GoalOut)
def upsert_goal(slot_id: int, metric: str, body: GoalUpsert, db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.profile_id == slot_id, Goal.metric == metric).first()
    if goal:
        goal.target_value = body.target_value
        goal.updated_at = datetime.utcnow()
    else:
        goal = Goal(profile_id=slot_id, metric=metric, target_value=body.target_value)
        db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/{slot_id}/goals/{metric}", status_code=204)
def delete_goal(slot_id: int, metric: str, db: Session = Depends(get_db)):
    goal = db.query(Goal).filter(Goal.profile_id == slot_id, Goal.metric == metric).first()
    if goal:
        db.delete(goal)
        db.commit()
