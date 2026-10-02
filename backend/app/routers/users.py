from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import UserProfile
from ..schemas import UserProfileCreate, UserProfileResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/profile", response_model=UserProfileResponse)
def create_profile(profile: UserProfileCreate, db: Session = Depends(get_db)):
    db_profile = UserProfile(**profile.model_dump())
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    return db_profile


@router.get("/profile/{profile_id}", response_model=UserProfileResponse)
def get_profile(profile_id: int, db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.id == profile_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.get("/profiles", response_model=List[UserProfileResponse])
def list_profiles(db: Session = Depends(get_db)):
    return db.query(UserProfile).all()


@router.put("/profile/{profile_id}", response_model=UserProfileResponse)
def update_profile(profile_id: int, profile: UserProfileCreate, db: Session = Depends(get_db)):
    db_profile = db.query(UserProfile).filter(UserProfile.id == profile_id).first()
    if not db_profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    for key, value in profile.model_dump().items():
        setattr(db_profile, key, value)
    db.commit()
    db.refresh(db_profile)
    return db_profile
