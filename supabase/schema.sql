-- ========================================================
-- FIXWISE DATABASE SCHEMA FOR SUPABASE
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/etmekklrpduyurgpenqp/sql/new
-- ========================================================

-- Enable PostGIS for geographic proximity matching (optional, recommended for civic apps)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. PROFILES TABLE (Extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'citizen' CHECK (role IN ('citizen', 'field_worker', 'department_admin', 'super_admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  municipality TEXT NOT NULL,
  contact_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. COMPLAINTS TABLE
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- e.g. 'Pothole', 'Garbage', 'Streetlight', 'Water Leak'
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'assigned', 'in_progress', 'resolved', 'rejected', 'duplicate')),
  
  -- Location Details
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  address_text TEXT,
  
  -- Media attachments
  image_urls TEXT[], 
  
  -- Associations
  reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  parent_case_id UUID REFERENCES public.complaints(id) ON DELETE SET NULL, -- For grouped duplicate cases
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. AI ANALYSIS RESULTS TABLE
CREATE TABLE IF NOT EXISTS public.ai_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID REFERENCES public.complaints(id) ON DELETE CASCADE UNIQUE,
  is_duplicate BOOLEAN DEFAULT FALSE,
  suggested_parent_id UUID REFERENCES public.complaints(id),
  confidence_score NUMERIC(5, 2), -- 0.00 to 100.00%
  suggested_category TEXT,
  severity_rating TEXT,
  recommended_department_id UUID REFERENCES public.departments(id),
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS POLICIES (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analysis ENABLE ROW LEVEL SECURITY;

-- Allow public read access to complaints (for public citizen reporting map)
CREATE POLICY "Allow public read access to complaints" ON public.complaints
  FOR SELECT USING (true);

-- Allow authenticated users to insert complaints
CREATE POLICY "Allow citizens to submit complaints" ON public.complaints
  FOR INSERT WITH CHECK (true);
