import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';
import AdminDashboardLayout from '../components/AdminDashboardLayout';

export default function AdminUsers() {
  const { user, profile, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [search, setSearch] = useState('');

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

  const handleSuspend = async (userId, suspended) => {
    setActionLoading(userId);
    setError('');
    try {
      const res = await apiFetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({ suspended }),
      });
      setUsers((prev) => prev.map((u) => (u.id === userId ? res.user : u)));
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = search.trim()
    ? users.filter(
        (u) =>
          (u.name || '')
            .toLowerCase()
            .includes(search.trim().toLowerCase()) ||
          (u.id || '').toLowerCase().includes(search.trim().toLowerCase())
      )
    : users;

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
    <AdminDashboardLayout profile={profile} user={user} title="Users" subtitle="Manage all users and engineers">
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-4">
        <input
          type="search"
          placeholder="Search by name or ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <p className="text-gray-600">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    {search.trim() ? 'No users match your search.' : 'No users yet.'}
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-gray-900">{u.name || u.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{u.role}</td>
                    <td className="px-4 py-3">
                      {u.suspended ? (
                        <span className="text-red-600">Suspended</span>
                      ) : (
                        <span className="text-green-600">Active</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {u.id !== user.id && (
                        <button
                          onClick={() => handleSuspend(u.id, !u.suspended)}
                          disabled={actionLoading === u.id}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          {u.suspended ? 'Unsuspend' : 'Suspend'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {!loading && filtered.length > 0 && (
        <p className="mt-3 text-sm text-gray-500">
          Showing {filtered.length} of {users.length} user{users.length !== 1 ? 's' : ''}.
        </p>
      )}
    </AdminDashboardLayout>
  );
}
