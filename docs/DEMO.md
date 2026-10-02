# Demo Instructions

## Prerequisites

Both backend and frontend must be running.

**Backend:**
```cmd
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```cmd
cd frontend
npm run dev
```

Open http://localhost:5173

---

## Quick Demo (Guided — Recommended)

1. Navigate to `/demo` or click **"Start Evacuation Demo"** on the home page
2. Click **"Start Evacuation Simulation"**
3. Progress through the 9 steps using the **"Next Step"** button

### What each step demonstrates:

| Step | Title | What Happens |
|------|-------|--------------|
| 1 | Select User Profile | Wheelchair user profile is created via API |
| 2 | View Starting Location | Map shows campus area with all routes |
| 3 | Calculate Feasibility | API scores all 3 routes for wheelchair user |
| 4 | Route A Rejected | Route A: stairs + slope + flood = ~22% feasibility |
| 5 | Route B Recommended | Route B: no stairs, ramp, no hazards = ~88% feasibility |
| 6 | Add New Flood to Route B | A flood hazard is posted to Route B via API |
| 7 | System Recalculates | Re-route API called — Route B's score drops |
| 8 | New Route Recommended | Route C or assisted evacuation message |
| 9 | Accessible Shelter Matched | Shelter with wheelchair access, ramp, medical support |

---

## Manual Demo Flow

### Test Person-Specific Routing

1. Go to `/profile` — Create a **Wheelchair User** profile
2. Go to `/analysis` — Click **Calculate**
3. Note: Route A is rejected (stairs, steep slope, flood)
4. Note: Route B is recommended (~88%)

Then:
1. Create a **General User** profile
2. Click **Calculate** again
3. Note: Route A now scores much higher (~70%+) for the general user

This demonstrates the core innovation: **same hazards, different recommendations**.

### Test Dynamic Re-Routing

1. Go to `/report`
2. Submit a **Flood, High severity** at coordinates 17.4978, 78.3882 (Route B area)
3. Go to `/analysis` — Click **Re-Route**
4. Route B's feasibility drops; a different route is recommended

### Test Authority Dashboard

1. Navigate to `/dashboard`
2. View live stats: active hazards, affected routes, shelter capacity
3. Map shows all routes, hazards, and shelters simultaneously

---

## Demo Area

The demo uses a simulated **campus area near JNTU Hyderabad** (lat 17.4950, lng 78.3891).

Three routes are pre-seeded:

| Route | Accessibility | Key Issues |
|-------|--------------|------------|
| Route A | ❌ Not accessible | Stairs, 12% slope, flood on path |
| Route B | ✅ Fully accessible | No stairs, ramp, 4% slope |
| Route C | ✅ Mostly accessible | No stairs, ramp, 6% slope |

Four shelters:
- Community Hall — fully wheelchair accessible, medical support
- Sports Complex — wheelchair accessible, large capacity
- Old Library — not wheelchair accessible
- Medical Centre — fully accessible, medical support
