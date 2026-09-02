# Supabase pgvector & PostGIS Integration Guide
**For:** Member 1 — Backend, Supabase & Core Platform  
**From:** Member 3 — AI & Intelligence Lead

This guide provides the complete SQL migrations, vector index configurations, and PostGIS spatial queries required to support **Member 3's AI duplicate detection**, **spatial hotspot clustering**, and **vector similarity search**.

---

## 1. Enable Supabase Extensions

Run in the Supabase SQL Editor:

```sql
-- Enable pgvector for 768-dimensional AI semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable PostGIS for geographic coordinates, boundary mapping & radius queries
CREATE EXTENSION IF NOT EXISTS postgis;
```

---

## 2. Table Schemas with Vector & Geography Columns

```sql
-- 1. Incidents Table (Authoritative Parent Cases)
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    municipality_id UUID NOT NULL,
    department_id UUID,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'REPORTED',
    priority_level VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    priority_score NUMERIC(5,2) DEFAULT 50.00,
    severity NUMERIC(3,2) DEFAULT 0.50,
    safety_risk NUMERIC(3,2) DEFAULT 0.50,
    report_count INTEGER NOT NULL DEFAULT 1,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    address_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sla_due_at TIMESTAMPTZ,
    assigned_worker_id UUID
);

-- 2. Incident Reports Table (Linked Citizen Submissions)
CREATE TABLE IF NOT EXISTS public.incident_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE,
    citizen_id UUID NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    video_url TEXT,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    risk_score INTEGER DEFAULT 0,
    risk_level VARCHAR(20) DEFAULT 'LOW',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Incident Embeddings Table (pgvector 768-dim)
CREATE TABLE IF NOT EXISTS public.incident_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES public.incidents(id) ON DELETE CASCADE UNIQUE,
    embedding VECTOR(768) NOT NULL,
    model_version VARCHAR(50) DEFAULT 'text-embedding-004',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 3. High-Performance Spatial & Vector Indexes

```sql
-- HNSW Index for fast approximate cosine similarity search
CREATE INDEX IF NOT EXISTS idx_incident_embeddings_cosine
ON public.incident_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- PostGIS GIST index for fast geographic radius and bounding-box queries
CREATE INDEX IF NOT EXISTS idx_incidents_location_gist
ON public.incidents
USING gist (location);

CREATE INDEX IF NOT EXISTS idx_incident_reports_location_gist
ON public.incident_reports
USING gist (location);
```

---

## 4. Stored PostgreSQL Functions for Member 1 Backend

### Function A: Vector Similarity Search
```sql
CREATE OR REPLACE FUNCTION match_incident_embeddings (
    query_embedding VECTOR(768),
    match_threshold FLOAT,
    match_count INT
)
RETURNS TABLE (
    incident_id UUID,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ie.incident_id,
        1 - (ie.embedding <=> query_embedding) AS similarity
    FROM public.incident_embeddings ie
    WHERE 1 - (ie.embedding <=> query_embedding) > match_threshold
    ORDER BY ie.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;
```

### Function B: Geographic Proximity Search (PostGIS)
```sql
CREATE OR REPLACE FUNCTION find_incidents_within_radius (
    query_lat FLOAT,
    query_lng FLOAT,
    radius_meters FLOAT,
    target_category VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    incident_id UUID,
    category VARCHAR,
    distance_meters FLOAT,
    status VARCHAR,
    report_count INT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.id AS incident_id,
        i.category,
        ST_Distance(i.location, ST_SetSRID(ST_MakePoint(query_lng, query_lat), 4326)::geography) AS distance_meters,
        i.status,
        i.report_count
    FROM public.incidents i
    WHERE 
        ST_DWithin(i.location, ST_SetSRID(ST_MakePoint(query_lng, query_lat), 4326)::geography, radius_meters)
        AND (target_category IS NULL OR i.category = target_category)
        AND i.status NOT IN ('CLOSED', 'REJECTED')
    ORDER BY distance_meters ASC;
END;
$$;
```
