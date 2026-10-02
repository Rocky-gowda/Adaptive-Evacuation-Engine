from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, default="Anonymous")
    mobility_type = Column(String, nullable=False)  # wheelchair, elderly, walker, temporary_injury, general
    cannot_use_stairs = Column(Boolean, default=False)
    requires_ramp = Column(Boolean, default=False)
    requires_low_gradient = Column(Boolean, default=False)
    requires_wide_pathway = Column(Boolean, default=False)
    requires_assistance = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    recommendations = relationship("EvacuationRecommendation", back_populates="user")


class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    start_lat = Column(Float, nullable=False)
    start_lng = Column(Float, nullable=False)
    end_lat = Column(Float, nullable=False)
    end_lng = Column(Float, nullable=False)
    total_distance_m = Column(Float, default=0)
    estimated_time_min = Column(Float, default=0)
    has_stairs = Column(Boolean, default=False)
    has_ramp = Column(Boolean, default=False)
    max_slope_percent = Column(Float, default=0)
    min_width_m = Column(Float, default=2.0)
    surface_condition = Column(String, default="good")  # good, fair, poor
    is_accessible = Column(Boolean, default=True)
    color = Column(String, default="blue")
    geojson = Column(JSON, nullable=True)
    segments = relationship("RouteSegment", back_populates="route")
    recommendations = relationship("EvacuationRecommendation", back_populates="recommended_route")


class RouteSegment(Base):
    __tablename__ = "route_segments"

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(Integer, ForeignKey("routes.id"))
    sequence = Column(Integer, default=0)
    start_lat = Column(Float)
    start_lng = Column(Float)
    end_lat = Column(Float)
    end_lng = Column(Float)
    distance_m = Column(Float, default=0)
    slope_percent = Column(Float, default=0)
    has_stairs = Column(Boolean, default=False)
    has_ramp = Column(Boolean, default=False)
    width_m = Column(Float, default=2.0)
    surface = Column(String, default="paved")
    is_accessible = Column(Boolean, default=True)
    route = relationship("Route", back_populates="segments")


class Hazard(Base):
    __tablename__ = "hazards"

    id = Column(Integer, primary_key=True, index=True)
    hazard_type = Column(String, nullable=False)  # flood, blocked_road, damaged_road, landslide, closed_road
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    severity = Column(String, default="medium")  # low, medium, high, critical
    description = Column(Text, nullable=True)
    confidence = Column(Float, default=0.5)  # 0-1
    status = Column(String, default="active")  # active, resolved, unverified
    reported_by = Column(String, default="citizen")  # citizen, responder, authority
    radius_m = Column(Float, default=100)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    reports = relationship("HazardReport", back_populates="hazard")


class HazardReport(Base):
    __tablename__ = "hazard_reports"

    id = Column(Integer, primary_key=True, index=True)
    hazard_id = Column(Integer, ForeignKey("hazards.id"), nullable=True)
    hazard_type = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    severity = Column(String, default="medium")
    description = Column(Text, nullable=True)
    reporter_type = Column(String, default="citizen")  # citizen, responder, authority
    image_url = Column(String, nullable=True)
    confidence_score = Column(Float, default=0.5)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    hazard = relationship("Hazard", back_populates="reports")


class Shelter(Base):
    __tablename__ = "shelters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    capacity = Column(Integer, default=100)
    current_occupancy = Column(Integer, default=0)
    wheelchair_accessible = Column(Boolean, default=False)
    has_ramp = Column(Boolean, default=False)
    has_accessible_entrance = Column(Boolean, default=False)
    has_elevator = Column(Boolean, default=False)
    has_medical_support = Column(Boolean, default=False)
    shelter_type = Column(String, default="community_center")
    status = Column(String, default="open")  # open, full, closed
    contact_number = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class EvacuationRecommendation(Base):
    __tablename__ = "evacuation_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=True)
    recommended_route_id = Column(Integer, ForeignKey("routes.id"), nullable=True)
    recommended_shelter_id = Column(Integer, ForeignKey("shelters.id"), nullable=True)
    feasibility_score = Column(Float, default=0)
    route_details = Column(JSON, nullable=True)
    reasoning = Column(JSON, nullable=True)
    status = Column(String, default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("UserProfile", back_populates="recommendations")
    recommended_route = relationship("Route", back_populates="recommendations")
