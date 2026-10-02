from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Hazard, HazardReport
from ..schemas import HazardCreate, HazardResponse, HazardReportCreate, HazardReportResponse

router = APIRouter(prefix="/hazards", tags=["hazards"])

# Source-reliability weights for confidence calculation
REPORTER_WEIGHTS = {"authority": 0.95, "responder": 0.80, "citizen": 0.55}


@router.get("", response_model=List[HazardResponse])
def list_hazards(db: Session = Depends(get_db)):
    return db.query(Hazard).filter(Hazard.status != "resolved").all()


@router.get("/all", response_model=List[HazardResponse])
def list_all_hazards(db: Session = Depends(get_db)):
    return db.query(Hazard).all()


@router.post("", response_model=HazardResponse)
def create_hazard(hazard: HazardCreate, db: Session = Depends(get_db)):
    db_hazard = Hazard(**hazard.model_dump())
    db.add(db_hazard)
    db.commit()
    db.refresh(db_hazard)
    return db_hazard


@router.patch("/{hazard_id}/resolve", response_model=HazardResponse)
def resolve_hazard(hazard_id: int, db: Session = Depends(get_db)):
    hazard = db.query(Hazard).filter(Hazard.id == hazard_id).first()
    if not hazard:
        raise HTTPException(status_code=404, detail="Hazard not found")
    hazard.status = "resolved"
    db.commit()
    db.refresh(hazard)
    return hazard


@router.delete("/{hazard_id}")
def delete_hazard(hazard_id: int, db: Session = Depends(get_db)):
    hazard = db.query(Hazard).filter(Hazard.id == hazard_id).first()
    if not hazard:
        raise HTTPException(status_code=404, detail="Hazard not found")
    db.delete(hazard)
    db.commit()
    return {"message": "Hazard deleted"}


@router.post("/report", response_model=HazardReportResponse)
def submit_report(report: HazardReportCreate, db: Session = Depends(get_db)):
    # Calculate confidence score
    base_confidence = REPORTER_WEIGHTS.get(report.reporter_type, 0.5)
    confidence = round(base_confidence, 2)

    db_report = HazardReport(
        **report.model_dump(),
        confidence_score=confidence,
        is_verified=(report.reporter_type == "authority"),
    )
    db.add(db_report)

    # Upsert a Hazard entry so it appears on map
    existing = db.query(Hazard).filter(
        Hazard.hazard_type == report.hazard_type,
        Hazard.status == "active",
    ).first()

    if existing:
        # Aggregate confidence
        existing.confidence = min(1.0, existing.confidence + 0.05)
        db_report.hazard_id = existing.id
    else:
        new_hazard = Hazard(
            hazard_type=report.hazard_type,
            latitude=report.latitude,
            longitude=report.longitude,
            severity=report.severity,
            description=report.description,
            confidence=confidence,
            status="active",
            reported_by=report.reporter_type,
            radius_m=100,
        )
        db.add(new_hazard)
        db.flush()
        db_report.hazard_id = new_hazard.id

    db.commit()
    db.refresh(db_report)
    return db_report


@router.get("/reports", response_model=List[HazardReportResponse])
def list_reports(db: Session = Depends(get_db)):
    return db.query(HazardReport).order_by(HazardReport.created_at.desc()).limit(50).all()
