"""
Feasibility Scoring Engine — the core innovation of this project.

Scores each route 0–100 for a specific user's mobility profile.
Weights are profile-specific so the same hazard produces different penalties
for a wheelchair user vs. a general user.
"""

from typing import Dict, List, Any, Optional
import math


# ── Mobility-profile weight tables ──────────────────────────────────────────

PROFILE_WEIGHTS: Dict[str, Dict[str, float]] = {
    "wheelchair": {
        "stairs":           40.0,   # near-impassable
        "slope":            20.0,
        "ramp_missing":     15.0,
        "width":            10.0,
        "surface":           5.0,
        "flood":            20.0,
        "blocked":          25.0,
        "damaged":          15.0,
        "distance":          5.0,
    },
    "elderly": {
        "stairs":           25.0,
        "slope":            25.0,
        "ramp_missing":     10.0,
        "width":             5.0,
        "surface":          10.0,
        "flood":            20.0,
        "blocked":          20.0,
        "damaged":          15.0,
        "distance":         15.0,
    },
    "walker": {
        "stairs":           20.0,
        "slope":            15.0,
        "ramp_missing":      8.0,
        "width":             5.0,
        "surface":           8.0,
        "flood":            22.0,
        "blocked":          25.0,
        "damaged":          15.0,
        "distance":         12.0,
    },
    "temporary_injury": {
        "stairs":           15.0,
        "slope":            12.0,
        "ramp_missing":      5.0,
        "width":             3.0,
        "surface":          10.0,
        "flood":            22.0,
        "blocked":          25.0,
        "damaged":          18.0,
        "distance":         15.0,
    },
    "general": {
        "stairs":            5.0,
        "slope":             5.0,
        "ramp_missing":      0.0,
        "width":             2.0,
        "surface":           5.0,
        "flood":            25.0,
        "blocked":          30.0,
        "damaged":          20.0,
        "distance":         20.0,
    },
}

SEVERITY_FLOOD_PENALTY = {"low": 0.3, "medium": 0.6, "high": 0.9, "critical": 1.0}
SEVERITY_BLOCKED_PENALTY = {"low": 0.5, "medium": 0.8, "high": 1.0, "critical": 1.0}
SEVERITY_DAMAGED_PENALTY = {"low": 0.2, "medium": 0.5, "high": 0.8, "critical": 1.0}

SURFACE_PENALTY = {"good": 0.0, "fair": 0.3, "poor": 0.8}


def _haversine(lat1, lon1, lat2, lon2) -> float:
    """Return distance in metres between two lat/lng points."""
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _point_near_route(hazard_lat, hazard_lng, route_geojson, radius_m=150) -> bool:
    """
    Check whether a hazard point is within `radius_m` of any segment
    in the route GeoJSON (LineString or MultiLineString).
    """
    if not route_geojson:
        return False
    coords: List = []
    geom = route_geojson.get("geometry") or route_geojson
    gtype = geom.get("type", "")
    if gtype == "LineString":
        coords = geom.get("coordinates", [])
    elif gtype == "MultiLineString":
        for line in geom.get("coordinates", []):
            coords.extend(line)
    elif gtype == "FeatureCollection":
        for feat in geom.get("features", []):
            g = feat.get("geometry", {})
            if g.get("type") == "LineString":
                coords.extend(g.get("coordinates", []))
    for coord in coords:
        lng, lat = coord[0], coord[1]
        if _haversine(hazard_lat, hazard_lng, lat, lng) <= radius_m:
            return True
    return False


def compute_feasibility(
    route: Any,
    user_profile: Any,
    active_hazards: List[Any],
    reference_distance_m: float = 1000,
) -> Dict:
    """
    Return a dict:
        score          – 0..100
        reasons_accepted – list[str]
        reasons_rejected – list[str]
        hazard_details – list[dict]
        accessibility_flags – dict
        penalty_breakdown – dict   (for transparency)
    """
    mobility = getattr(user_profile, "mobility_type", "general")
    if mobility not in PROFILE_WEIGHTS:
        mobility = "general"
    W = PROFILE_WEIGHTS[mobility]

    penalty = 0.0
    reasons_accepted: List[str] = []
    reasons_rejected: List[str] = []
    hazard_details: List[Dict] = []
    penalty_breakdown: Dict[str, float] = {}
    accessibility_flags: Dict[str, Any] = {}

    # ── 1. Stairs ───────────────────────────────────────────────────────────
    has_stairs = getattr(route, "has_stairs", False)
    accessibility_flags["has_stairs"] = has_stairs
    if has_stairs:
        cannot = getattr(user_profile, "cannot_use_stairs", False)
        factor = 1.0 if cannot else 0.4
        p = W["stairs"] * factor
        penalty += p
        penalty_breakdown["stairs"] = p
        reasons_rejected.append("Stairs detected on route")
    else:
        reasons_accepted.append("No stairs on route")

    # ── 2. Slope ─────────────────────────────────────────────────────────────
    slope = getattr(route, "max_slope_percent", 0)
    accessibility_flags["max_slope_percent"] = slope
    requires_low_gradient = getattr(user_profile, "requires_low_gradient", False)
    if slope > 8:
        factor = 1.0 if requires_low_gradient else 0.5
        p = W["slope"] * factor
        penalty += p
        penalty_breakdown["slope"] = p
        reasons_rejected.append(f"Steep slope ({slope:.1f}%) — exceeds safe limit")
    elif slope > 5:
        p = W["slope"] * 0.3
        penalty += p
        penalty_breakdown["slope"] = p
        reasons_accepted.append(f"Moderate slope ({slope:.1f}%) — manageable")
    else:
        reasons_accepted.append(f"Acceptable slope ({slope:.1f}%)")

    # ── 3. Ramp ──────────────────────────────────────────────────────────────
    has_ramp = getattr(route, "has_ramp", False)
    requires_ramp = getattr(user_profile, "requires_ramp", False)
    accessibility_flags["has_ramp"] = has_ramp
    if requires_ramp and not has_ramp:
        p = W["ramp_missing"]
        penalty += p
        penalty_breakdown["ramp_missing"] = p
        reasons_rejected.append("Ramp required but not available on this route")
    elif has_ramp:
        reasons_accepted.append("Ramp available on route")

    # ── 4. Path width ────────────────────────────────────────────────────────
    width = getattr(route, "min_width_m", 2.0)
    requires_wide = getattr(user_profile, "requires_wide_pathway", False)
    accessibility_flags["min_width_m"] = width
    if requires_wide and width < 1.5:
        p = W["width"]
        penalty += p
        penalty_breakdown["width"] = p
        reasons_rejected.append(f"Path too narrow ({width:.1f} m) for mobility aid")
    elif width >= 1.5:
        reasons_accepted.append(f"Path width adequate ({width:.1f} m)")

    # ── 5. Surface condition ─────────────────────────────────────────────────
    surface = getattr(route, "surface_condition", "good")
    accessibility_flags["surface_condition"] = surface
    surf_factor = SURFACE_PENALTY.get(surface, 0)
    if surf_factor > 0:
        p = W["surface"] * surf_factor
        penalty += p
        penalty_breakdown["surface"] = p
        reasons_rejected.append(f"Surface condition: {surface}")
    else:
        reasons_accepted.append("Good surface condition")

    # ── 6. Hazards on route ───────────────────────────────────────────────────
    route_geojson = getattr(route, "geojson", None)
    for hazard in active_hazards:
        h_lat = getattr(hazard, "latitude", 0)
        h_lng = getattr(hazard, "longitude", 0)
        h_type = getattr(hazard, "hazard_type", "unknown")
        h_sev = getattr(hazard, "severity", "medium")
        h_conf = getattr(hazard, "confidence", 0.5)
        h_radius = getattr(hazard, "radius_m", 150)

        if not _point_near_route(h_lat, h_lng, route_geojson, h_radius):
            continue

        hazard_details.append({
            "id": getattr(hazard, "id", 0),
            "type": h_type,
            "severity": h_sev,
            "confidence": h_conf,
        })

        if h_type == "flood":
            fac = SEVERITY_FLOOD_PENALTY.get(h_sev, 0.6) * h_conf
            p = W["flood"] * fac
            penalty += p
            penalty_breakdown[f"flood_{getattr(hazard,'id',0)}"] = p
            reasons_rejected.append(f"Flood ({h_sev} severity, {int(h_conf*100)}% confidence) on route")

        elif h_type in ("blocked_road", "closure"):
            fac = SEVERITY_BLOCKED_PENALTY.get(h_sev, 0.8) * h_conf
            p = W["blocked"] * fac
            penalty += p
            penalty_breakdown[f"blocked_{getattr(hazard,'id',0)}"] = p
            reasons_rejected.append(f"Road blockage ({h_sev}) detected")

        elif h_type in ("damaged_road", "landslide"):
            fac = SEVERITY_DAMAGED_PENALTY.get(h_sev, 0.5) * h_conf
            p = W["damaged"] * fac
            penalty += p
            penalty_breakdown[f"damaged_{getattr(hazard,'id',0)}"] = p
            reasons_rejected.append(f"{h_type.replace('_', ' ').title()} ({h_sev}) on route")

    if not hazard_details:
        reasons_accepted.append("No active hazards on this route")

    # ── 7. Distance penalty ───────────────────────────────────────────────────
    distance = getattr(route, "total_distance_m", reference_distance_m)
    if distance > reference_distance_m * 2:
        ratio = min(distance / (reference_distance_m * 3), 1.0)
        p = W["distance"] * ratio * 0.5
        penalty += p
        penalty_breakdown["distance"] = p

    # ── Final score ───────────────────────────────────────────────────────────
    score = max(0.0, min(100.0, 100.0 - penalty))
    return {
        "score": round(score, 1),
        "reasons_accepted": reasons_accepted,
        "reasons_rejected": reasons_rejected,
        "hazard_details": hazard_details,
        "accessibility_flags": accessibility_flags,
        "penalty_breakdown": penalty_breakdown,
    }


def score_shelter(shelter: Any, user_profile: Any) -> float:
    """Return 0-100 accessibility score for a shelter given a user's profile."""
    score = 100.0
    mobility = getattr(user_profile, "mobility_type", "general")

    if mobility in ("wheelchair", "walker"):
        if not getattr(shelter, "wheelchair_accessible", False):
            score -= 40
        if not getattr(shelter, "has_ramp", False):
            score -= 20
        if not getattr(shelter, "has_accessible_entrance", False):
            score -= 20

    if mobility == "elderly":
        if not getattr(shelter, "has_ramp", False):
            score -= 15
        if not getattr(shelter, "has_medical_support", False):
            score -= 10

    # Capacity factor
    capacity = getattr(shelter, "capacity", 1)
    occupancy = getattr(shelter, "current_occupancy", 0)
    if capacity > 0:
        fill_pct = occupancy / capacity
        if fill_pct >= 1.0:
            score -= 50
        elif fill_pct > 0.9:
            score -= 25
        elif fill_pct > 0.7:
            score -= 10

    if getattr(shelter, "status", "open") != "open":
        score -= 80

    return max(0.0, min(100.0, score))
