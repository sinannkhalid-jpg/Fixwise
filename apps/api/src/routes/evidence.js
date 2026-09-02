import express from 'express';

export function createEvidenceRouter(supabase) {
  const router = express.Router();

  // POST /api/v1/incidents/:id/evidence - Submit work completion evidence
  router.post('/:id/evidence', async (req, res) => {
    try {
      const { id } = req.params;
      const { uploaded_by, after_image_url, before_image_url, notes, latitude, longitude } = req.body;

      if (!after_image_url) {
        return res.status(400).json({ success: false, error: 'after_image_url is required as resolution evidence.' });
      }

      // 1. Insert Evidence record
      const { data: evidence, error: evErr } = await supabase
        .from('evidence')
        .insert({
          incident_id: id,
          uploaded_by,
          before_image_url,
          after_image_url,
          notes,
          latitude,
          longitude
        })
        .select()
        .single();

      if (evErr) throw evErr;

      // 2. Transition case to RESOLVED
      await supabase
        .from('incidents')
        .update({ status: 'RESOLVED', updated_at: new Date().toISOString() })
        .eq('id', id);

      return res.status(201).json({
        success: true,
        message: 'Evidence submitted and incident marked as RESOLVED.',
        evidence
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/v1/incidents/:id/verify - Approve or Reject resolution
  router.post('/:id/verify', async (req, res) => {
    try {
      const { id } = req.params;
      const { verified_by, is_approved, rejection_reason, notes } = req.body;

      if (is_approved === undefined) {
        return res.status(400).json({ success: false, error: 'is_approved boolean is required.' });
      }

      // 1. Insert Verification Record
      const { data: verification, error: verErr } = await supabase
        .from('verifications')
        .insert({
          incident_id: id,
          verified_by,
          is_approved,
          rejection_reason: is_approved ? null : rejection_reason,
          notes
        })
        .select()
        .single();

      if (verErr) throw verErr;

      // 2. Update Status based on Verification outcome
      const nextStatus = is_approved ? 'CLOSED' : 'REOPENED';
      await supabase
        .from('incidents')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      return res.json({
        success: true,
        message: is_approved ? 'Incident verified and CLOSED.' : 'Incident verification rejected and REOPENED.',
        verification,
        new_status: nextStatus
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}
