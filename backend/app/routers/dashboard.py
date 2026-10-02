from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict

from ..database import get_db
from ..models import Hazard, Route, Shelter, UserProfile, EvacuationRecommendation, HazardReport
from ..schemas import DashboardStats
from ..services.feasibility import compute_feasibility

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/statistics", response_model=DashboardStats)
def get_statistics(db: Session = Depends(get_db)):
    active_hazards = db.query(Hazard).filter(Hazard.status == "active").count()

    # Count routes affected by active hazards
    from ..services.feasibility import _point_near_route
    all_routes = db.query(Route).all()
    all_active_hazards = db.query(Hazard).filter(Hazard.status == "active").all()
    affected_routes = 0
    for route in all_routes:
        for hazard in all_active_hazards:
            if _point_near_route(hazard.latitude, hazard.longitude, route.geojson, hazard.radius_m):
                affected_routes += 1
                break

    all_shelters = db.query(Shelter).all()
    open_shelters = [s for s in all_shelters if s.status == "open"]
    available_shelters = len(open_shelters)

    total_capacity = sum(s.capacity for s in open_shelters)
    total_occupancy = sum(s.current_occupancy for s in open_shelters)
    capacity_used_pct = round((total_occupancy / max(total_capacity, 1)) * 100, 1)

    people_requiring = db.query(UserProfile).filter(
        UserProfile.requires_assistance == True
    ).count()

    active_recs = db.query(EvacuationRecommendation).filter(
        EvacuationRecommendation.status == "active"
    ).count()

    # Recent hazards
    recent_hazards_q = (
        db.query(Hazard)
        .order_by(Hazard.created_at.desc())
        .limit(5)
        .all()
    )
    recent_hazards = [
        {
            "id": h.id,
            "type": h.hazard_type,
            "severity": h.severity,
            "status": h.status,
            "confidence": h.confidence,
            "lat": h.latitude,
            "lng": h.longitude,
        }
        for h in recent_hazards_q
    ]

    # Route feasibility summary (use a generic "general" profile)
    class _GenProfile:
        mobility_type = "general"
        cannot_use_stairs = False
        requires_ramp = False
        requires_low_gradient = False
        requires_wide_pathway = False
        requires_assistance = False

    route_summary = []
    for route in all_routes:
        res = compute_feasibility(route, _GenProfile(), all_active_hazards)
        route_summary.append({
            "id": route.id,
            "name": route.name,
            "feasibility": res["score"],
            "distance_m": route.total_distance_m,
            "has_stairs": route.has_stairs,
            "is_accessible": route.is_accessible,
        })

    return DashboardStats(
        active_hazards=active_hazards,
        affected_routes=affected_routes,
        available_shelters=available_shelters,
        total_shelters=len(all_shelters),
        people_requiring_assistance=people_requiring,
        active_recommendations=active_recs,
        shelter_capacity_used_pct=capacity_used_pct,
        recent_hazards=recent_hazards,
        route_feasibility_summary=route_summary,
    )
