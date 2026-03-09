import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

/**
 * GET /api/engineers
 * List engineers (public). Query: skill (filter by skill), minRating, sort=rating|experience|name
 */
router.get('/', async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Service unavailable' });

    const { skill, minRating, sort = 'rating' } = req.query;

    let query = supabase
      .from('engineer_profiles')
      .select('id, user_id, bio, skills, experience_years, rating, availability, profession, location, hourly_rate')
      .eq('approved', true);

    if (skill && typeof skill === 'string' && skill.trim()) {
      query = query.contains('skills', [skill.trim()]);
    }
    if (minRating != null && !Number.isNaN(Number(minRating))) {
      query = query.gte('rating', Number(minRating));
    }

    const orderColumn = sort === 'experience' ? 'experience_years' : sort === 'name' ? 'user_id' : 'rating';
    const ascending = sort === 'name';
    query = query.order(orderColumn, { ascending, nullsFirst: false });

    const { data: engineerProfiles, error: epError } = await query;

    if (epError) return res.status(500).json({ error: epError.message });
    if (!engineerProfiles?.length) return res.json({ engineers: [] });

    const userIds = [...new Set(engineerProfiles.map((ep) => ep.user_id))];
    const { data: profiles, error: pError } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', userIds)
      .eq('role', 'engineer')
      .eq('suspended', false);

    if (pError) return res.status(500).json({ error: pError.message });
    const profileMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));

    const engineers = engineerProfiles
      .filter((ep) => profileMap[ep.user_id] && !profileMap[ep.user_id].suspended)
      .map((ep) => ({
      id: ep.user_id,
      profile_id: ep.id,
      name: profileMap[ep.user_id]?.name ?? null,
      avatar_url: profileMap[ep.user_id]?.avatar_url ?? null,
      bio: ep.bio,
      skills: ep.skills || [],
      experience_years: ep.experience_years,
      rating: ep.rating != null ? Number(ep.rating) : null,
      availability: ep.availability,
      profession: ep.profession ?? null,
      location: ep.location ?? null,
      hourly_rate: ep.hourly_rate != null ? Number(ep.hourly_rate) : null,
    }));

    if (sort === 'name') {
      engineers.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    res.json({ engineers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/engineers/:id
 * Get one engineer's full profile + projects (public).
 */
router.get('/:id', async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Service unavailable' });

    const { id } = req.params;

    const [
      { data: profile, error: profileError },
      { data: engineerProfile, error: epError },
      { data: projects, error: projectsError },
      { data: certificates, error: certError },
      { data: reviewRows },
    ] = await Promise.all([
      supabase.from('profiles').select('id, name, avatar_url, suspended').eq('id', id).eq('role', 'engineer').single(),
      supabase.from('engineer_profiles').select('*').eq('user_id', id).single(),
      supabase.from('projects').select('id, title, description, media_url, category, location, year_completed, duration, budget_range, created_at').eq('engineer_id', id).order('created_at', { ascending: false }),
      supabase.from('certificates').select('id, name, issuing_organization, issue_date, expiry_date, credential_id, document_url, status').eq('engineer_id', id).order('created_at', { ascending: false }),
      supabase.from('bookings').select('id').eq('engineer_id', id).then(async ({ data: bids }) => {
        const ids = (bids || []).map((b) => b.id);
        if (ids.length === 0) return { data: [] };
        const { data: revs } = await supabase
          .from('reviews')
          .select('id, booking_id, rating, comment, created_at')
          .in('booking_id', ids)
          .order('created_at', { ascending: false });
        return { data: revs || [] };
      }),
    ]);

    if (profileError || !profile) return res.status(404).json({ error: 'Engineer not found' });
    if (epError && epError.code !== 'PGRST116') return res.status(500).json({ error: epError.message });
    if (!engineerProfile?.approved || profile.suspended) return res.status(404).json({ error: 'Engineer not found' });
    if (projectsError) return res.status(500).json({ error: projectsError.message });

    const reviewList = Array.isArray(reviewRows) ? reviewRows : (reviewRows?.data ?? []);
    const bookingIds = [...new Set(reviewList.map((r) => r.booking_id))];
    let clientNameByBooking = {};
    if (bookingIds.length > 0) {
      const { data: bookings } = await supabase.from('bookings').select('id, client_id').in('id', bookingIds);
      const clientIds = [...new Set((bookings || []).map((b) => b.client_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', clientIds);
      const nameMap = Object.fromEntries((profiles || []).map((p) => [p.id, p.name]));
      clientNameByBooking = Object.fromEntries((bookings || []).map((b) => [b.id, nameMap[b.client_id] ?? null]));
    }

    const reviews = reviewList.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      created_at: r.created_at,
      client_name: clientNameByBooking[r.booking_id] ?? null,
    }));

    res.json({
      engineer: {
        id: profile.id,
        name: profile.name,
        avatar_url: profile.avatar_url ?? null,
        bio: engineerProfile?.bio ?? null,
        skills: engineerProfile?.skills ?? [],
        experience_years: engineerProfile?.experience_years ?? null,
        rating: engineerProfile?.rating != null ? Number(engineerProfile.rating) : null,
        availability: engineerProfile?.availability ?? null,
        profession: engineerProfile?.profession ?? null,
        location: engineerProfile?.location ?? null,
        hourly_rate: engineerProfile?.hourly_rate != null ? Number(engineerProfile.hourly_rate) : null,
      },
      projects: projects ?? [],
      certificates: certificates ?? [],
      reviews: reviews,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
