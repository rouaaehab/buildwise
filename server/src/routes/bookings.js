import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';
import { autoCompletePastBookings } from '../lib/bookingAutoComplete.js';

const router = Router();

function formatBookingRow(row, clientName, engineerName, review = null) {
  return {
    id: row.id,
    client_id: row.client_id,
    engineer_id: row.engineer_id,
    datetime: row.datetime,
    status: row.status,
    zoom_link: row.zoom_link,
    duration_hours: row.duration_hours != null ? Number(row.duration_hours) : null,
    amount: row.amount != null ? Number(row.amount) : null,
    created_at: row.created_at,
    client_name: clientName,
    engineer_name: engineerName,
    review,
  };
}

/**
 * GET /api/bookings – list my bookings (as client or engineer)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Service unavailable' });
    const userId = req.user.id;

    await autoCompletePastBookings(supabase, { userId });

    const { data: rows, error } = await supabase
      .from('bookings')
      .select('*')
      .or(`client_id.eq.${userId},engineer_id.eq.${userId}`)
      .order('datetime', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });
    if (!rows?.length) return res.json({ bookings: [] });

    const profileIds = [...new Set(rows.flatMap((r) => [r.client_id, r.engineer_id]))];
    const engineerIds = [...new Set(rows.map((r) => r.engineer_id))];
    const bookingIds = rows.map((r) => r.id);
    const [profilesRes, reviewsRes, engineersRes] = await Promise.all([
      supabase.from('profiles').select('id, name').in('id', profileIds),
      supabase.from('reviews').select('booking_id, id, rating, comment, created_at').in('booking_id', bookingIds),
      supabase.from('engineer_profiles').select('user_id, hourly_rate').in('user_id', engineerIds),
    ]);
    const nameMap = Object.fromEntries((profilesRes.data || []).map((p) => [p.id, p.name]));
    const rateMap = Object.fromEntries((engineersRes.data || []).map((e) => [e.user_id, e.hourly_rate]));
    const reviewByBooking = Object.fromEntries(
      (reviewsRes.data || []).map((r) => [r.booking_id, { id: r.id, rating: r.rating, comment: r.comment, created_at: r.created_at }])
    );

    const bookings = rows.map((r) => {
      const rate = rateMap[r.engineer_id] != null ? Number(rateMap[r.engineer_id]) : null;
      const durationHours = r.duration_hours != null ? Number(r.duration_hours) : null;
      const amount =
        r.amount != null
          ? Number(r.amount)
          : durationHours != null && rate != null
            ? Math.round(durationHours * rate * 100) / 100
            : null;
      return formatBookingRow(
        { ...r, amount },
        nameMap[r.client_id],
        nameMap[r.engineer_id],
        reviewByBooking[r.id] || null
      );
    });
    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/bookings – create a consultation request (client only)
 * Body: engineer_id, datetime (ISO string), duration_hours (number, optional, default 1)
 */
router.post('/', requireAuth, requireRole('client'), async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Service unavailable' });
    const { engineer_id, datetime, duration_hours: clientDuration } = req.body;
    if (!engineer_id || !datetime) {
      return res.status(400).json({ error: 'engineer_id and datetime are required' });
    }
    const dt = new Date(datetime);
    if (Number.isNaN(dt.getTime())) {
      return res.status(400).json({ error: 'Invalid datetime' });
    }
    if (dt <= new Date()) {
      return res.status(400).json({ error: 'Datetime must be in the future' });
    }
    const hours = clientDuration != null ? Number(clientDuration) : 1;
    if (Number.isNaN(hours) || hours <= 0 || hours > 720) {
      return res.status(400).json({ error: 'duration_hours must be between 0.25 and 720 (30 days)' });
    }

    const clientId = req.user.id;
    if (clientId === engineer_id) {
      return res.status(400).json({ error: 'Cannot book yourself' });
    }

    const { data: engineerRateProfile, error: engineerProfileError } = await supabase
      .from('engineer_profiles')
      .select('hourly_rate')
      .eq('user_id', engineer_id)
      .single();

    if (engineerProfileError) {
      return res.status(400).json({ error: 'Engineer profile not found' });
    }

    const rate = engineerRateProfile?.hourly_rate != null ? Number(engineerRateProfile.hourly_rate) : null;
    const amount = rate != null && !Number.isNaN(rate)
      ? Math.round(hours * rate * 100) / 100
      : null;

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        client_id: clientId,
        engineer_id: engineer_id,
        datetime: dt.toISOString(),
        status: 'pending',
        duration_hours: hours,
        amount,
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    const [{ data: clientProfile }, { data: engineerProfile }] = await Promise.all([
      supabase.from('profiles').select('name').eq('id', clientId).single(),
      supabase.from('profiles').select('name').eq('id', engineer_id).single(),
    ]);

    res.status(201).json({
      booking: formatBookingRow(data, clientProfile?.name, engineerProfile?.name),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/bookings/:id – engineer: accept/reject/cancel, reschedule, or set zoom_link
 * Body: status ('accepted' | 'rejected' | 'cancelled'), zoom_link (optional), datetime (optional, for reschedule)
 * - accept/reject: only when booking is pending
 * - cancel: when booking is pending or accepted (engineer or client situation changed)
 * - reschedule: send datetime (ISO) when booking is accepted; new datetime must be in the future
 */
router.patch('/:id', requireAuth, requireRole('engineer'), async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Service unavailable' });
    const { id } = req.params;
    const { status, zoom_link, datetime: newDatetime, duration_hours } = req.body;

    const { data: existing, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .eq('engineer_id', req.user.id)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Reschedule: engineer updates datetime (pending = suggest new time, accepted = change confirmed time)
    if (newDatetime !== undefined && newDatetime !== null) {
      if (!['pending', 'accepted'].includes(existing.status)) {
        return res.status(400).json({ error: 'Can only reschedule a pending or accepted booking' });
      }
      const dt = new Date(newDatetime);
      if (Number.isNaN(dt.getTime())) {
        return res.status(400).json({ error: 'Invalid datetime' });
      }
      if (dt <= new Date()) {
        return res.status(400).json({ error: 'New date and time must be in the future' });
      }
      const { data: updated, error } = await supabase
        .from('bookings')
        .update({ datetime: dt.toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) return res.status(400).json({ error: error.message });
      const [{ data: cp }, { data: ep }] = await Promise.all([
        supabase.from('profiles').select('name').eq('id', updated.client_id).single(),
        supabase.from('profiles').select('name').eq('id', updated.engineer_id).single(),
      ]);
      return res.json({
        booking: formatBookingRow(updated, cp?.name, ep?.name),
      });
    }

    // Duration-only update: set duration (and recalc amount) on existing pending/accepted booking
    if (duration_hours != null && status === undefined && ['pending', 'accepted'].includes(existing.status)) {
      const hours = Number(duration_hours);
      if (Number.isNaN(hours) || hours <= 0) {
        return res.status(400).json({ error: 'duration_hours must be a positive number' });
      }
      const updateDuration = { duration_hours: hours };
      const { data: engProfile } = await supabase
        .from('engineer_profiles')
        .select('hourly_rate')
        .eq('user_id', req.user.id)
        .single();
      const rate = engProfile?.hourly_rate != null ? Number(engProfile.hourly_rate) : null;
      if (rate != null && !Number.isNaN(rate)) {
        updateDuration.amount = Math.round(hours * rate * 100) / 100;
      }
      const { data: updated, error } = await supabase
        .from('bookings')
        .update(updateDuration)
        .eq('id', id)
        .select()
        .single();
      if (error) return res.status(400).json({ error: error.message });
      const [{ data: cp }, { data: ep }] = await Promise.all([
        supabase.from('profiles').select('name').eq('id', updated.client_id).single(),
        supabase.from('profiles').select('name').eq('id', updated.engineer_id).single(),
      ]);
      return res.json({
        booking: formatBookingRow(updated, cp?.name, ep?.name),
      });
    }

    // Status update
    if (!['accepted', 'rejected', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'status must be accepted, rejected, or cancelled' });
    }

    if (status === 'cancelled') {
      if (!['pending', 'accepted'].includes(existing.status)) {
        return res.status(400).json({ error: 'Can only cancel a pending or accepted booking' });
      }
    } else {
      if (existing.status !== 'pending') {
        return res.status(400).json({ error: 'Booking is no longer pending' });
      }
    }

    const update = { status };
    if (status === 'accepted') {
      if (zoom_link !== undefined) update.zoom_link = zoom_link?.trim() || null;
      // Duration: store and compute amount from engineer's hourly rate
      const hours = duration_hours != null ? Number(duration_hours) : null;
      if (hours != null && !Number.isNaN(hours) && hours > 0) {
        update.duration_hours = hours;
        const { data: engProfile } = await supabase
          .from('engineer_profiles')
          .select('hourly_rate')
          .eq('user_id', req.user.id)
          .single();
        const rate = engProfile?.hourly_rate != null ? Number(engProfile.hourly_rate) : null;
        if (rate != null && !Number.isNaN(rate)) {
          update.amount = Math.round(hours * rate * 100) / 100;
        }
      }
    }

    const { data: updated, error } = await supabase
      .from('bookings')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    const [{ data: cp }, { data: ep }] = await Promise.all([
      supabase.from('profiles').select('name').eq('id', updated.client_id).single(),
      supabase.from('profiles').select('name').eq('id', updated.engineer_id).single(),
    ]);

    res.json({
      booking: formatBookingRow(updated, cp?.name, ep?.name),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
