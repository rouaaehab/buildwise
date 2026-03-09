import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

/**
 * POST /api/contact – submit "Send us a message" form (public, no auth)
 * Body: name, email, role (optional: 'client' | 'engineer'), message
 */
router.post('/', async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Service unavailable' });

    const { name, email, role, message } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }
    const emailTrimmed = email.trim();
    if (!/\S+@\S+\.\S+/.test(emailTrimmed)) {
      return res.status(400).json({ error: 'Please enter a valid email' });
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }
    if (message.trim().length < 3) {
      return res.status(400).json({ error: 'Message must be at least 3 characters' });
    }

    const roleVal =
      role === 'client' || role === 'engineer' ? role : null;

    const { data, error } = await supabase
      .from('contact_submissions')
      .insert({
        name: name.trim(),
        email: emailTrimmed,
        role: roleVal,
        message: message.trim(),
      })
      .select('id, created_at')
      .single();

    if (error) return res.status(400).json({ error: error.message });

    res.status(201).json({ id: data.id, created_at: data.created_at });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
