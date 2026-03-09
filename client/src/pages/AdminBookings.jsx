import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';
import AdminDashboardLayout from '../components/AdminDashboardLayout';

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { dateStyle: 'short' }) + ' ' + d.toLocaleTimeString(undefined, { timeStyle: 'short' });
}

function formatDuration(hours) {
  if (hours == null) return '—';
  const h = Number(hours);
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 24) return `${h} hr${h !== 1 ? 's' : ''}`;
  const days = (h / 24).toFixed(1);
  return `${days} day${days === '1' ? '' : 's'}`;
}

function formatAmount(amount, hourlyRate) {
  if (amount != null && amount !== '') return `$${Number(amount).toFixed(2)}`;
  if (hourlyRate != null) return `— ($${Number(hourlyRate).toFixed(0)}/hr)`;
  return '—';
}

export default function AdminBookings() {
  const { user, profile, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile?.role !== 'admin' || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiFetch('/api/admin/bookings');
        if (!cancelled) setBookings(res.bookings || []);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, profile?.role]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading…</p>
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <p className="text-gray-600">Admin access only.</p>
        <Link to="/" className="mt-2 text-blue-600 hover:underline">Home</Link>
      </div>
    );
  }

  return (
    <AdminDashboardLayout
      profile={profile}
      user={user}
      title="Bookings"
      subtitle="All consultations with duration and amount"
    >
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-600">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Engineer</th>
                <th className="px-4 py-3 font-medium">Date & time</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No bookings yet.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-gray-900">{b.client_name || b.client_id?.slice(0, 8) || '—'}</td>
                    <td className="px-4 py-3 text-gray-900">{b.engineer_name || b.engineer_id?.slice(0, 8) || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(b.datetime)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDuration(b.duration_hours)}</td>
                    <td className="px-4 py-3 text-gray-900">{formatAmount(b.amount, b.hourly_rate)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          b.status === 'accepted' || b.status === 'completed'
                            ? 'text-green-600'
                            : b.status === 'pending'
                              ? 'text-amber-600'
                              : b.status === 'cancelled' || b.status === 'rejected'
                                ? 'text-red-600'
                                : 'text-gray-600'
                        }
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {!loading && bookings.length > 0 && (
        <p className="mt-3 text-sm text-gray-500">
          {bookings.length} booking{bookings.length !== 1 ? 's' : ''} total.
        </p>
      )}
    </AdminDashboardLayout>
  );
}
