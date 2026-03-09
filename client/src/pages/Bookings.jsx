import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';
import { Calendar, MessageCircle, Video, Star, ChevronRight } from 'lucide-react';

export default function Bookings() {
  const { user, profile, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [zoomLinks, setZoomLinks] = useState({});
  const [durationValue, setDurationValue] = useState({}); // bookingId -> number
  const [durationUnit, setDurationUnit] = useState({});   // bookingId -> 'hours' | 'days'
  const [settingDurationId, setSettingDurationId] = useState(null);
  const [settingDurationValue, setSettingDurationValue] = useState('1');
  const [settingDurationUnit, setSettingDurationUnit] = useState('hours');
  const [rejecting, setRejecting] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [reschedulingBookingId, setReschedulingBookingId] = useState(null);
  const [rescheduleDatetime, setRescheduleDatetime] = useState('');
  const [rescheduleSubmitting, setRescheduleSubmitting] = useState(false);
  const [reviewingBookingId, setReviewingBookingId] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [filter, setFilter] = useState('all'); // all | pending | accepted | completed

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiFetch('/api/bookings');
        if (!cancelled) setBookings(res.bookings || []);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const getDurationHoursForBooking = (booking) => {
    const val = durationValue[booking.id] != null ? Number(durationValue[booking.id]) : null;
    const unit = durationUnit[booking.id] || 'hours';
    if (val != null && !Number.isNaN(val) && val > 0) {
      return unit === 'days' ? val * 24 : val;
    }
    return booking.duration_hours != null ? booking.duration_hours : 1;
  };

  const handleAccept = async (bookingId) => {
    setActionLoading(bookingId);
    setError('');
    const zoom = zoomLinks[bookingId]?.trim() || null;
    const booking = bookings.find((b) => b.id === bookingId);
    const duration = booking ? getDurationHoursForBooking(booking) : 1;
    try {
      const res = await apiFetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'accepted',
          zoom_link: zoom,
          duration_hours: Math.min(720, Math.max(0.25, duration)),
        }),
      });
      setBookings((prev) => prev.map((b) => (b.id === res.booking.id ? res.booking : b)));
      setZoomLinks((z) => ({ ...z, [bookingId]: '' }));
      setDurationValue((d) => ({ ...d, [bookingId]: undefined }));
      setDurationUnit((d) => ({ ...d, [bookingId]: undefined }));
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSetDuration = async (bookingId) => {
    const val = Number(settingDurationValue) || 1;
    const hours = settingDurationUnit === 'days' ? val * 24 : val;
    if (hours < 0.25 || hours > 720) return;
    setActionLoading(bookingId);
    setError('');
    try {
      const res = await apiFetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ duration_hours: hours }),
      });
      setBookings((prev) => prev.map((b) => (b.id === res.booking.id ? res.booking : b)));
      setSettingDurationId(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (bookingId) => {
    setRejecting(bookingId);
    setError('');
    try {
      await apiFetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'rejected' }),
      });
      setBookings((prev) => prev.map((b) => (b.id === bookingId ? { ...b, status: 'rejected' } : b)));
    } catch (e) {
      setError(e.message);
    } finally {
      setRejecting(null);
    }
  };

  const handleCancel = async (bookingId) => {
    setCancelling(bookingId);
    setError('');
    try {
      const res = await apiFetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'cancelled' }),
      });
      setBookings((prev) => prev.map((b) => (b.id === res.booking.id ? res.booking : b)));
    } catch (e) {
      setError(e.message);
    } finally {
      setCancelling(null);
    }
  };

  const toDatetimeLocal = (isoString) => {
    const d = new Date(isoString);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${day}T${h}:${min}`;
  };

  const handleReschedule = async (bookingId) => {
    if (!rescheduleDatetime.trim()) return;
    setRescheduleSubmitting(true);
    setError('');
    try {
      const res = await apiFetch(`/api/bookings/${bookingId}`, {
        method: 'PATCH',
        body: JSON.stringify({ datetime: new Date(rescheduleDatetime).toISOString() }),
      });
      setBookings((prev) => prev.map((b) => (b.id === res.booking.id ? res.booking : b)));
      setReschedulingBookingId(null);
      setRescheduleDatetime('');
    } catch (e) {
      setError(e.message);
    } finally {
      setRescheduleSubmitting(false);
    }
  };

  const formatDateTime = (dt) => {
    const d = new Date(dt);
    return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  };

  const formatDate = (dt) => new Date(dt).toLocaleDateString(undefined, { dateStyle: 'medium' });
  const formatTime = (dt) => new Date(dt).toLocaleTimeString(undefined, { timeStyle: 'short' });

  const statusConfig = (status) => {
    switch (status) {
      case 'pending':
        return { label: 'Pending', class: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'accepted':
        return { label: 'Accepted', class: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'rejected':
        return { label: 'Rejected', class: 'bg-red-100 text-red-800 border-red-200' };
      case 'completed':
        return { label: 'Completed', class: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'cancelled':
        return { label: 'Cancelled', class: 'bg-gray-100 text-gray-600 border-gray-200' };
      default:
        return { label: status, class: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  const hasBookingDatePassed = (b) => new Date(b.datetime) <= new Date();

  const canReview = (b) =>
    !isEngineer &&
    ['accepted', 'completed'].includes(b.status) &&
    !b.review &&
    hasBookingDatePassed(b);

  const handleSubmitReview = async (bookingId) => {
    setSubmittingReview(true);
    setReviewError('');
    try {
      const res = await apiFetch('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          booking_id: bookingId,
          rating: reviewRating,
          comment: reviewComment.trim() || undefined,
        }),
      });
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, review: res.review } : b))
      );
      setReviewingBookingId(null);
      setReviewRating(5);
      setReviewComment('');
    } catch (e) {
      setReviewError(e.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <p className="text-gray-600">Log in to see your bookings.</p>
        <Link to="/login" className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Log in
        </Link>
      </div>
    );
  }

  const isEngineer = profile?.role === 'engineer';

  const filteredBookings =
    filter === 'all'
      ? bookings
      : bookings.filter((b) => b.status === filter);

  const tabs = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          {isEngineer ? 'Incoming & your bookings' : 'My bookings'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {isEngineer
            ? 'Review and manage consultation requests.'
            : 'View and manage your scheduled consultations.'}
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Filter tabs */}
      {bookings.length > 0 && (
        <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1">
          {tabs.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                filter === value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <Calendar className="h-7 w-7 text-gray-400" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            {bookings.length === 0 ? 'No bookings yet' : 'No matching bookings'}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
            {bookings.length === 0 && profile?.role === 'client' ? (
              <>
                Book a consultation with an engineer to get started.{' '}
                <Link to="/engineers" className="font-medium text-primary hover:underline">
                  Browse engineers
                </Link>
              </>
            ) : (
              'Try another filter or check back later.'
            )}
          </p>
          {bookings.length === 0 && profile?.role === 'client' && (
            <Link
              to="/engineers"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Browse engineers
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-4">
          {filteredBookings.map((b) => {
            const status = statusConfig(b.status);
            const name = isEngineer ? b.client_name : b.engineer_name;
            const otherId = isEngineer ? b.client_id : b.engineer_id;

            return (
              <li
                key={b.id}
                className="rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.class}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 shrink-0" />
                          {formatDate(b.datetime)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          {formatTime(b.datetime)}
                        </span>
                        {(b.duration_hours != null || b.amount != null) && (
                          <span className="flex items-center gap-1.5">
                            {b.duration_hours != null && (() => {
                              const h = Number(b.duration_hours);
                              if (h < 1) return `${Math.round(h * 60)} min`;
                              if (h < 24) return `${h} hr${h !== 1 ? 's' : ''}`;
                              const d = (h / 24).toFixed(1);
                              return `${d} day${d === '1' ? '' : 's'}`;
                            })()}
                            {b.amount != null && ` · $${Number(b.amount).toFixed(2)}`}
                          </span>
                        )}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        {b.zoom_link && b.status === 'accepted' && (
                          <a
                            href={b.zoom_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                          >
                            <Video className="h-4 w-4" />
                            Join Zoom
                          </a>
                        )}
                        <Link
                          to={`/chat/${otherId}`}
                          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Message
                        </Link>
                        {canReview(b) && reviewingBookingId !== b.id && (
                          <button
                            type="button"
                            onClick={() => setReviewingBookingId(b.id)}
                            className="inline-flex items-center gap-2 rounded-lg border border-primary bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20"
                          >
                            <Star className="h-4 w-4" />
                            Leave review
                          </button>
                        )}
                      </div>
                      {b.review && (
                        <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                          <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                          Your review: {b.review.rating}/5
                          {b.review.comment && ` – ${b.review.comment}`}
                        </div>
                      )}
                      {canReview(b) && reviewingBookingId === b.id && (
                        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
                          {reviewError && (
                            <p className="text-sm text-red-600">{reviewError}</p>
                          )}
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Rating</label>
                            <select
                              value={reviewRating}
                              onChange={(e) => setReviewRating(Number(e.target.value))}
                              className="mt-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary"
                            >
                              {[1, 2, 3, 4, 5].map((n) => (
                                <option key={n} value={n}>{n} star{n > 1 ? 's' : ''}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Comment (optional)</label>
                            <textarea
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              rows={2}
                              className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary"
                              placeholder="How did it go?"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleSubmitReview(b.id)}
                              disabled={submittingReview}
                              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                            >
                              {submittingReview ? 'Submitting…' : 'Submit review'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setReviewingBookingId(null);
                                setReviewError('');
                              }}
                              className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Engineer: accept/reject/reschedule/cancel + zoom + duration for pending */}
                    {isEngineer && b.status === 'pending' && (
                      <div className="shrink-0 space-y-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4 sm:w-92">
                        <label className="block text-xs font-medium text-amber-900">Consultation duration</label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min={durationUnit[b.id] === 'days' ? 1 : 0.25}
                            max={durationUnit[b.id] === 'days' ? 30 : 720}
                            step={durationUnit[b.id] === 'days' ? 1 : 0.25}
                            value={
                              durationValue[b.id] ??
                              (b.duration_hours != null
                                ? (b.duration_hours >= 24
                                  ? String(Math.round((b.duration_hours / 24) * 100) / 100)
                                  : String(b.duration_hours))
                                : '1')
                            }
                            onChange={(e) => setDurationValue((d) => ({ ...d, [b.id]: e.target.value }))}
                            className="w-24 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                          />
                          <select
                            value={
                              durationUnit[b.id] ??
                              (b.duration_hours != null && b.duration_hours >= 24 ? 'days' : 'hours')
                            }
                            onChange={(e) => setDurationUnit((d) => ({ ...d, [b.id]: e.target.value }))}
                            className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                          >
                            <option value="hours">Hours</option>
                            <option value="days">Days</option>
                          </select>
                        </div>
                        <p className="text-xs text-amber-800/80">Client requested duration above; you can change or add more. Amount from your hourly rate.</p>
                        <label className="block text-xs font-medium text-amber-900">Zoom link (optional)</label>
                        <input
                          type="url"
                          placeholder="https://zoom.us/j/…"
                          value={zoomLinks[b.id] ?? ''}
                          onChange={(e) => setZoomLinks((z) => ({ ...z, [b.id]: e.target.value }))}
                          className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                        />
                        {reschedulingBookingId !== b.id ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleAccept(b.id)}
                              disabled={actionLoading === b.id}
                              className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 min-w-0"
                            >
                              {actionLoading === b.id ? '…' : 'Accept'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReject(b.id)}
                              disabled={rejecting === b.id}
                              className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              {rejecting === b.id ? '…' : 'Reject'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setReschedulingBookingId(b.id);
                                setRescheduleDatetime(toDatetimeLocal(b.datetime));
                              }}
                              className="rounded-lg border border-primary bg-primary/10 px-3 py-2 text-sm font-medium text-black hover:bg-primary/20"
                              title="Suggest a different date/time to the client"
                            >
                              Reschedule
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancel(b.id)}
                              disabled={cancelling === b.id}
                              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                              title="Cancel this request (e.g. something came up)"
                            >
                              {cancelling === b.id ? '…' : 'Cancel'}
                            </button>
                          </div>
                        ) : (
                          <>
                            <label className="block text-xs font-medium text-amber-900">Suggest new date & time</label>
                            <input
                              type="datetime-local"
                              value={rescheduleDatetime}
                              onChange={(e) => setRescheduleDatetime(e.target.value)}
                              min={toDatetimeLocal(new Date(Date.now() + 60 * 1000).toISOString())}
                              className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleReschedule(b.id)}
                                disabled={rescheduleSubmitting || !rescheduleDatetime.trim()}
                                className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                              >
                                {rescheduleSubmitting ? '…' : 'Confirm'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setReschedulingBookingId(null);
                                  setRescheduleDatetime('');
                                }}
                                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                              >
                                Back
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    {/* Engineer: reschedule or cancel accepted booking; set duration if missing */}
                    {isEngineer && b.status === 'accepted' && (
                      <div className="shrink-0 space-y-3 rounded-xl border border-gray-200 bg-gray-50/50 p-4 sm:w-64">
                        {reschedulingBookingId !== b.id ? (
                          <>
                            {b.duration_hours == null && (
                              settingDurationId === b.id ? (
                                <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                                  <label className="block text-xs font-medium text-amber-900">Set consultation duration</label>
                                  <div className="flex gap-2">
                                    <input
                                      type="number"
                                      min={settingDurationUnit === 'days' ? 1 : 0.25}
                                      max={settingDurationUnit === 'days' ? 30 : 720}
                                      step={settingDurationUnit === 'days' ? 1 : 0.25}
                                      value={settingDurationValue}
                                      onChange={(e) => setSettingDurationValue(e.target.value)}
                                      className="w-24 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm"
                                    />
                                    <select
                                      value={settingDurationUnit}
                                      onChange={(e) => setSettingDurationUnit(e.target.value)}
                                      className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm"
                                    >
                                      <option value="hours">Hours</option>
                                      <option value="days">Days</option>
                                    </select>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleSetDuration(b.id)}
                                      disabled={actionLoading === b.id}
                                      className="flex-1 rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                                    >
                                      {actionLoading === b.id ? '…' : 'Save'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setSettingDurationId(null)}
                                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                      Back
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => { setSettingDurationId(b.id); setSettingDurationValue('1'); setSettingDurationUnit('hours'); }}
                                  className="w-full rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
                                >
                                  Set duration (for amount)
                                </button>
                              )
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setReschedulingBookingId(b.id);
                                setRescheduleDatetime(toDatetimeLocal(b.datetime));
                              }}
                              className="w-full rounded-lg border border-primary bg-primary/10 px-3 py-2 text-sm font-medium text-black hover:bg-primary/20"
                            >
                              Reschedule
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancel(b.id)}
                              disabled={cancelling === b.id}
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                              title="Cancel this booking"
                            >
                              {cancelling === b.id ? '…' : 'Cancel booking'}
                            </button>
                          </>
                        ) : (
                          <>
                            <label className="block text-xs font-medium text-gray-700">New date & time</label>
                            <input
                              type="datetime-local"
                              value={rescheduleDatetime}
                              onChange={(e) => setRescheduleDatetime(e.target.value)}
                              min={toDatetimeLocal(new Date(Date.now() + 60 * 1000).toISOString())}
                              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleReschedule(b.id)}
                                disabled={rescheduleSubmitting || !rescheduleDatetime.trim()}
                                className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                              >
                                {rescheduleSubmitting ? '…' : 'Confirm'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setReschedulingBookingId(null);
                                  setRescheduleDatetime('');
                                }}
                                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                              >
                                Back
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
