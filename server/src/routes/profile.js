import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';

const router = Router();

/**
 * PUT /api/profile – update current user's profile (name, avatar_url)
 */
router.put('/', requireAuth, async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Service unavailable' });
    const { name, avatar_url } = req.body;
    const update = {};
    if (name !== undefined) update.name = typeof name === 'string' ? name.trim() || null : null;
    if (avatar_url !== undefined) update.avatar_url = typeof avatar_url === 'string' ? avatar_url.trim() || null : null;
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'Provide name and/or avatar_url' });
    }
    const { data, error } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', req.user.id)
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ profile: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
