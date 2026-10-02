# API Reference

Base URL: `http://localhost:8000`

Interactive docs: `http://localhost:8000/docs`

---

## Users

### POST /users/profile
Create a mobility profile.

**Body:**
```json
{
  "name": "Priya Sharma",
  "mobility_type": "wheelchair",
  "cannot_use_stairs": true,
  "requires_ramp": true,
  "requires_low_gradient": true,
  "requires_wide_pathway": true,
  "requires_assistance": false
}
```

Mobility types: `wheelchair` | `elderly` | `walker` | `temporary_injury` | `general`

**Response:** UserProfile with `id`

---

### GET /users/profile/{id}
Get a profile by ID.

---

## Hazards

### GET /hazards
List all active hazards.

### POST /hazards
Create a hazard directly (authority use).

**Body:**
```json
{
  "hazard_type": "flood",
  "latitude": 17.4963,
  "longitude": 78.3920,
  "severity": "high",
  "confidence": 0.91,
  "status": "active",
  "radius_m": 120
}
```

Hazard types: `flood` | `blocked_road` | `damaged_road` | `landslide` | `closed_road`

Severity: `low` | `medium` | `high` | `critical`

### PATCH /hazards/{id}/resolve
Mark a hazard resolved.

### DELETE /hazards/{id}
Delete a hazard.

### POST /hazards/report
Submit a crowd-sourced hazard report.

**Body:**
```json
{
  "hazard_type": "flood",
  "latitude": 17.4963,
  "longitude": 78.3920,
  "severity": "medium",
  "description": "Water 30cm deep on main path",
  "reporter_type": "citizen"
}
```

Reporter types: `citizen` | `responder` | `authority`

The confidence score is automatically calculated based on reporter type.

---

## Shelters

### GET /shelters
List all shelters.

---

## Routes

### GET /routes
List all evacuation routes.

---

## Evacuation

### POST /evacuation/calculate ⭐ Core Endpoint

Calculate feasibility-scored routes for a specific user profile.

**Body:**
```json
{
  "user_profile": {
    "mobility_type": "wheelchair",
    "cannot_use_stairs": true,
    "requires_ramp": true,
    "requires_low_gradient": true,
    "requires_wide_pathway": true,
    "requires_assistance": false
  },
  "current_lat": 17.4950,
  "current_lng": 78.3891
}
```

**Response:**
```json
{
  "recommended_route": {
    "route_id": 2,
    "route_name": "Route B — Accessible Campus Ring Road",
    "distance_m": 1800,
    "estimated_time_min": 22,
    "feasibility_score": 88.0,
    "is_recommended": true,
    "reasons_accepted": ["No stairs on route", "Ramp available", "Acceptable slope (4.0%)"],
    "reasons_rejected": [],
    "hazard_details": []
  },
  "all_routes": [...],
  "recommended_shelter": {
    "name": "Campus Community Hall (Shelter 1)",
    "wheelchair_accessible": true,
    "accessibility_score": 100.0
  },
  "summary": "Route 'Route B...' is recommended with a feasibility score of 88.0%...",
  "profile_summary": "Mobility: Wheelchair | Requirements: Cannot use stairs; Requires ramp; ..."
}
```

### POST /evacuation/recalculate
Same as calculate but marks `rerouted: true` and includes `reroute_reason` when the recommended route has changed.

---

## Dashboard

### GET /dashboard/statistics

Returns:
```json
{
  "active_hazards": 2,
  "affected_routes": 1,
  "available_shelters": 4,
  "total_shelters": 4,
  "people_requiring_assistance": 0,
  "shelter_capacity_used_pct": 28.5,
  "recent_hazards": [...],
  "route_feasibility_summary": [...]
}
```
