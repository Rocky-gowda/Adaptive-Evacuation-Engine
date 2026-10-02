from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Shelter
from ..schemas import ShelterResponse

router = APIRouter(prefix="/shelters", tags=["shelters"])


@router.get("", response_model=List[ShelterResponse])
def list_shelters(db: Session = Depends(get_db)):
    return db.query(Shelter).all()


@router.get("/{shelter_id}", response_model=ShelterResponse)
def get_shelter(shelter_id: int, db: Session = Depends(get_db)):
    from fastapi import HTTPException
    shelter = db.query(Shelter).filter(Shelter.id == shelter_id).first()
    if not shelter:
        raise HTTPException(status_code=404, detail="Shelter not found")
    return shelter
