import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';
import AdminDashboardLayout from '../components/AdminDashboardLayout';
import { Mail } from 'lucide-react';

export default function AdminContact() {
  const { user, profile, loading: authLoading } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile?.role !== 'admin' || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiFetch('/api/admin/contact-submissions');
        if (!cancelled) setSubmissions(res.submissions || []);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, profile?.role]);

  const formatDate = (dt) =>
    dt ? new Date(dt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '';

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
      title="Contact submissions"
      subtitle="Messages from “Send us a message”. Reply by email."
    >
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="text-gray-600">Loading…</p>
      ) : submissions.length === 0 ? (
        <p className="text-gray-500">No contact submissions yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Client / Engineer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Message
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Reply
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {submissions.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                      {s.name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {s.email}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                      {s.role === 'client' ? 'Client' : s.role === 'engineer' ? 'Engineer' : '—'}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-sm text-gray-700">
                      <span className="line-clamp-2" title={s.message}>
                        {s.message}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                      {formatDate(s.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <a
                        href={`mailto:${encodeURIComponent(s.email)}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <Mail className="h-4 w-4" />
                        Reply by email
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminDashboardLayout>
  );
}
