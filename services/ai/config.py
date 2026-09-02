"""
Configuration Module for AI & Civic Intelligence Service.
Handles environment variables, default model settings, and algorithm parameters.
"""

from typing import Dict
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Service Information
    APP_NAME: str = "Civic Intelligence & AI Service"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    DEBUG: bool = True

    # Google Gemini AI Settings
    GEMINI_API_KEY: str = ""
    GEMINI_MULTIMODAL_MODEL: str = "gemini-3.8-flash"
    GEMINI_EMBEDDING_MODEL: str = "gemini-embedding-001"
    AI_CONFIDENCE_THRESHOLD: float = 0.65

    # Fallback / Mock Behavior
    ENABLE_OFFLINE_MOCK_FALLBACK: bool = True

    # Duplicate Detection Parameters
    DUPLICATE_VECTOR_WEIGHT: float = 0.40
    DUPLICATE_GPS_WEIGHT: float = 0.35
    DUPLICATE_CATEGORY_WEIGHT: float = 0.15
    DUPLICATE_TIME_WEIGHT: float = 0.10

    DUPLICATE_DEFINITE_THRESHOLD: float = 0.75
    DUPLICATE_POTENTIAL_THRESHOLD: float = 0.50
    DUPLICATE_MAX_GPS_METERS: float = 150.0
    DUPLICATE_MAX_TIME_DAYS: int = 30

    # Priority Engine Scoring Max Limits
    PRIORITY_MAX_SEVERITY: float = 30.0
    PRIORITY_MAX_SAFETY_RISK: float = 20.0
    PRIORITY_MAX_REPORTS: float = 20.0
    PRIORITY_MAX_LOCATION: float = 10.0
    PRIORITY_MAX_AGE: float = 10.0
    PRIORITY_MAX_PUBLIC_IMPACT: float = 10.0

    # Fake / Risk Assessment Thresholds
    RISK_THRESHOLD_LOW: int = 39
    RISK_THRESHOLD_MEDIUM: int = 69
    RISK_THRESHOLD_HIGH: int = 84

    # PostGIS & Hotspot Detection
    HOTSPOT_DBSCAN_EPS_METERS: float = 250.0
    HOTSPOT_MIN_REPORTS: int = 4
    RECURRING_PROBLEM_MIN_OCCURRENCES: int = 3
    RECURRING_PROBLEM_WINDOW_DAYS: int = 180

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
