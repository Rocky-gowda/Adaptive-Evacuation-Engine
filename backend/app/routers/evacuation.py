from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import math

from ..database import get_db
from ..models import Route, Hazard, Shelter, UserProfile, EvacuationRecommendation
from ..schemas import EvacuationRequest, EvacuationResponse, RouteCandidate
from ..services.feasibility import compute_feasibility, score_shelter

router = APIRouter(prefix="/evacuation", tags=["evacuation"])


def _haversine(lat1, lon1, lat2, lon2) -> float:
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _build_profile_obj(data: dict):
    """Build a lightweight object from a dict so feasibility engine can use getattr."""
    class _Profile:
        pass
    p = _Profile()
    for k, v in data.items():
        setattr(p, k, v)
    return p


def _calculate_routes(
    user_profile_obj,
    active_hazards,
    db: Session,
    reference_distance_m: float = 1200,
) -> List[RouteCandidate]:
    routes = db.query(Route).all()
    candidates = []
    for route in routes:
        result = compute_feasibility(route, user_profile_obj, active_hazards, reference_distance_m)
        candidates.append(RouteCandidate(
            route_id=route.id,
            route_name=route.name,
            distance_m=route.total_distance_m,
            estimated_time_min=route.estimated_time_min,
            feasibility_score=result["score"],
            is_recommended=False,
            geojson=route.geojson,
            reasons_accepted=result["reasons_accepted"],
            reasons_rejected=result["reasons_rejected"],
            hazard_details=result["hazard_details"],
            accessibility_flags=result["accessibility_flags"],
        ))
    return candidates


@router.post("/calculate", response_model=EvacuationResponse)
def calculate_evacuation(request: EvacuationRequest, db: Session = Depends(get_db)):
    profile_dict = request.user_profile.model_dump()
    user_profile_obj = _build_profile_obj(profile_dict)

    active_hazards = db.query(Hazard).filter(Hazard.status == "active").all()
    candidates = _calculate_routes(user_profile_obj, active_hazards, db)

    # Sort by feasibility score desc
    candidates.sort(key=lambda c: c.feasibility_score, reverse=True)

    recommended = None
    if candidates:
        best = candidates[0]
        if best.feasibility_score >= 10:
            best.is_recommended = True
            recommended = best
        else:
            # No viable route
            pass

    # Shelter matching
    shelters = db.query(Shelter).filter(Shelter.status == "open").all()
    best_shelter = None
    best_shelter_score = -1
    for shelter in shelters:
        s_score = score_shelter(shelter, user_profile_obj)
        if s_score > best_shelter_score:
            best_shelter_score = s_score
            best_shelter = shelter

    shelter_dict = None
    if best_shelter:
        shelter_dict = {
            "id": best_shelter.id,
            "name": best_shelter.name,
            "latitude": best_shelter.latitude,
            "longitude": best_shelter.longitude,
            "capacity": best_shelter.capacity,
            "current_occupancy": best_shelter.current_occupancy,
            "availability_pct": round((1 - best_shelter.current_occupancy / max(best_shelter.capacity, 1)) * 100, 1),
            "wheelchair_accessible": best_shelter.wheelchair_accessible,
            "has_ramp": best_shelter.has_ramp,
            "has_medical_support": best_shelter.has_medical_support,
            "has_elevator": best_shelter.has_elevator,
            "accessibility_score": round(best_shelter_score, 1),
            "status": best_shelter.status,
            "contact_number": best_shelter.contact_number,
        }

    # Build summary
    mobility = profile_dict.get("mobility_type", "general")
    if recommended:
        summary = (
            f"Route '{recommended.route_name}' is recommended with a feasibility score of "
            f"{recommended.feasibility_score}%. This route has been selected based on your "
            f"{mobility.replace('_', ' ')} mobility profile and current hazard conditions."
        )
        profile_summary = _build_profile_summary(profile_dict)
    else:
        summary = (
            "No fully accessible route is currently available. "
            "Please request assisted evacuation or contact emergency services."
        )
        profile_summary = _build_profile_summary(profile_dict)

    # Persist recommendation
    try:
        rec = EvacuationRecommendation(
            recommended_route_id=recommended.route_id if recommended else None,
            recommended_shelter_id=best_shelter.id if best_shelter else None,
            feasibility_score=recommended.feasibility_score if recommended else 0,
            route_details={c.route_name: c.feasibility_score for c in candidates},
            reasoning={"summary": summary},
        )
        db.add(rec)
        db.commit()
    except Exception:
        db.rollback()

    return EvacuationResponse(
        recommended_route=recommended,
        all_routes=candidates,
        recommended_shelter=shelter_dict,
        summary=summary,
        profile_summary=profile_summary,
    )


@router.post("/recalculate", response_model=EvacuationResponse)
def recalculate_evacuation(request: EvacuationRequest, db: Session = Depends(get_db)):
    """Same as calculate but marks rerouted=True and includes reroute reason."""
    profile_dict = request.user_profile.model_dump()
    user_profile_obj = _build_profile_obj(profile_dict)

    active_hazards = db.query(Hazard).filter(Hazard.status == "active").all()
    candidates = _calculate_routes(user_profile_obj, active_hazards, db)
    candidates.sort(key=lambda c: c.feasibility_score, reverse=True)

    recommended = None
    prev_recommended_name = None
    reroute_reason = None

    # Find previous recommendation to compare
    prev_rec = db.query(EvacuationRecommendation).order_by(
        EvacuationRecommendation.id.desc()
    ).first()

    if prev_rec and prev_rec.recommended_route_id:
        prev_route = db.query(Route).filter(Route.id == prev_rec.recommended_route_id).first()
        if prev_route:
            prev_recommended_name = prev_route.name

    if candidates:
        best = candidates[0]
        if best.feasibility_score >= 10:
            best.is_recommended = True
            recommended = best
            if prev_recommended_name and best.route_name != prev_recommended_name:
                reroute_reason = (
                    f"Route changed from '{prev_recommended_name}' to '{best.route_name}' "
                    f"because new hazards reduced the previous route's feasibility."
                )

    shelters = db.query(Shelter).filter(Shelter.status == "open").all()
    best_shelter = None
    best_shelter_score = -1
    for shelter in shelters:
        s_score = score_shelter(shelter, user_profile_obj)
        if s_score > best_shelter_score:
            best_shelter_score = s_score
            best_shelter = shelter

    shelter_dict = None
    if best_shelter:
        shelter_dict = {
            "id": best_shelter.id,
            "name": best_shelter.name,
            "latitude": best_shelter.latitude,
            "longitude": best_shelter.longitude,
            "capacity": best_shelter.capacity,
            "current_occupancy": best_shelter.current_occupancy,
            "availability_pct": round((1 - best_shelter.current_occupancy / max(best_shelter.capacity, 1)) * 100, 1),
            "wheelchair_accessible": best_shelter.wheelchair_accessible,
            "has_ramp": best_shelter.has_ramp,
            "has_medical_support": best_shelter.has_medical_support,
            "has_elevator": best_shelter.has_elevator,
            "accessibility_score": round(best_shelter_score, 1),
            "status": best_shelter.status,
            "contact_number": best_shelter.contact_number,
        }

    mobility = profile_dict.get("mobility_type", "general")
    if recommended:
        summary = (
            f"[REROUTED] Route '{recommended.route_name}' is now recommended with "
            f"{recommended.feasibility_score}% feasibility based on updated hazard conditions."
        )
    else:
        summary = "No accessible route available after rerouting. Please request assisted evacuation."

    return EvacuationResponse(
        recommended_route=recommended,
        all_routes=candidates,
        recommended_shelter=shelter_dict,
        summary=summary,
        profile_summary=_build_profile_summary(profile_dict),
        rerouted=True,
        reroute_reason=reroute_reason,
    )


def _build_profile_summary(profile_dict: dict) -> str:
    mobility = profile_dict.get("mobility_type", "general").replace("_", " ").title()
    reqs = []
    if profile_dict.get("cannot_use_stairs"):
        reqs.append("Cannot use stairs")
    if profile_dict.get("requires_ramp"):
        reqs.append("Requires ramp")
    if profile_dict.get("requires_low_gradient"):
        reqs.append("Requires low gradient")
    if profile_dict.get("requires_wide_pathway"):
        reqs.append("Requires wide pathway")
    if profile_dict.get("requires_assistance"):
        reqs.append("Requires assistance")
    req_str = "; ".join(reqs) if reqs else "No special requirements"
    return f"Mobility: {mobility} | Requirements: {req_str}"
