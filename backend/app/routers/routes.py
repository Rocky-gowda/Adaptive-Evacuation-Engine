from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Route
from ..schemas import RouteResponse

router = APIRouter(prefix="/routes", tags=["routes"])


@router.get("", response_model=List[RouteResponse])
def list_routes(db: Session = Depends(get_db)):
    return db.query(Route).all()
