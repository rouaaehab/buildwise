import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';
import AdminDashboardLayout from '../components/AdminDashboardLayout';

export default function AdminAdmins() {
  const { user, profile, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    if (profile?.role !== 'admin' || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiFetch('/api/admin/users');
        if (!cancelled) setUsers(res.users || []);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, profile?.role]);

  const handleSetRole = async (userId, role) => {
    setActionLoading(userId);
    setError('');
    try {
      const res = await apiFetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      setUsers((prev) => prev.map((u) => (u.id === userId ? res.user : u)));
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const admins = users.filter((u) => u.role === 'admin');
  const nonAdmins = users.filter((u) => u.role !== 'admin');

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
      title="Admins"
      subtitle="Promote users to admin or remove admin role"
    >
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-600">Loading…</p>
      ) : (
        <div className="space-y-8">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Current admins</h2>
            {admins.length === 0 ? (
              <p className="text-sm text-gray-500">No admins yet.</p>
            ) : (
              <ul className="space-y-2">
                {admins.map((u) => (
                  <li
                    key={u.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{u.name || u.id.slice(0, 8)}</p>
                      <p className="text-xs text-gray-500">{u.id}</p>
                    </div>
                    {u.id !== user.id ? (
                      <button
                        onClick={() => handleSetRole(u.id, 'client')}
                        disabled={actionLoading === u.id}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        Remove admin
                      </button>
                    ) : (
                      <span className="text-sm text-gray-500">(you)</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Make admin</h2>
            <p className="mb-4 text-sm text-gray-500">
              Select a user below to grant them admin access. They will be able to manage users and content.
            </p>
            {nonAdmins.length === 0 ? (
              <p className="text-sm text-gray-500">All users are already admins or there are no other users.</p>
            ) : (
              <ul className="space-y-2">
                {nonAdmins.map((u) => (
                  <li
                    key={u.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{u.name || u.id.slice(0, 8)}</p>
                      <p className="text-xs text-gray-500 capitalize">{u.role}</p>
                    </div>
                    <button
                      onClick={() => handleSetRole(u.id, 'admin')}
                      disabled={actionLoading === u.id}
                      className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                    >
                      Make admin
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </AdminDashboardLayout>
  );
}
