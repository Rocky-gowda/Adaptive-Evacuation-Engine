# Adaptive Evacuation Feasibility Engine

> **Smart India Hackathon — Disaster Management**
> Adaptive Evacuation Feasibility Engine for People with Functional Mobility Constraints

---

## Overview

An intelligent disaster evacuation decision-support system that determines whether a disaster-affected route is **physically feasible for a specific person** with functional mobility constraints, and dynamically recommends the safest accessible route and emergency shelter as conditions change.

**Core Innovation:** The same disaster situation produces *different* recommended routes for different users depending on their mobility profile. A wheelchair user and a general user standing at the same location will receive different recommendations.

---

## Features

| Feature | Description |
|---|---|
| Person-Specific Feasibility Scoring | Each route is scored 0–100 based on the user's specific mobility constraints |
| Dynamic Hazard Layer | Floods, road blockages, landslides reported in real-time |
| Auto Re-Routing | System recalculates and changes recommendation when new hazards appear |
| Explainable Decisions | Every recommendation shows exactly why a route was selected or rejected |
| Accessible Shelter Matching | Shelters ranked by accessibility match — not just proximity |
| Authority Dashboard | Live operations map with all routes, hazards, shelters, and statistics |
| Demo Mode | Guided 9-step evacuation simulation with wheelchair user scenario |

---

## Technology Stack

**Frontend:**
- React 18 + Vite
- Tailwind CSS
- Leaflet / React-Leaflet (OpenStreetMap)
- React Router DOM
- Lucide React icons

**Backend:**
- Python 3.10+ (tested on 3.14)
- FastAPI
- SQLite (development database)
- SQLAlchemy ORM
- NetworkX (graph/routing)

---

## Project Structure

```
adaptive_dis/
├── backend/
│   ├── requirements.txt
│   └── app/
│       ├── main.py              # FastAPI app + startup seed
│       ├── database.py          # SQLAlchemy engine
│       ├── models.py            # DB models
│       ├── schemas.py           # Pydantic schemas
│       ├── routers/
│       │   ├── users.py
│       │   ├── hazards.py
│       │   ├── shelters.py
│       │   ├── routes.py
│       │   ├── evacuation.py    # Core feasibility engine calls
│       │   └── dashboard.py
│       └── services/
│           ├── feasibility.py   # Weighted scoring algorithm
│           └── seed_data.py     # Demo data (campus scenario)
└── frontend/
    └── src/
        ├── App.jsx
        ├── api.js               # API client
        ├── context/AppContext.jsx
        ├── components/
        │   ├── Navbar.jsx
        │   ├── EvacMap.jsx      # Leaflet map component
        │   └── UI.jsx           # Shared UI components
        └── pages/
            ├── LandingPage.jsx
            ├── ProfilePage.jsx
            ├── MapPage.jsx
            ├── AnalysisPage.jsx
            ├── SheltersPage.jsx
            ├── ReportPage.jsx
            ├── DashboardPage.jsx
            └── DemoPage.jsx
```

---

## Database Design

| Table | Purpose |
|---|---|
| `user_profiles` | Mobility type and accessibility requirements |
| `routes` | Evacuation routes with accessibility attributes |
| `route_segments` | Individual segments of each route |
| `hazards` | Active disaster hazards on the map |
| `hazard_reports` | Crowd-sourced hazard reports with confidence scoring |
| `shelters` | Emergency shelters with accessibility features |
| `evacuation_recommendations` | Logged route recommendations |

---

## Setup & Run

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher

### Backend

```cmd
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### Frontend

```cmd
cd frontend
npm install
npm run dev
```

App available at: http://localhost:5173

---

## Demo Instructions

1. Open http://localhost:5173
2. Click **"Start Evacuation Demo"** on the home page OR navigate to **/demo**
3. Click **"Start Evacuation Simulation"**
4. Follow the 9 guided steps:
   - Step 1: Wheelchair user profile is created
   - Steps 2–5: System calculates routes, rejects Route A (stairs, slope, flood), recommends Route B
   - Step 6: A new flood is added to Route B
   - Steps 7–8: System recalculates, changes recommendation
   - Step 9: Accessible shelter is matched

---

## API Summary

See [docs/API.md](docs/API.md) for full API documentation.

Key endpoint:

```
POST /evacuation/calculate
{
  "user_profile": { "mobility_type": "wheelchair", ... },
  "current_lat": 17.4950,
  "current_lng": 78.3891
}
```

Returns feasibility-scored routes, recommended route, rejected routes with reasons, and matched shelter.
