import express from 'express';

export function createMunicipalityRouter(supabase) {
  const router = express.Router();

  // GET /api/v1/municipalities - List all municipalities
  router.get('/', async (req, res) => {
    try {
      const { data, error } = await supabase.from('municipalities').select('*').order('name');
      if (error) throw error;
      return res.json({ success: true, count: data.length, data });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/v1/municipalities/:id/departments - List departments for a municipality
  router.get('/:id/departments', async (req, res) => {
    try {
      const { id } = req.params;
      const { data, error } = await supabase.from('departments').select('*').eq('municipality_id', id).order('name');
      if (error) throw error;
      return res.json({ success: true, count: data.length, data });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/v1/municipalities/:id/workers - List field workers for a municipality
  router.get('/:id/workers', async (req, res) => {
    try {
      const { id } = req.params;
      const { data, error } = await supabase
        .from('workers')
        .select(`
          *,
          profile:profiles(full_name, phone, avatar_url),
          department:departments(name)
        `)
        .eq('municipality_id', id)
        .order('is_active', { ascending: false });

      if (error) throw error;
      return res.json({ success: true, count: data.length, data });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}
