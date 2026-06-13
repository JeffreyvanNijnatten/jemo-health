from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, Date, Text, UniqueConstraint, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class Profile(Base):
    __tablename__ = "profiles"

    slot_id = Column(Integer, primary_key=True)
    name = Column(String, nullable=True)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(Integer, nullable=True)       # 1=male, 2=female
    height_cm = Column(Float, nullable=True)
    body_type = Column(Integer, nullable=True)    # 0=standard, 2=athlete
    activity_level = Column(Integer, nullable=True)
    ethnicity = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    measurements = relationship("Measurement", back_populates="profile", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="profile", cascade="all, delete-orphan")


class Measurement(Base):
    __tablename__ = "measurements"

    id = Column(Integer, primary_key=True, autoincrement=True)
    profile_id = Column(Integer, ForeignKey("profiles.slot_id"), nullable=False)
    measured_at = Column(DateTime, nullable=False)

    # Profile snapshot at time of measurement (may change over time on scale)
    height_cm = Column(Float, nullable=True)
    body_type = Column(Integer, nullable=True)
    activity_level = Column(Integer, nullable=True)
    age = Column(Integer, nullable=True)

    # Core body metrics
    weight_kg = Column(Float, nullable=True)
    bmi = Column(Float, nullable=True)

    # Body fat percentages
    fat_total_pct = Column(Float, nullable=True)    # FT - total body fat %
    fat_trunk_pct = Column(Float, nullable=True)    # FW - trunk fat %
    fat_right_arm_pct = Column(Float, nullable=True)  # Fr
    fat_left_arm_pct = Column(Float, nullable=True)   # Fl
    fat_right_leg_pct = Column(Float, nullable=True)  # FR
    fat_left_leg_pct = Column(Float, nullable=True)   # FL

    # Muscle masses (kg)
    muscle_total_kg = Column(Float, nullable=True)    # mW - total muscle mass
    muscle_trunk_kg = Column(Float, nullable=True)    # mT - trunk muscle
    muscle_right_arm_kg = Column(Float, nullable=True)  # mr
    muscle_left_arm_kg = Column(Float, nullable=True)   # ml
    muscle_right_leg_kg = Column(Float, nullable=True)  # mR
    muscle_left_leg_kg = Column(Float, nullable=True)   # mL

    # Other metrics
    bone_kg = Column(Float, nullable=True)           # bW
    visceral_fat = Column(Integer, nullable=True)    # IF (1-59 scale)
    resting_calories = Column(Integer, nullable=True) # rD (kcal)
    metabolic_age = Column(Integer, nullable=True)   # rA (years)
    water_pct = Column(Float, nullable=True)          # ww = body water %

    # User annotation
    note = Column(Text, nullable=True)

    profile = relationship("Profile", back_populates="measurements")

    __table_args__ = (
        UniqueConstraint("profile_id", "measured_at", name="uq_profile_measurement"),
    )


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, autoincrement=True)
    profile_id = Column(Integer, ForeignKey("profiles.slot_id"), nullable=False)
    metric = Column(String, nullable=False)   # e.g. "weight_kg", "fat_total_pct"
    target_value = Column(Float, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    profile = relationship("Profile", back_populates="goals")

    __table_args__ = (
        UniqueConstraint("profile_id", "metric", name="uq_profile_metric_goal"),
    )
