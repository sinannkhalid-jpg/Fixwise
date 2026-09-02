import express from 'express';
import { calculatePriorityScore } from '../services/priorityEngine.js';

export function createIncidentRouter(supabase) {
  const router = express.Router();

  // GET /api/v1/incidents - List incidents with filtering
  router.get('/', async (req, res) => {
    try {
      const { municipality_id, department_id, status, priority, category } = req.query;

      let query = supabase.from('incidents').select(`
        *,
        municipality:municipalities(name),
        department:departments(name),
        sla_records(due_at, is_breached),
        priority_scores(total_score)
      `);

      if (municipality_id) query = query.eq('municipality_id', municipality_id);
      if (department_id) query = query.eq('department_id', department_id);
      if (status) query = query.eq('status', status);
      if (priority) query = query.eq('priority', priority);
      if (category) query = query.eq('category', category);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return res.json({ success: true, count: data.length, data });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/v1/incidents - Submit new incident
  router.post('/', async (req, res) => {
    try {
      const { title, description, category, latitude, longitude, address_text, image_urls, citizen_id } = req.body;

      if (!title || !description || !category) {
        return res.status(400).json({ success: false, error: 'Title, description, and category are required.' });
      }

      // Calculate initial priority score
      const priorityResult = calculatePriorityScore({
        severity: 'MEDIUM',
        safetyRisk: 0.5,
        linkedReportsCount: 1
      });

      // 1. Create Incident
      const { data: incident, error: incErr } = await supabase
        .from('incidents')
        .insert({
          title,
          description,
          category,
          status: 'REPORTED',
          severity: 'MEDIUM',
          priority: priorityResult.priorityLevel,
          latitude,
          longitude,
          address_text
        })
        .select()
        .single();

      if (incErr) throw incErr;

      // 2. Insert Citizen Report
      await supabase.from('incident_reports').insert({
        incident_id: incident.id,
        citizen_id: citizen_id || null,
        description,
        image_urls: image_urls || [],
        latitude,
        longitude
      });

      // 3. Save Priority Score Breakdown
      await supabase.from('priority_scores').insert({
        incident_id: incident.id,
        total_score: priorityResult.totalScore,
        severity_score: priorityResult.breakdown.severityScore,
        safety_risk_score: priorityResult.breakdown.safetyRiskScore,
        reports_count_score: priorityResult.breakdown.reportsCountScore,
        location_importance_score: priorityResult.breakdown.locationImportanceScore,
        complaint_age_score: priorityResult.breakdown.complaintAgeScore,
        public_impact_score: priorityResult.breakdown.publicImpactScore
      });

      return res.status(201).json({
        success: true,
        message: 'Incident reported successfully.',
        incident,
        priority: priorityResult
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // PATCH /api/v1/incidents/:id/status - Update status via State Machine
  router.patch('/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { new_status, reason, changed_by } = req.body;

      if (!new_status) {
        return res.status(400).json({ success: false, error: 'new_status is required.' });
      }

      // Update triggers fn_validate_case_status_transition in PostgreSQL
      const { data, error } = await supabase
        .from('incidents')
        .update({ status: new_status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }

      return res.json({ success: true, message: `Status updated to ${new_status}`, incident: data });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/v1/incidents/:id/assign - Assign worker to incident
  router.post('/:id/assign', async (req, res) => {
    try {
      const { id } = req.params;
      const { worker_id, assigned_by, notes } = req.body;

      if (!worker_id) {
        return res.status(400).json({ success: false, error: 'worker_id is required.' });
      }

      // Create Assignment record
      const { data: assignment, error: assignErr } = await supabase
        .from('assignments')
        .insert({
          incident_id: id,
          worker_id,
          assigned_by,
          notes,
          status: 'ASSIGNED'
        })
        .select()
        .single();

      if (assignErr) throw assignErr;

      // Update Incident Status to ASSIGNED
      await supabase
        .from('incidents')
        .update({ status: 'ASSIGNED', updated_at: new Date().toISOString() })
        .eq('id', id);

      return res.json({ success: true, message: 'Worker assigned successfully.', assignment });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}
