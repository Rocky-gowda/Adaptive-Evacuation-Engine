from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, SessionLocal
from . import models
from .routers import users, hazards, shelters, routes, evacuation, dashboard
from .services.seed_data import seed_demo_data

# Create all tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Adaptive Evacuation Feasibility Engine",
    description="Disaster management system for people with functional mobility constraints",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed demo data on startup
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()

# Register routers
app.include_router(users.router)
app.include_router(hazards.router)
app.include_router(shelters.router)
app.include_router(routes.router)
app.include_router(evacuation.router)
app.include_router(dashboard.router)


@app.get("/")
def root():
    return {
        "message": "Adaptive Evacuation Feasibility Engine API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
