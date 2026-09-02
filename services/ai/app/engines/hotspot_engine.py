"""
Hotspot Spatial Clustering Engine.
Uses DBSCAN geographic distance clustering and spatial density algorithms
to detect localized civic complaint hotspots for Main Admin and Municipality dashboards.
"""

from datetime import datetime, timezone
import math
import numpy as np
from typing import List, Dict, Any, Optional
from config import settings
from app.schemas.civic_intelligence import (
    IncidentPoint,
    HotspotCluster,
    HotspotsQuery,
    HotspotsResponse
)
from app.schemas.analysis import GPSCoordinates
from app.schemas.common import IssueCategory
from app.engines.duplicate_engine import haversine_distance_meters


class HotspotEngine:
    def __init__(self):
        self.default_eps_meters = settings.HOTSPOT_DBSCAN_EPS_METERS  # 250m
        self.default_min_samples = settings.HOTSPOT_MIN_REPORTS       # 4 reports

    def detect_hotspots(
        self,
        incidents: List[IncidentPoint],
        municipality_id: Optional[str] = None,
        category: Optional[IssueCategory] = None,
        eps_meters: Optional[float] = None,
        min_incidents: Optional[int] = None
    ) -> HotspotsResponse:
        """
        Clusters coordinate points into geographic hotspots using spatial radius aggregation.
        """
        eps = eps_meters or self.default_eps_meters
        min_pts = min_incidents or self.default_min_samples

        # 1. Filter points if specified
        filtered = incidents
        if municipality_id:
            filtered = [p for p in filtered if not p.municipality_id or p.municipality_id == municipality_id]
        if category:
            filtered = [p for p in filtered if p.category == category]

        if len(filtered) < min_pts:
            return HotspotsResponse(
                total_hotspots=0,
                hotspots=[],
                generated_at=datetime.now(timezone.utc).isoformat()
            )

        # 2. Group by Category first for category-specific hotspots
        category_groups: Dict[IssueCategory, List[IncidentPoint]] = {}
        for p in filtered:
            category_groups.setdefault(p.category, []).append(p)

        detected_clusters: List[HotspotCluster] = []
        cluster_counter = 1

        for cat, cat_points in category_groups.items():
            if len(cat_points) < min_pts:
                continue

            # Custom Spatial Radius Clustering
            visited = set()
            
            for i, p in enumerate(cat_points):
                if p.incident_id in visited:
                    continue

                # Find all neighbors within eps distance
                cluster_members = [p]
                for j, other in enumerate(cat_points):
                    if i != j:
                        dist = haversine_distance_meters(
                            p.location.latitude, p.location.longitude,
                            other.location.latitude, other.location.longitude
                        )
                        if dist <= eps:
                            cluster_members.append(other)

                if len(cluster_members) >= min_pts:
                    # Mark all as visited
                    for m in cluster_members:
                        visited.add(m.incident_id)

                    # Compute Centroid
                    mean_lat = sum(m.location.latitude for m in cluster_members) / len(cluster_members)
                    mean_lng = sum(m.location.longitude for m in cluster_members) / len(cluster_members)
                    
                    # Compute Max Radius from Centroid
                    max_radius = max(
                        haversine_distance_meters(mean_lat, mean_lng, m.location.latitude, m.location.longitude)
                        for m in cluster_members
                    )
                    max_radius = max(50.0, max_radius)

                    # Compute Severity & Critical counts
                    avg_sev = sum(m.severity for m in cluster_members) / len(cluster_members)
                    crit_count = sum(1 for m in cluster_members if m.severity >= 0.75)

                    cluster_id = f"hotspot_{cat.value}_{cluster_counter}"
                    cluster_counter += 1

                    label = (
                        f"{cat.value.replace('_', ' ').title()} Hotspot: "
                        f"{len(cluster_members)} reports within {int(max_radius)}m radius"
                    )

                    detected_clusters.append(
                        HotspotCluster(
                            cluster_id=cluster_id,
                            category=cat,
                            center_location=GPSCoordinates(
                                latitude=round(mean_lat, 6),
                                longitude=round(mean_lng, 6)
                            ),
                            radius_meters=round(max_radius, 1),
                            incident_count=len(cluster_members),
                            average_severity=round(avg_sev, 2),
                            critical_incident_count=crit_count,
                            municipality_id=municipality_id or cluster_members[0].municipality_id,
                            incident_ids=[m.incident_id for m in cluster_members],
                            label=label
                        )
                    )

        # Sort hotspots by incident count * average severity descending
        detected_clusters.sort(key=lambda h: h.incident_count * h.average_severity, reverse=True)

        return HotspotsResponse(
            total_hotspots=len(detected_clusters),
            hotspots=detected_clusters,
            generated_at=datetime.now(timezone.utc).isoformat()
        )


hotspot_engine = HotspotEngine()
