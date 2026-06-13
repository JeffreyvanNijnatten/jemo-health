from fastapi import APIRouter, Depends, File, UploadFile, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime, date
from database import get_db
from models import Profile, Measurement
from parser import parse_zip

router = APIRouter(prefix="/api", tags=["upload"])


class ProfileResult(BaseModel):
    slot_id: int
    added: int
    skipped: int


class UploadResult(BaseModel):
    profiles: list[ProfileResult]
    total_added: int
    total_skipped: int


@router.post("/upload", response_model=UploadResult)
async def upload_tanita(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename:
        raise HTTPException(400, "No file provided")

    data = await file.read()
    try:
        parsed = parse_zip(data)
    except Exception as e:
        raise HTTPException(400, f"Could not parse file: {e}")

    results: dict[int, ProfileResult] = {}

    # Upsert profiles (update height/gender/etc. but don't overwrite user name)
    for p in parsed["profiles"]:
        slot_id = p["slot_id"]
        dob_str = p.get("date_of_birth")
        dob = date.fromisoformat(dob_str) if dob_str else None
        existing = db.query(Profile).filter(Profile.slot_id == slot_id).first()
        if existing:
            existing.date_of_birth = dob or existing.date_of_birth
            existing.gender = p.get("gender") or existing.gender
            existing.height_cm = p.get("height_cm") or existing.height_cm
            existing.body_type = p.get("body_type") if p.get("body_type") is not None else existing.body_type
            existing.activity_level = p.get("activity_level") or existing.activity_level
            existing.updated_at = datetime.utcnow()
        else:
            db.add(Profile(
                slot_id=slot_id,
                name=None,  # triggers name prompt in UI
                date_of_birth=dob,
                gender=p.get("gender"),
                height_cm=p.get("height_cm"),
                body_type=p.get("body_type"),
                activity_level=p.get("activity_level"),
            ))
        db.commit()
        results[slot_id] = ProfileResult(slot_id=slot_id, added=0, skipped=0)

    # Insert measurements with deduplication
    for m in parsed["measurements"]:
        slot_id = m["profile_id"]
        if slot_id not in results:
            results[slot_id] = ProfileResult(slot_id=slot_id, added=0, skipped=0)

        measured_at = datetime.fromisoformat(m["measured_at"])
        try:
            db.add(Measurement(
                profile_id=slot_id,
                measured_at=measured_at,
                height_cm=m.get("height_cm"),
                body_type=m.get("body_type"),
                activity_level=m.get("activity_level"),
                age=m.get("age"),
                weight_kg=m.get("weight_kg"),
                bmi=m.get("bmi"),
                fat_total_pct=m.get("fat_total_pct"),
                fat_trunk_pct=m.get("fat_trunk_pct"),
                fat_right_arm_pct=m.get("fat_right_arm_pct"),
                fat_left_arm_pct=m.get("fat_left_arm_pct"),
                fat_right_leg_pct=m.get("fat_right_leg_pct"),
                fat_left_leg_pct=m.get("fat_left_leg_pct"),
                muscle_total_kg=m.get("muscle_total_kg"),
                muscle_trunk_kg=m.get("muscle_trunk_kg"),
                muscle_right_arm_kg=m.get("muscle_right_arm_kg"),
                muscle_left_arm_kg=m.get("muscle_left_arm_kg"),
                muscle_right_leg_kg=m.get("muscle_right_leg_kg"),
                muscle_left_leg_kg=m.get("muscle_left_leg_kg"),
                bone_kg=m.get("bone_kg"),
                visceral_fat=m.get("visceral_fat"),
                resting_calories=m.get("resting_calories"),
                metabolic_age=m.get("metabolic_age"),
                water_pct=m.get("water_pct"),
            ))
            db.commit()
            results[slot_id].added += 1
        except IntegrityError:
            db.rollback()
            results[slot_id].skipped += 1

    profile_results = list(results.values())
    return UploadResult(
        profiles=profile_results,
        total_added=sum(r.added for r in profile_results),
        total_skipped=sum(r.skipped for r in profile_results),
    )
