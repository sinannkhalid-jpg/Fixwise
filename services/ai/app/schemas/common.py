"""
Common Enums and Shared Domain Types for AI & Civic Intelligence Platform.
"""

from enum import Enum


class IssueCategory(str, Enum):
    POTHOLE = "pothole"
    FLOODING = "flooding"
    GARBAGE_WASTE = "garbage_waste"
    BROKEN_STREETLIGHT = "broken_streetlight"
    WATER_LEAK = "water_leak"
    DRAINAGE_PROBLEM = "drainage_problem"
    DAMAGED_ROAD = "damaged_road"
    PUBLIC_INFRASTRUCTURE = "public_infrastructure"
    TRAFFIC_SIGNAGE = "traffic_signage"
    OTHER = "other"


class DepartmentType(str, Enum):
    ROADS = "roads"
    DRAINAGE = "drainage"
    WATER = "water"
    ELECTRICAL_TRAFFIC = "electrical_traffic"
    SANITATION = "sanitation"
    PUBLIC_WORKS = "public_works"
    GENERAL_MAINTENANCE = "general_maintenance"


class PriorityLevel(str, Enum):
    CRITICAL = "CRITICAL"  # 80 - 100
    HIGH = "HIGH"          # 60 - 79
    MEDIUM = "MEDIUM"      # 40 - 59
    LOW = "LOW"            # 0 - 39


class RiskLevel(str, Enum):
    LOW = "LOW"            # 0 - 39
    MEDIUM = "MEDIUM"      # 40 - 69
    HIGH = "HIGH"          # 70 - 84
    VERY_HIGH = "VERY_HIGH"# 85 - 100


class RiskAction(str, Enum):
    NORMAL_PROCESSING = "NORMAL_PROCESSING"
    ADDITIONAL_VERIFICATION = "ADDITIONAL_VERIFICATION"
    MANUAL_REVIEW = "MANUAL_REVIEW"
    HOLD_RESTRICT = "HOLD_RESTRICT"


class ZoneType(str, Enum):
    CRITICAL_FACILITY = "critical_facility" # Hospital, fire station, school zone (10 pts)
    ARTERIAL_HIGHWAY = "arterial_highway"   # Major roadway / transit corridor (7-8 pts)
    COMMERCIAL = "commercial"               # High footfall commercial area (5-6 pts)
    RESIDENTIAL = "residential"             # Standard neighborhood street (3-4 pts)
    REMOTE = "remote"                       # Low density / rural (1-2 pts)
