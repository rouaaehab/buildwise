import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';

const router = Router();
const admin = [requireAuth, requireRole('admin')];

/**
 * GET /api/admin/overview – platform stats
 */
router.get('/overview', ...admin, async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Service unavailable' });

    const [
      { count: usersCount },
      { count: engineersCount },
      { count: bookingsCount },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'engineer'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }),
    ]);

    res.json({
      users: usersCount ?? 0,
      engineers: engineersCount ?? 0,
      bookings: bookingsCount ?? 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/engineers/pending – list engineers pending approval
 */
router.get('/engineers/pending', ...admin, async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Service unavailable' });

    const { data: rows, error } = await supabase
      .from('engineer_profiles')
      .select('id, user_id, bio, skills, experience_years, created_at')
      .eq('approved', false)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    if (!rows?.length) return res.json({ engineers: [] });

    const userIds = rows.map((r) => r.user_id);
    const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', userIds);
    const nameMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

    const engineers = rows.map((ep) => ({
      id: ep.user_id,
      profile_id: ep.id,
      name: nameMap[ep.user_id]?.name ?? null,
      bio: ep.bio,
      skills: ep.skills || [],
      experience_years: ep.experience_years,
      created_at: ep.created_at,
    }));

    res.json({ engineers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/admin/engineers/:id/approve – approve or reject engineer
 * Body: approved (boolean)
 */
router.patch('/engineers/:id/approve', ...admin, async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Service unavailable' });
    const { id } = req.params;
    const approved = Boolean(req.body.approved);

    const { data, error } = await supabase
      .from('engineer_profiles')
      .update({ approved })
      .eq('user_id', id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Engineer profile not found' });
    res.json({ engineer: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/users – list all users (profiles)
 */
router.get('/users', ...admin, async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Service unavailable' });

    const { data: rows, error } = await supabase
      .from('profiles')
      .select('id, name, role, suspended')
      .order('id');

    if (error) return res.status(500).json({ error: error.message });
    res.json({ users: rows ?? [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const VALID_ROLES = ['client', 'engineer', 'admin'];

/**
 * PATCH /api/admin/users/:id – suspend/unsuspend or update role
 * Body: suspended (boolean), role (optional: 'client' | 'engineer' | 'admin')
 */
router.patch('/users/:id', ...admin, async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Service unavailable' });
    const { id } = req.params;
    const { suspended, role } = req.body;

    if (id === req.user.id) {
      if (suspended !== undefined) return res.status(400).json({ error: 'Cannot suspend yourself' });
      if (role !== undefined && role !== 'admin') return res.status(400).json({ error: 'Cannot remove your own admin role' });
    }

    const updates = {};
    if (typeof suspended === 'boolean') updates.suspended = suspended;
    if (typeof role === 'string' && VALID_ROLES.includes(role)) updates.role = role;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'Provide suspended and/or role' });
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'User not found' });
    res.json({ user: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/bookings – list all bookings (with duration and amount)
 */
router.get('/bookings', ...admin, async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Service unavailable' });

    const { data: rows, error } = await supabase
      .from('bookings')
      .select('id, client_id, engineer_id, datetime, status, duration_hours, amount, created_at')
      .order('datetime', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    if (!rows?.length) return res.json({ bookings: [] });

    const profileIds = [...new Set(rows.flatMap((r) => [r.client_id, r.engineer_id]))];
    const engineerIds = [...new Set(rows.map((r) => r.engineer_id))];
    const [profilesRes, engineersRes] = await Promise.all([
      supabase.from('profiles').select('id, name').in('id', profileIds),
      supabase.from('engineer_profiles').select('user_id, hourly_rate').in('user_id', engineerIds),
    ]);
    const nameMap = Object.fromEntries((profilesRes.data || []).map((p) => [p.id, p.name]));
    const rateMap = Object.fromEntries((engineersRes.data || []).map((e) => [e.user_id, e.hourly_rate]));

    const bookings = rows.map((r) => {
      const durationHours = r.duration_hours != null ? Number(r.duration_hours) : null;
      const hourlyRate = rateMap[r.engineer_id] != null ? Number(rateMap[r.engineer_id]) : null;
      // Use stored amount, or compute from duration × rate when amount is missing (e.g. legacy data)
      const amount =
        r.amount != null
          ? Number(r.amount)
          : durationHours != null && hourlyRate != null
            ? Math.round(durationHours * hourlyRate * 100) / 100
            : null;
      return {
        id: r.id,
        client_id: r.client_id,
        engineer_id: r.engineer_id,
        client_name: nameMap[r.client_id] ?? null,
        engineer_name: nameMap[r.engineer_id] ?? null,
        datetime: r.datetime,
        status: r.status,
        duration_hours: durationHours,
        amount,
        hourly_rate: hourlyRate,
        created_at: r.created_at,
      };
    });

    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/admin/bookings/:id – set duration (and recalc amount from engineer hourly rate)
 * Body: duration_hours (number)
 */
router.patch('/bookings/:id', ...admin, async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Service unavailable' });
    const { id } = req.params;
    const hours = req.body.duration_hours != null ? Number(req.body.duration_hours) : null;
    if (hours == null || Number.isNaN(hours) || hours <= 0) {
      return res.status(400).json({ error: 'duration_hours must be a positive number' });
    }

    const { data: existing, error: fetchErr } = await supabase
      .from('bookings')
      .select('id, engineer_id')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) return res.status(404).json({ error: 'Booking not found' });

    const update = { duration_hours: hours };
    const { data: engProfile } = await supabase
      .from('engineer_profiles')
      .select('hourly_rate')
      .eq('user_id', existing.engineer_id)
      .single();
    const rate = engProfile?.hourly_rate != null ? Number(engProfile.hourly_rate) : null;
    if (rate != null && !Number.isNaN(rate)) {
      update.amount = Math.round(hours * rate * 100) / 100;
    }

    const { data: updated, error } = await supabase
      .from('bookings')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    const profileIds = [updated.client_id, updated.engineer_id];
    const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', profileIds);
    const nameMap = Object.fromEntries((profiles || []).map((p) => [p.id, p.name]));
    const { data: engRow } = await supabase
      .from('engineer_profiles')
      .select('hourly_rate')
      .eq('user_id', updated.engineer_id)
      .single();

    const booking = {
      id: updated.id,
      client_id: updated.client_id,
      engineer_id: updated.engineer_id,
      client_name: nameMap[updated.client_id] ?? null,
      engineer_name: nameMap[updated.engineer_id] ?? null,
      datetime: updated.datetime,
      status: updated.status,
      duration_hours: updated.duration_hours != null ? Number(updated.duration_hours) : null,
      amount: updated.amount != null ? Number(updated.amount) : null,
      hourly_rate: engRow?.hourly_rate != null ? Number(engRow.hourly_rate) : null,
      created_at: updated.created_at,
    };
    res.json({ booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/reviews – list recent reviews (for moderation)
 */
router.get('/reviews', ...admin, async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Service unavailable' });

    const { data: rows, error } = await supabase
      .from('reviews')
      .select('id, booking_id, rating, comment, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) return res.status(500).json({ error: error.message });

    const bookingIds = [...new Set((rows || []).map((r) => r.booking_id))];
    const { data: bookings } = await supabase.from('bookings').select('id, engineer_id, client_id').in('id', bookingIds);
    const bookingMap = Object.fromEntries((bookings || []).map((b) => [b.id, b]));
    const profileIds = [...new Set((bookings || []).flatMap((b) => [b.engineer_id, b.client_id]))];
    const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', profileIds);
    const nameMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

    const reviews = (rows || []).map((r) => {
      const b = bookingMap[r.booking_id];
      return {
        id: r.id,
        booking_id: r.booking_id,
        rating: r.rating,
        comment: r.comment,
        created_at: r.created_at,
        engineer_name: b ? (nameMap[b.engineer_id]?.name ?? null) : null,
        client_name: b ? (nameMap[b.client_id]?.name ?? null) : null,
      };
    });

    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/admin/reviews/:id – remove a review (content moderation)
 */
router.delete('/reviews/:id', ...admin, async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Service unavailable' });
    const { id } = req.params;

    const { error } = await supabase.from('reviews').delete().eq('id', id);

    if (error) return res.status(400).json({ error: error.message });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/contact-submissions – list "Send us a message" submissions (admin replies by email)
 */
router.get('/contact-submissions', ...admin, async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Service unavailable' });

    const { data: rows, error } = await supabase
      .from('contact_submissions')
      .select('id, name, email, role, message, created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) return res.status(500).json({ error: error.message });

    const submissions = (rows || []).map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role ?? null,
      message: r.message,
      created_at: r.created_at,
    }));

    res.json({ submissions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
