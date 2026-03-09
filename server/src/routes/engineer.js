import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';

const router = Router();
const engineerAuth = [requireAuth, requireRole('engineer')];

// Get current engineer's profile (create placeholder if missing)
router.get('/profile', ...engineerAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('engineer_profiles')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      return res.status(500).json({ error: error.message });
    }

    if (!data) {
      return res.json({ profile: null });
    }

    res.json({ profile: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upsert engineer profile
router.put('/profile', ...engineerAuth, async (req, res) => {
  try {
    const { bio, skills, experience_years, availability, profession, location, hourly_rate } = req.body;
    const payload = {
      user_id: req.user.id,
      ...(bio !== undefined && { bio }),
      ...(Array.isArray(skills) && { skills }),
      ...(typeof experience_years === 'number' && { experience_years }),
      ...(availability !== undefined && { availability }),
      ...(typeof profession === 'string' && { profession: profession.trim() || null }),
      ...(typeof location === 'string' && { location: location.trim() || null }),
      ...(hourly_rate !== undefined && (hourly_rate === null || hourly_rate === '' || (typeof hourly_rate === 'number' && hourly_rate >= 0))
        && { hourly_rate: (hourly_rate === null || hourly_rate === '') ? null : Number(hourly_rate) }),
    };

    const { data, error } = await supabase
      .from('engineer_profiles')
      .upsert(payload, { onConflict: 'user_id', ignoreDuplicates: false })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json({ profile: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List current engineer's projects
router.get('/projects', ...engineerAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('engineer_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ projects: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create project
router.post('/projects', ...engineerAuth, async (req, res) => {
  try {
    const { title, description, media_url, category, location, year_completed, duration, budget_range } = req.body;
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const { data, error } = await supabase
      .from('projects')
      .insert({
        engineer_id: req.user.id,
        title: title.trim(),
        description: description?.trim() || null,
        media_url: media_url?.trim() || null,
        category: category?.trim() || null,
        location: location?.trim() || null,
        year_completed: year_completed != null ? String(year_completed).trim() || null : null,
        duration: duration?.trim() || null,
        budget_range: budget_range?.trim() || null,
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ project: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update project
router.put('/projects/:id', ...engineerAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, media_url, category, location, year_completed, duration, budget_range } = req.body;

    const update = {};
    if (typeof title === 'string') update.title = title.trim();
    if (description !== undefined) update.description = description?.trim() || null;
    if (media_url !== undefined) update.media_url = media_url?.trim() || null;
    if (category !== undefined) update.category = category?.trim() || null;
    if (location !== undefined) update.location = location?.trim() || null;
    if (year_completed !== undefined) update.year_completed = year_completed != null ? String(year_completed).trim() || null : null;
    if (duration !== undefined) update.duration = duration?.trim() || null;
    if (budget_range !== undefined) update.budget_range = budget_range?.trim() || null;

    const { data, error } = await supabase
      .from('projects')
      .update(update)
      .eq('id', id)
      .eq('engineer_id', req.user.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Project not found' });
    res.json({ project: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete project
router.delete('/projects/:id', ...engineerAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('engineer_id', req.user.id)
      .select('id');

    if (error) return res.status(400).json({ error: error.message });
    if (!data?.length) return res.status(404).json({ error: 'Project not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List my certificates
router.get('/certificates', ...engineerAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .eq('engineer_id', req.user.id)
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json({ certificates: data || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update certificate
router.put('/certificates/:id', ...engineerAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      issuing_organization,
      issue_date,
      expiry_date,
      credential_id,
      document_url,
    } = req.body;
    const update = {};
    if (typeof name === 'string') update.name = name.trim();
    if (typeof issuing_organization === 'string') update.issuing_organization = issuing_organization.trim();
    if (issue_date !== undefined) {
      const d = new Date(issue_date);
      if (!Number.isNaN(d.getTime())) update.issue_date = d.toISOString().slice(0, 10);
    }
    if (expiry_date !== undefined) {
      if (expiry_date == null || expiry_date === '') update.expiry_date = null;
      else {
        const d = new Date(expiry_date);
        if (!Number.isNaN(d.getTime())) update.expiry_date = d.toISOString().slice(0, 10);
      }
    }
    if (credential_id !== undefined) update.credential_id = credential_id ? String(credential_id).trim() : null;
    if (document_url !== undefined) update.document_url = document_url ? String(document_url).trim() : null;

    const { data, error } = await supabase
      .from('certificates')
      .update(update)
      .eq('id', id)
      .eq('engineer_id', req.user.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Certificate not found' });
    res.json({ certificate: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete certificate
router.delete('/certificates/:id', ...engineerAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('certificates')
      .delete()
      .eq('id', id)
      .eq('engineer_id', req.user.id)
      .select('id');

    if (error) return res.status(400).json({ error: error.message });
    if (!data?.length) return res.status(404).json({ error: 'Certificate not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add certificate (submit for verification)
router.post('/certificates', ...engineerAuth, async (req, res) => {
  try {
    const {
      name,
      issuing_organization,
      issue_date,
      expiry_date,
      credential_id,
      document_url,
    } = req.body;
    if (!name || !issuing_organization || !issue_date) {
      return res.status(400).json({
        error: 'name, issuing_organization, and issue_date are required',
      });
    }
    const issueDate = new Date(issue_date);
    if (Number.isNaN(issueDate.getTime())) {
      return res.status(400).json({ error: 'Invalid issue_date' });
    }
    let expiryDate = null;
    if (expiry_date) {
      expiryDate = new Date(expiry_date);
      if (Number.isNaN(expiryDate.getTime())) {
        return res.status(400).json({ error: 'Invalid expiry_date' });
      }
    }
    const { data, error } = await supabase
      .from('certificates')
      .insert({
        engineer_id: req.user.id,
        name: String(name).trim(),
        issuing_organization: String(issuing_organization).trim(),
        issue_date: issueDate.toISOString().slice(0, 10),
        expiry_date: expiryDate ? expiryDate.toISOString().slice(0, 10) : null,
        credential_id: credential_id ? String(credential_id).trim() : null,
        document_url: document_url ? String(document_url).trim() : null,
        status: 'verified',
      })
      .select()
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ certificate: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
