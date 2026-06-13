from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import Measurement

router = APIRouter(prefix="/api/profiles", tags=["measurements"])


class MeasurementOut(BaseModel):
    id: int
    profile_id: int
    measured_at: datetime
    height_cm: Optional[float]
    body_type: Optional[int]
    activity_level: Optional[int]
    age: Optional[int]
    weight_kg: Optional[float]
    bmi: Optional[float]
    fat_total_pct: Optional[float]
    fat_trunk_pct: Optional[float]
    fat_right_arm_pct: Optional[float]
    fat_left_arm_pct: Optional[float]
    fat_right_leg_pct: Optional[float]
    fat_left_leg_pct: Optional[float]
    muscle_total_kg: Optional[float]
    muscle_trunk_kg: Optional[float]
    muscle_right_arm_kg: Optional[float]
    muscle_left_arm_kg: Optional[float]
    muscle_right_leg_kg: Optional[float]
    muscle_left_leg_kg: Optional[float]
    bone_kg: Optional[float]
    visceral_fat: Optional[int]
    resting_calories: Optional[int]
    metabolic_age: Optional[int]
    water_pct: Optional[float]
    note: Optional[str]

    class Config:
        from_attributes = True


class NoteUpdate(BaseModel):
    note: Optional[str]


@router.get("/{slot_id}/measurements", response_model=list[MeasurementOut])
def get_measurements(
    slot_id: int,
    days: Optional[int] = Query(None, description="Filter to last N days"),
    db: Session = Depends(get_db),
):
    q = db.query(Measurement).filter(Measurement.profile_id == slot_id)
    if days:
        cutoff = datetime.utcnow()
        from datetime import timedelta
        cutoff = cutoff - timedelta(days=days)
        q = q.filter(Measurement.measured_at >= cutoff)
    return q.order_by(Measurement.measured_at).all()


@router.patch("/{slot_id}/measurements/{measurement_id}/note", response_model=MeasurementOut)
def update_note(
    slot_id: int,
    measurement_id: int,
    body: NoteUpdate,
    db: Session = Depends(get_db),
):
    m = db.query(Measurement).filter(
        Measurement.id == measurement_id,
        Measurement.profile_id == slot_id,
    ).first()
    if not m:
        raise HTTPException(404, "Measurement not found")
    m.note = body.note
    db.commit()
    db.refresh(m)
    return m
