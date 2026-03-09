import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';

const router = Router();

/**
 * GET /api/reviews?engineer_id= – list reviews for an engineer (public)
 */
router.get('/', async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Service unavailable' });
    const engineerId = req.query.engineer_id;
    if (!engineerId) return res.status(400).json({ error: 'engineer_id is required' });

    const { data: bookings, error: bErr } = await supabase
      .from('bookings')
      .select('id')
      .eq('engineer_id', engineerId);

    if (bErr) return res.status(500).json({ error: bErr.message });
    const bookingIds = (bookings || []).map((b) => b.id);
    if (bookingIds.length === 0) return res.json({ reviews: [] });

    const { data: rows, error } = await supabase
      .from('reviews')
      .select('id, booking_id, rating, comment, created_at')
      .in('booking_id', bookingIds)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    const reviews = (rows || []).map((r) => ({
      id: r.id,
      booking_id: r.booking_id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
    }));
    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/reviews – create a review (client only, for own accepted/completed booking)
 * Body: booking_id, rating (1-5), comment (optional)
 */
router.post('/', requireAuth, requireRole('client'), async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Service unavailable' });
    const { booking_id, rating, comment } = req.body;
    if (!booking_id || rating == null) {
      return res.status(400).json({ error: 'booking_id and rating are required' });
    }
    const r = Number(rating);
    if (!Number.isInteger(r) || r < 1 || r > 5) {
      return res.status(400).json({ error: 'rating must be 1–5' });
    }

    const { data: booking, error: fetchErr } = await supabase
      .from('bookings')
      .select('id, client_id, engineer_id, status')
      .eq('id', booking_id)
      .single();

    if (fetchErr || !booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.client_id !== req.user.id) {
      return res.status(403).json({ error: 'Not your booking' });
    }
    if (!['accepted', 'completed'].includes(booking.status)) {
      return res.status(400).json({ error: 'Can only review accepted or completed bookings' });
    }

    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('booking_id', booking_id)
      .single();

    if (existing) return res.status(400).json({ error: 'You already reviewed this booking' });

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        booking_id,
        rating: r,
        comment: typeof comment === 'string' ? comment.trim() || null : null,
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.status(201).json({ review: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/reviews/booking/:bookingId – get review for a booking (to show "already reviewed" or form)
 */
router.get('/booking/:bookingId', requireAuth, async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Service unavailable' });
    const { bookingId } = req.params;

    const { data: review, error } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at')
      .eq('booking_id', bookingId)
      .single();

    if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message });
    res.json({ review: review || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
