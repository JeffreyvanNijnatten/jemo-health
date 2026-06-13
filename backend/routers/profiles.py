from datetime import datetime, date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database import get_db
from models import Profile

router = APIRouter(prefix="/api/profiles", tags=["profiles"])


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    ethnicity: Optional[str] = None


class ProfileOut(BaseModel):
    slot_id: int
    name: Optional[str]
    date_of_birth: Optional[date]
    gender: Optional[int]
    height_cm: Optional[float]
    body_type: Optional[int]
    activity_level: Optional[int]
    ethnicity: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("", response_model=list[ProfileOut])
def list_profiles(db: Session = Depends(get_db)):
    return db.query(Profile).order_by(Profile.slot_id).all()


@router.patch("/{slot_id}", response_model=ProfileOut)
def update_profile(slot_id: int, body: ProfileUpdate, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.slot_id == slot_id).first()
    if not profile:
        raise HTTPException(404, "Profile not found")
    if body.name is not None:
        profile.name = body.name.strip() or None
    if body.ethnicity is not None:
        profile.ethnicity = body.ethnicity
    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)
    return profile
