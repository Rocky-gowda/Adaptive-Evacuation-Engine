from pydantic import BaseModel, Field
from typing import Optional, List, Any, Dict
from datetime import datetime


# --- UserProfile ---
class UserProfileCreate(BaseModel):
    name: Optional[str] = "Anonymous"
    mobility_type: str  # wheelchair, elderly, walker, temporary_injury, general
    cannot_use_stairs: bool = False
    requires_ramp: bool = False
    requires_low_gradient: bool = False
    requires_wide_pathway: bool = False
    requires_assistance: bool = False


class UserProfileResponse(UserProfileCreate):
    id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# --- Route ---
class RouteResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    start_lat: float
    start_lng: float
    end_lat: float
    end_lng: float
    total_distance_m: float
    estimated_time_min: float
    has_stairs: bool
    has_ramp: bool
    max_slope_percent: float
    min_width_m: float
    surface_condition: str
    is_accessible: bool
    geojson: Optional[Any]

    class Config:
        from_attributes = True


# --- Hazard ---
class HazardCreate(BaseModel):
    hazard_type: str
    latitude: float
    longitude: float
    severity: str = "medium"
    description: Optional[str] = None
    confidence: float = 0.5
    status: str = "active"
    reported_by: str = "citizen"
    radius_m: float = 100


class HazardResponse(HazardCreate):
    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


# --- HazardReport ---
class HazardReportCreate(BaseModel):
    hazard_type: str
    latitude: float
    longitude: float
    severity: str = "medium"
    description: Optional[str] = None
    reporter_type: str = "citizen"
    image_url: Optional[str] = None


class HazardReportResponse(HazardReportCreate):
    id: int
    confidence_score: float
    is_verified: bool
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


# --- Shelter ---
class ShelterResponse(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float
    capacity: int
    current_occupancy: int
    wheelchair_accessible: bool
    has_ramp: bool
    has_accessible_entrance: bool
    has_elevator: bool
    has_medical_support: bool
    shelter_type: str
    status: str
    contact_number: Optional[str]

    class Config:
        from_attributes = True


# --- Evacuation ---
class EvacuationRequest(BaseModel):
    user_profile: UserProfileCreate
    current_lat: float
    current_lng: float
    destination_lat: Optional[float] = None
    destination_lng: Optional[float] = None


class RouteCandidate(BaseModel):
    route_id: int
    route_name: str
    distance_m: float
    estimated_time_min: float
    feasibility_score: float
    is_recommended: bool
    geojson: Optional[Any]
    reasons_accepted: List[str] = []
    reasons_rejected: List[str] = []
    hazard_details: List[Dict] = []
    accessibility_flags: Dict[str, Any] = {}


class EvacuationResponse(BaseModel):
    recommended_route: Optional[RouteCandidate]
    all_routes: List[RouteCandidate]
    recommended_shelter: Optional[Dict]
    summary: str
    profile_summary: str
    rerouted: bool = False
    reroute_reason: Optional[str] = None


# --- Dashboard ---
class DashboardStats(BaseModel):
    active_hazards: int
    affected_routes: int
    available_shelters: int
    total_shelters: int
    people_requiring_assistance: int
    active_recommendations: int
    shelter_capacity_used_pct: float
    recent_hazards: List[Dict] = []
    route_feasibility_summary: List[Dict] = []
