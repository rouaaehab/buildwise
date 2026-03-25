/**
 * Consultation end time: scheduled start + duration (defaults to 1h if missing).
 */
export function getBookingEndMs(booking) {
  if (!booking?.datetime) return null;
  const start = new Date(booking.datetime).getTime();
  if (Number.isNaN(start)) return null;
  const hours =
    booking.duration_hours != null && !Number.isNaN(Number(booking.duration_hours))
      ? Number(booking.duration_hours)
      : 1;
  return start + hours * 60 * 60 * 1000;
}

/**
 * UI + filters: accepted bookings past their end time behave as completed
 * (matches server auto-complete when it has run).
 */
export function effectiveBookingStatus(booking) {
  if (!booking) return '';
  if (booking.status !== 'accepted') return booking.status;
  const end = getBookingEndMs(booking);
  if (end != null && end <= Date.now()) return 'completed';
  return 'accepted';
}
