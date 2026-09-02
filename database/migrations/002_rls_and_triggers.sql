-- =====================================================================
-- FIXWISE DATABASE MIGRATION 002: RLS POLICIES & STATE MACHINE TRIGGERS
-- Project: AI-Powered Citizen Complaint Management & Civic Intelligence Platform
-- Author: Member 1 (Backend & Supabase Core Architect)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ---------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.municipalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sla_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.priority_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 2. HELPER FUNCTIONS FOR ROLE-BASED ACCESS CONTROL (RBAC)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_municipality_id()
RETURNS UUID AS $$
  SELECT municipality_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_department_id()
RETURNS UUID AS $$
  SELECT department_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ---------------------------------------------------------------------
-- 3. RLS POLICIES FOR INCIDENTS
-- ---------------------------------------------------------------------
-- Citizens and public can view incidents (Public Map / Transparency)
CREATE POLICY "Public read incidents" ON public.incidents
  FOR SELECT USING (true);

-- Municipality Admins can manage incidents within their municipality
CREATE POLICY "Municipality Admin manage incidents" ON public.incidents
  FOR ALL USING (
    public.current_user_role() = 'SUPER_ADMIN' OR
    (public.current_user_role() = 'MUNICIPALITY_ADMIN' AND municipality_id = public.current_user_municipality_id()) OR
    (public.current_user_role() = 'DEPARTMENT_ADMIN' AND department_id = public.current_user_department_id())
  );

-- Citizens can insert incident reports
CREATE POLICY "Citizens can insert reports" ON public.incident_reports
  FOR INSERT WITH CHECK (auth.uid() = citizen_id OR citizen_id IS NULL);

CREATE POLICY "Citizens can view own reports" ON public.incident_reports
  FOR SELECT USING (
    public.current_user_role() = 'SUPER_ADMIN' OR
    citizen_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.incidents i
      WHERE i.id = incident_reports.incident_id
      AND i.municipality_id = public.current_user_municipality_id()
    )
  );

-- ---------------------------------------------------------------------
-- 4. CONTROLLED STATE MACHINE VALIDATION TRIGGER
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_validate_case_status_transition()
RETURNS TRIGGER AS $$
DECLARE
  old_st public.case_status;
  new_st public.case_status;
BEGIN
  old_st := OLD.status;
  new_st := NEW.status;

  -- If status hasn't changed, allow
  IF old_st = new_st THEN
    RETURN NEW;
  END IF;

  -- Validate permitted state transitions:
  -- REPORTED -> ANALYZING, ASSIGNED, REJECTED
  -- ANALYZING -> ASSIGNED, REPORTED
  -- ASSIGNED -> IN_PROGRESS, REASSIGNED
  -- IN_PROGRESS -> RESOLVED
  -- RESOLVED -> VERIFICATION
  -- VERIFICATION -> CLOSED, REJECTED, REOPENED
  -- REJECTED -> REOPENED, CLOSED
  -- REOPENED -> IN_PROGRESS, ASSIGNED

  IF (old_st = 'REPORTED' AND new_st IN ('ANALYZING', 'ASSIGNED', 'REJECTED')) OR
     (old_st = 'ANALYZING' AND new_st IN ('ASSIGNED', 'REPORTED')) OR
     (old_st = 'ASSIGNED' AND new_st IN ('IN_PROGRESS', 'REASSIGNED')) OR
     (old_st = 'IN_PROGRESS' AND new_st IN ('RESOLVED')) OR
     (old_st = 'RESOLVED' AND new_st IN ('VERIFICATION')) OR
     (old_st = 'VERIFICATION' AND new_st IN ('CLOSED', 'REJECTED', 'REOPENED')) OR
     (old_st = 'REJECTED' AND new_st IN ('REOPENED', 'CLOSED')) OR
     (old_st = 'REOPENED' AND new_st IN ('IN_PROGRESS', 'ASSIGNED')) THEN
     
     -- Automatically record status history
     INSERT INTO public.status_history (incident_id, previous_status, new_status, changed_by)
     VALUES (NEW.id, old_st, new_st, auth.uid());

     RETURN NEW;
  ELSE
     RAISE EXCEPTION 'Invalid case status transition from % to %. Transition not allowed by state machine rules.', old_st, new_st;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_validate_case_status ON public.incidents;
CREATE TRIGGER trg_validate_case_status
  BEFORE UPDATE OF status ON public.incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_validate_case_status_transition();

-- ---------------------------------------------------------------------
-- 5. SLA CALCULATION & BREACH CHECK TRIGGER
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_calculate_sla_due_date()
RETURNS TRIGGER AS $$
DECLARE
  hours_allotted INTEGER;
BEGIN
  -- Determine SLA hours based on Priority
  CASE NEW.priority
    WHEN 'CRITICAL' THEN hours_allotted := 4;
    WHEN 'HIGH' THEN hours_allotted := 24;
    WHEN 'MEDIUM' THEN hours_allotted := 72;
    WHEN 'LOW' THEN hours_allotted := 168;
    ELSE hours_allotted := 72;
  END CASE;

  INSERT INTO public.sla_records (incident_id, priority, sla_hours, due_at)
  VALUES (NEW.id, NEW.priority, hours_allotted, NOW() + (hours_allotted || ' hours')::INTERVAL)
  ON CONFLICT (incident_id) DO UPDATE SET
    priority = EXCLUDED.priority,
    sla_hours = EXCLUDED.sla_hours,
    due_at = NOW() + (EXCLUDED.sla_hours || ' hours')::INTERVAL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_calculate_sla ON public.incidents;
CREATE TRIGGER trg_calculate_sla
  AFTER INSERT OR UPDATE OF priority ON public.incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_calculate_sla_due_date();
