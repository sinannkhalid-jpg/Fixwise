-- =====================================================================
-- FIXWISE DATABASE MIGRATION 001: INITIAL SCHEMA & EXTENSIONS
-- Project: AI-Powered Citizen Complaint Management & Civic Intelligence Platform
-- Author: Member 1 (Backend & Supabase Core Architect)
-- =====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. CUSTOM ENUMS
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('SUPER_ADMIN', 'MUNICIPALITY_ADMIN', 'DEPARTMENT_ADMIN', 'FIELD_WORKER', 'CITIZEN');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.case_status AS ENUM ('REPORTED', 'ANALYZING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'VERIFICATION', 'CLOSED', 'REJECTED', 'REOPENED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.severity_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.priority_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.risk_level AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. MUNICIPALITIES TABLE
CREATE TABLE IF NOT EXISTS public.municipalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state TEXT,
  country TEXT DEFAULT 'India',
  boundary GEOMETRY(Polygon, 4326),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality_id UUID NOT NULL REFERENCES public.municipalities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL, -- e.g., 'Roads', 'Water', 'Sanitation', 'Electrical', 'Drainage'
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. USER PROFILES TABLE (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'CITIZEN',
  municipality_id UUID REFERENCES public.municipalities(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. FIELD WORKERS TABLE (No separate UI; managed via Municipality Dashboard)
CREATE TABLE IF NOT EXISTS public.workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  municipality_id UUID NOT NULL REFERENCES public.municipalities(id) ON DELETE CASCADE,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  active_cases_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. INCIDENTS (CASES) TABLE
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- e.g. Pothole, Flooding, Garbage, Streetlight, Water Leak
  status public.case_status NOT NULL DEFAULT 'REPORTED',
  severity public.severity_level NOT NULL DEFAULT 'MEDIUM',
  priority public.priority_level NOT NULL DEFAULT 'MEDIUM',
  
  -- Spatial Location (PostGIS Point)
  location GEOMETRY(Point, 4326),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  address_text TEXT,
  
  -- Organizational Routing
  municipality_id UUID REFERENCES public.municipalities(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  
  -- Grouping & Duplicates
  parent_case_id UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
  linked_reports_count INTEGER NOT NULL DEFAULT 1,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. INCIDENT REPORTS TABLE (Individual Citizen Submissions)
CREATE TABLE IF NOT EXISTS public.incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  citizen_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  image_urls TEXT[],
  video_url TEXT,
  location GEOMETRY(Point, 4326),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'ASSIGNED' CHECK (status IN ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'REASSIGNED')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 10. EVIDENCE TABLE
CREATE TABLE IF NOT EXISTS public.evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  before_image_url TEXT,
  after_image_url TEXT NOT NULL,
  notes TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. VERIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  verified_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_approved BOOLEAN NOT NULL,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. STATUS HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  previous_status public.case_status,
  new_status public.case_status NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. SLA RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.sla_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE UNIQUE,
  priority public.priority_level NOT NULL,
  sla_hours INTEGER NOT NULL, -- CRITICAL: 4h, HIGH: 24h, MEDIUM: 72h, LOW: 168h
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  is_breached BOOLEAN NOT NULL DEFAULT FALSE
);

-- 14. PRIORITY SCORES TABLE (Deterministic 0-100 score)
CREATE TABLE IF NOT EXISTS public.priority_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE UNIQUE,
  total_score INTEGER NOT NULL CHECK (total_score BETWEEN 0 AND 100),
  severity_score INTEGER NOT NULL DEFAULT 0,
  safety_risk_score INTEGER NOT NULL DEFAULT 0,
  reports_count_score INTEGER NOT NULL DEFAULT 0,
  location_importance_score INTEGER NOT NULL DEFAULT 0,
  complaint_age_score INTEGER NOT NULL DEFAULT 0,
  public_impact_score INTEGER NOT NULL DEFAULT 0,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. AI ANALYSIS RESULTS TABLE
CREATE TABLE IF NOT EXISTS public.ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE UNIQUE,
  suggested_category TEXT,
  severity_rating public.severity_level,
  safety_risk_score NUMERIC(4,2), -- 0.00 to 1.00
  confidence_score NUMERIC(4,2),   -- 0.00 to 1.00
  recommended_department_id UUID REFERENCES public.departments(id),
  ai_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. SPAM / RISK ASSESSMENTS TABLE
CREATE TABLE IF NOT EXISTS public.risk_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE UNIQUE,
  risk_score INTEGER NOT NULL CHECK (risk_score BETWEEN 0 AND 100),
  risk_level public.risk_level NOT NULL DEFAULT 'LOW',
  recommended_action TEXT NOT NULL DEFAULT 'NORMAL_PROCESSING', -- NORMAL_PROCESSING, MANUAL_REVIEW, HOLD
  reasons TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. INCIDENT EMBEDDINGS TABLE (pgvector for Member 3 duplicate matching)
CREATE TABLE IF NOT EXISTS public.incident_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE UNIQUE,
  embedding vector(768), -- Gemini text-embedding vector
  content_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. RECURRING PROBLEMS TABLE
CREATE TABLE IF NOT EXISTS public.recurring_problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality_id UUID NOT NULL REFERENCES public.municipalities(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  hotspot_location GEOMETRY(Point, 4326),
  incident_count INTEGER NOT NULL DEFAULT 0,
  first_reported_at TIMESTAMPTZ,
  last_reported_at TIMESTAMPTZ,
  description TEXT,
  root_cause_analysis TEXT,
  ai_recommendation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES FOR HIGH PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_incidents_municipality ON public.incidents(municipality_id);
CREATE INDEX IF NOT EXISTS idx_incidents_department ON public.incidents(department_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_location ON public.incidents USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON public.incident_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
