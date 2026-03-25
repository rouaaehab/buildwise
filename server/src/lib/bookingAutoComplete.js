function bookingEndMs(row) {
  const start = new Date(row.datetime).getTime();
  if (Number.isNaN(start)) return null;
  const hours =
    row.duration_hours != null && !Number.isNaN(Number(row.duration_hours))
      ? Number(row.duration_hours)
      : 1;
  return start + hours * 60 * 60 * 1000;
}

/**
 * Mark accepted bookings as completed once start + duration has passed.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {{ userId?: string }} opts - if userId set, only that user's bookings (client or engineer)
 */
export async function autoCompletePastBookings(supabase, { userId } = {}) {
  if (!supabase) return;

  let q = supabase
    .from('bookings')
    .select('id, datetime, duration_hours')
    .eq('status', 'accepted');

  if (userId) {
    q = q.or(`client_id.eq.${userId},engineer_id.eq.${userId}`);
  }

  const { data: rows, error: selErr } = await q;
  if (selErr) {
    console.warn('[bookings] autoCompletePastBookings select:', selErr.message);
    return;
  }

  const now = Date.now();
  const ids = (rows || [])
    .filter((r) => {
      const end = bookingEndMs(r);
      return end != null && end <= now;
    })
    .map((r) => r.id);

  if (!ids.length) return;

  const { error: updErr } = await supabase
    .from('bookings')
    .update({ status: 'completed' })
    .in('id', ids);

  if (updErr) {
    console.warn('[bookings] autoCompletePastBookings update:', updErr.message);
  }
}
