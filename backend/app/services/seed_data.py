"""
Seed the database with demo data representing a hospital campus area.
All geographic coordinates are around a real-world area (Hyderabad, India)
so Leaflet/OSM tiles render correctly.
"""
import json
from sqlalchemy.orm import Session
from ..models import Route, Shelter, Hazard, UserProfile


# Centre point: ~JNTU Hyderabad campus area
CX, CY = 78.3891, 17.4950   # lng, lat


def _make_linestring(coords):
    return {"type": "LineString", "coordinates": coords}


def seed_demo_data(db: Session):
    if db.query(Route).count() > 0:
        return  # already seeded

    # ── Routes ──────────────────────────────────────────────────────────────
    # Route A  — shorter, has stairs, steep slope, will get flooded
    route_a = Route(
        name="Route A — Main Gate Path",
        description="Shorter direct path through the main building complex. Contains stairs and steep sections.",
        start_lat=17.4950, start_lng=78.3891,
        end_lat=17.4975, end_lng=78.3940,
        total_distance_m=1200,
        estimated_time_min=15,
        has_stairs=True,
        has_ramp=False,
        max_slope_percent=12.0,
        min_width_m=1.2,
        surface_condition="fair",
        is_accessible=False,
        color="#ef4444",
        geojson=_make_linestring([
            [78.3891, 17.4950],
            [78.3900, 17.4955],
            [78.3910, 17.4958],
            [78.3920, 17.4963],
            [78.3930, 17.4968],
            [78.3940, 17.4975],
        ]),
    )

    # Route B  — longer, fully accessible, low gradient
    route_b = Route(
        name="Route B — Accessible Campus Ring Road",
        description="Longer route via accessible ring road. No stairs, ramps available, gentle slope throughout.",
        start_lat=17.4950, start_lng=78.3891,
        end_lat=17.4975, end_lng=78.3940,
        total_distance_m=1800,
        estimated_time_min=22,
        has_stairs=False,
        has_ramp=True,
        max_slope_percent=4.0,
        min_width_m=2.5,
        surface_condition="good",
        is_accessible=True,
        color="#22c55e",
        geojson=_make_linestring([
            [78.3891, 17.4950],
            [78.3885, 17.4958],
            [78.3882, 17.4965],
            [78.3888, 17.4972],
            [78.3900, 17.4978],
            [78.3915, 17.4980],
            [78.3928, 17.4978],
            [78.3940, 17.4975],
        ]),
    )

    # Route C  — alternative, moderate accessibility
    route_c = Route(
        name="Route C — South Perimeter Road",
        description="Alternative route via south perimeter. No stairs, moderate slope.",
        start_lat=17.4950, start_lng=78.3891,
        end_lat=17.4975, end_lng=78.3940,
        total_distance_m=2100,
        estimated_time_min=26,
        has_stairs=False,
        has_ramp=True,
        max_slope_percent=6.0,
        min_width_m=2.0,
        surface_condition="good",
        is_accessible=True,
        color="#3b82f6",
        geojson=_make_linestring([
            [78.3891, 17.4950],
            [78.3888, 17.4942],
            [78.3895, 17.4935],
            [78.3910, 17.4932],
            [78.3925, 17.4935],
            [78.3938, 17.4942],
            [78.3940, 17.4975],
        ]),
    )

    db.add_all([route_a, route_b, route_c])

    # ── Shelters ─────────────────────────────────────────────────────────────
    shelters = [
        Shelter(
            name="Campus Community Hall (Shelter 1)",
            latitude=17.4975, longitude=78.3940,
            capacity=300, current_occupancy=80,
            wheelchair_accessible=True, has_ramp=True,
            has_accessible_entrance=True, has_elevator=True,
            has_medical_support=True,
            shelter_type="community_center", status="open",
            contact_number="040-2345-6789",
        ),
        Shelter(
            name="Sports Complex Shelter (Shelter 2)",
            latitude=17.4985, longitude=78.3920,
            capacity=500, current_occupancy=120,
            wheelchair_accessible=True, has_ramp=True,
            has_accessible_entrance=True, has_elevator=False,
            has_medical_support=False,
            shelter_type="sports_complex", status="open",
            contact_number="040-2345-6780",
        ),
        Shelter(
            name="Old Library Building (Shelter 3)",
            latitude=17.4960, longitude=78.3960,
            capacity=150, current_occupancy=130,
            wheelchair_accessible=False, has_ramp=False,
            has_accessible_entrance=False, has_elevator=False,
            has_medical_support=False,
            shelter_type="building", status="open",
            contact_number="040-2345-6790",
        ),
        Shelter(
            name="Medical Centre (Shelter 4)",
            latitude=17.4942, longitude=78.3910,
            capacity=100, current_occupancy=20,
            wheelchair_accessible=True, has_ramp=True,
            has_accessible_entrance=True, has_elevator=True,
            has_medical_support=True,
            shelter_type="medical", status="open",
            contact_number="040-2345-6800",
        ),
    ]
    db.add_all(shelters)

    # ── Hazards ───────────────────────────────────────────────────────────────
    hazards = [
        Hazard(
            hazard_type="flood",
            latitude=17.4963, longitude=78.3920,
            severity="high",
            description="Flash flooding on main path near building complex",
            confidence=0.91,
            status="active",
            reported_by="authority",
            radius_m=120,
        ),
        Hazard(
            hazard_type="blocked_road",
            latitude=17.4958, longitude=78.3910,
            severity="medium",
            description="Debris blockage near east gate",
            confidence=0.75,
            status="active",
            reported_by="responder",
            radius_m=80,
        ),
    ]
    db.add_all(hazards)

    db.commit()
