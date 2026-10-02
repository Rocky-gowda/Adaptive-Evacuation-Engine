# Architecture

## System Overview

```
┌─────────────────┐         ┌──────────────────────────────────┐
│   React Frontend│◄────────►       FastAPI Backend             │
│   (Vite, port   │  REST   │  (Python, port 8000)             │
│    5173)        │  JSON   │                                   │
│                 │         │  ┌──────────────────────────┐    │
│  Pages:         │         │  │  Feasibility Engine       │    │
│  - Landing      │         │  │  (services/feasibility.py)│    │
│  - Profile      │         │  │                           │    │
│  - Map          │         │  │  Weighted scoring per     │    │
│  - Analysis     │         │  │  mobility profile:        │    │
│  - Shelters     │         │  │  - stairs penalty         │    │
│  - Report       │         │  │  - slope penalty          │    │
│  - Dashboard    │         │  │  - hazard penalty         │    │
│  - Demo         │         │  │  - ramp/width penalty     │    │
└─────────────────┘         │  └──────────────────────────┘    │
                            │                                   │
                            │  ┌──────────────────────────┐    │
                            │  │  SQLite Database          │    │
                            │  │  (SQLAlchemy ORM)         │    │
                            │  └──────────────────────────┘    │
                            └──────────────────────────────────┘
```

## Feasibility Scoring Algorithm

```
Score = 100 - Σ(penalty_i × weight_i × factor_i)

Where weight_i is profile-specific:

Profile     | Stairs | Slope | Flood | Distance
------------|--------|-------|-------|----------
Wheelchair  |  40    |  20   |  20   |   5
Elderly     |  25    |  25   |  20   |  15
Walker      |  20    |  15   |  22   |  12
Temp Injury |  15    |  12   |  22   |  15
General     |   5    |   5   |  25   |  20
```

## Data Classification

### Static Baseline Data
Seeded at startup from `seed_data.py`:
- Road/path geometry (GeoJSON LineStrings)
- Elevation/slope per route
- Stairs presence
- Ramp availability
- Shelter details

### Dynamic Data
Created via API at runtime:
- Flood reports
- Road blockages
- Landslides
- Road damage
- Closures

## Hazard Confidence Scoring

```
confidence = reporter_reliability_weight × recency_factor

Reporter weights:
  authority  → 0.95
  responder  → 0.80
  citizen    → 0.55
```

## Demo Area

Geographic centre: **JNTU Hyderabad campus area**
Lat/Lng: 17.4950, 78.3891

This ensures OpenStreetMap tiles load correctly for the demo.
