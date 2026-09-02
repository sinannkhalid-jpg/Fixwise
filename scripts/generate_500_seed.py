import random
import uuid
import json
from datetime import datetime, timedelta

def generate_seed_sql():
    sql_lines = []

    sql_lines.append("""-- =====================================================================
-- FIXWISE COMPLETE SCHEMA & 500+ DATASET SEED SCRIPT
-- Project: AI-Powered Citizen Complaint Management & Civic Intelligence Platform
-- Target Project: Supabase (etmekklrpduyurgpenqp)
-- =====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. ENUMS
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

-- 3. TABLES
CREATE TABLE IF NOT EXISTS public.municipalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state TEXT,
  country TEXT DEFAULT 'India',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  municipality_id UUID NOT NULL REFERENCES public.municipalities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  contact_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.user_role NOT NULL DEFAULT 'CITIZEN',
  municipality_id UUID REFERENCES public.municipalities(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  municipality_id UUID NOT NULL REFERENCES public.municipalities(id) ON DELETE CASCADE,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  active_cases_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  status public.case_status NOT NULL DEFAULT 'REPORTED',
  severity public.severity_level NOT NULL DEFAULT 'MEDIUM',
  priority public.priority_level NOT NULL DEFAULT 'MEDIUM',
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  address_text TEXT,
  municipality_id UUID REFERENCES public.municipalities(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  parent_case_id UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
  linked_reports_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  citizen_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  image_urls TEXT[],
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  worker_id UUID NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'ASSIGNED',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  before_image_url TEXT,
  after_image_url TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sla_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE UNIQUE,
  priority public.priority_level NOT NULL,
  sla_hours INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_at TIMESTAMPTZ NOT NULL,
  is_breached BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.priority_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE UNIQUE,
  total_score INTEGER NOT NULL,
  severity_score INTEGER NOT NULL,
  safety_risk_score INTEGER NOT NULL,
  reports_count_score INTEGER NOT NULL,
  location_importance_score INTEGER NOT NULL,
  complaint_age_score INTEGER NOT NULL,
  public_impact_score INTEGER NOT NULL,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE UNIQUE,
  suggested_category TEXT,
  severity_rating public.severity_level,
  safety_risk_score NUMERIC(4,2),
  confidence_score NUMERIC(4,2),
  ai_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DISABLE RLS TEMPORARILY FOR SEEDING
ALTER TABLE public.incidents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.municipalities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.priority_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analysis DISABLE ROW LEVEL SECURITY;

TRUNCATE TABLE public.evidence, public.assignments, public.sla_records, public.priority_scores, public.ai_analysis, public.incident_reports, public.incidents, public.workers, public.departments, public.profiles, public.municipalities CASCADE;
""")

    muni_data = [
        ("Mumbai Metropolitan Region", "Maharashtra", 19.0760, 72.8777),
        ("Bengaluru Mahanagara Corporation", "Karnataka", 12.9716, 77.5946),
        ("Delhi Municipal Council", "Delhi", 28.6139, 77.2090),
        ("Chennai Unified Corporation", "Tamil Nadu", 13.0827, 80.2707),
        ("Hyderabad Metropolitan Development Authority", "Telangana", 17.3850, 78.4867)
    ]

    muni_ids = []
    sql_lines.append("\n-- SEED MUNICIPALITIES")
    for name, state, lat, lng in muni_data:
        m_id = str(uuid.uuid4())
        muni_ids.append((m_id, name, lat, lng))
        sql_lines.append(f"INSERT INTO public.municipalities (id, name, state, country) VALUES ('{m_id}', '{name}', '{state}', 'India');")

    dept_categories = [
        ("Roads & Infrastructure", "Pothole"),
        ("Water Supply & Sewerage", "Water Leak"),
        ("Sanitation & Waste Management", "Garbage"),
        ("Electrical & Lighting", "Streetlight"),
        ("Drainage & Stormwater", "Flooding")
    ]

    dept_ids = []
    sql_lines.append("\n-- SEED DEPARTMENTS")
    for m_id, m_name, m_lat, m_lng in muni_ids:
        for dept_name, dept_cat in dept_categories:
            d_id = str(uuid.uuid4())
            dept_ids.append((d_id, m_id, dept_name, dept_cat))
            email = f"{dept_name.lower().replace(' ', '.')}@city.gov.in"
            sql_lines.append(f"INSERT INTO public.departments (id, municipality_id, name, category, contact_email) VALUES ('{d_id}', '{m_id}', '{dept_name}', '{dept_cat}', '{email}');")

    sql_lines.append("\n-- SEED PROFILES & FIELD WORKERS")
    worker_ids = []
    for m_id, m_name, m_lat, m_lng in muni_ids:
        muni_depts = [d for d in dept_ids if d[1] == m_id]
        for i in range(10):
            p_id = str(uuid.uuid4())
            w_id = str(uuid.uuid4())
            dept = muni_depts[i % len(muni_depts)]
            name = f"Worker {i+1} ({m_name.split()[0]})"
            phone = f"+91 98765{random.randint(10000, 99999)}"
            sql_lines.append(f"INSERT INTO public.profiles (id, role, municipality_id, department_id, full_name, phone) VALUES ('{p_id}', 'FIELD_WORKER', '{m_id}', '{dept[0]}', '{name}', '{phone}');")
            sql_lines.append(f"INSERT INTO public.workers (id, profile_id, department_id, municipality_id, phone, is_active) VALUES ('{w_id}', '{p_id}', '{dept[0]}', '{m_id}', '{phone}', true);")
            worker_ids.append((w_id, m_id, dept[0]))

    categories = [
        ("Pothole", "Large crater on main road causing severe traffic hazard and vehicle damage.", "Roads & Infrastructure"),
        ("Flooding", "Water logging on low-lying street after heavy rain, blocking pedestrian path.", "Drainage & Stormwater"),
        ("Garbage", "Uncollected solid waste accumulating near residential area for over 3 days.", "Sanitation & Waste Management"),
        ("Broken Streetlight", "Streetlight fixture dark for 4 consecutive nights near crossroad.", "Electrical & Lighting"),
        ("Water Leak", "Underground pipe burst creating water pool and wasting clean water.", "Water Supply & Sewerage"),
        ("Drainage Defect", "Blocked stormwater drain overflowing onto public sidewalk.", "Drainage & Stormwater"),
        ("Damaged Road", "Crumbling asphalt road surface near school zone.", "Roads & Infrastructure"),
        ("Traffic Signage", "Damaged stop sign at busy intersection.", "Roads & Infrastructure")
    ]

    statuses = ['REPORTED', 'ANALYZING', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'VERIFICATION', 'CLOSED']
    severities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

    sql_lines.append("\n-- SEED 520 INCIDENTS & REPORTS")
    now = datetime.utcnow()

    for idx in range(1, 521):
        inc_id = str(uuid.uuid4())
        cat_name, base_desc, dept_cat = random.choice(categories)
        m_id, m_name, m_lat, m_lng = random.choice(muni_ids)
        muni_depts = [d for d in dept_ids if d[1] == m_id and d[2] == dept_cat]
        dept_id = muni_depts[0][0] if muni_depts else dept_ids[0][0]

        severity = random.choice(severities)
        status = random.choice(statuses)

        lat = round(m_lat + random.uniform(-0.08, 0.08), 6)
        lng = round(m_lng + random.uniform(-0.08, 0.08), 6)
        clean_city = m_name.split()[0]
        title = f"{cat_name} reported in {clean_city} Sector {random.randint(1, 40)}"
        desc = f"{base_desc} (Ref #{idx})"

        severity_score = 30 if severity == 'CRITICAL' else (24 if severity == 'HIGH' else (15 if severity == 'MEDIUM' else 8))
        safety_risk_score = random.randint(10, 20)
        reports_count = random.randint(1, 5)
        reports_score = reports_count * 4
        loc_score = random.choice([5, 10])
        age_hours = random.randint(1, 120)
        age_score = min(10, age_hours // 5)
        impact_score = random.randint(4, 10)
        total_score = min(100, severity_score + safety_risk_score + reports_score + loc_score + age_score + impact_score)

        if total_score >= 80: priority = 'CRITICAL'
        elif total_score >= 60: priority = 'HIGH'
        elif total_score >= 40: priority = 'MEDIUM'
        else: priority = 'LOW'

        created_time = (now - timedelta(hours=age_hours)).strftime('%Y-%m-%d %H:%M:%S+00')

        clean_title = title.replace("'", "''")
        clean_desc = desc.replace("'", "''")
        clean_addr = f"Sector {random.randint(1, 40)}, {clean_city}"

        sql_lines.append(
            f"INSERT INTO public.incidents (id, title, description, category, status, severity, priority, latitude, longitude, address_text, municipality_id, department_id, linked_reports_count, created_at, updated_at) "
            f"VALUES ('{inc_id}', '{clean_title}', '{clean_desc}', '{cat_name}', '{status}', '{severity}', '{priority}', {lat}, {lng}, '{clean_addr}', '{m_id}', '{dept_id}', {reports_count}, '{created_time}', '{created_time}');"
        )

        sql_lines.append(
            f"INSERT INTO public.incident_reports (incident_id, description, latitude, longitude, submitted_at) "
            f"VALUES ('{inc_id}', '{clean_desc}', {lat}, {lng}, '{created_time}');"
        )

        sql_lines.append(
            f"INSERT INTO public.priority_scores (incident_id, total_score, severity_score, safety_risk_score, reports_count_score, location_importance_score, complaint_age_score, public_impact_score, calculated_at) "
            f"VALUES ('{inc_id}', {total_score}, {severity_score}, {safety_risk_score}, {reports_score}, {loc_score}, {age_score}, {impact_score}, '{created_time}');"
        )

        sla_h = 4 if priority == 'CRITICAL' else (24 if priority == 'HIGH' else (72 if priority == 'MEDIUM' else 168))
        due_time = (now - timedelta(hours=age_hours) + timedelta(hours=sla_h)).strftime('%Y-%m-%d %H:%M:%S+00')
        is_breached = 'true' if age_hours > sla_h and status not in ['RESOLVED', 'CLOSED'] else 'false'
        sql_lines.append(
            f"INSERT INTO public.sla_records (incident_id, priority, sla_hours, created_at, due_at, is_breached) "
            f"VALUES ('{inc_id}', '{priority}', {sla_h}, '{created_time}', '{due_time}', {is_breached});"
        )

        sql_lines.append(
            f"INSERT INTO public.ai_analysis (incident_id, suggested_category, severity_rating, safety_risk_score, confidence_score, ai_summary, created_at) "
            f"VALUES ('{inc_id}', '{cat_name}', '{severity}', {round(safety_risk_score/20.0, 2)}, 0.92, 'AI detected hazard in civic zone.', '{created_time}');"
        )

        if status in ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'VERIFICATION', 'CLOSED']:
            matching_workers = [w for w in worker_ids if w[1] == m_id]
            if matching_workers:
                w_id = matching_workers[0][0]
                sql_lines.append(
                    f"INSERT INTO public.assignments (incident_id, worker_id, status, assigned_at) "
                    f"VALUES ('{inc_id}', '{w_id}', '{'COMPLETED' if status in ['RESOLVED', 'CLOSED'] else 'ASSIGNED'}', '{created_time}');"
                )

        if status in ['RESOLVED', 'VERIFICATION', 'CLOSED']:
            sql_lines.append(
                f"INSERT INTO public.evidence (incident_id, after_image_url, notes, created_at) "
                f"VALUES ('{inc_id}', 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=800&q=80', 'Work completed and verified.', '{created_time}');"
            )

    sql_lines.append("\n-- RE-ENABLE ROW LEVEL SECURITY")
    sql_lines.append("ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;")
    sql_lines.append("ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;")
    sql_lines.append("ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;")
    sql_lines.append("ALTER TABLE public.municipalities ENABLE ROW LEVEL SECURITY;")
    sql_lines.append("ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;")

    return "\n".join(sql_lines)

if __name__ == '__main__':
    sql_content = generate_seed_sql()
    with open('database/seed_500_incidents.sql', 'w') as f:
        f.write(sql_content)
    print(f"Successfully generated database/seed_500_incidents.sql with {len(sql_content.splitlines())} SQL lines.")
