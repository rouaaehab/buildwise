import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';
import { uploadAvatar } from '../lib/uploadAvatar';
import AdminDashboardLayout from '../components/AdminDashboardLayout';

export default function AdminDashboard() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [overview, setOverview] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileForm, setProfileForm] = useState({ name: '', avatar_url: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name ?? '',
        avatar_url: profile.avatar_url ?? '',
      });
    }
  }, [profile?.name, profile?.avatar_url]);

  useEffect(() => {
    if (profile?.role !== 'admin' || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [overviewRes, reviewsRes] = await Promise.all([
          apiFetch('/api/admin/overview'),
          apiFetch('/api/admin/reviews'),
        ]);
        if (!cancelled) {
          setOverview(overviewRes);
          setReviews(reviewsRes.reviews || []);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, profile?.role]);

  const handleDeleteReview = async (reviewId) => {
    setError('');
    try {
      await apiFetch(`/api/admin/reviews/${reviewId}`, { method: 'DELETE' });
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (e) {
      setError(e.message);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setAvatarUploading(true);
    setError('');
    try {
      const url = await uploadAvatar(user.id, file);
      setProfileForm((f) => ({ ...f, avatar_url: url }));
      await apiFetch('/api/profile', { method: 'PUT', body: JSON.stringify({ avatar_url: url }) });
      await refreshProfile();
      setProfileSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setError('');
    setProfileSuccess(false);
    try {
      await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: profileForm.name?.trim() || null,
          avatar_url: profileForm.avatar_url?.trim() || null,
        }),
      });
      await refreshProfile();
      setProfileSuccess(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setProfileSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading…</p>
      </div>
    );
  }

  if (!user || profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <p className="text-gray-600">Admin access only.</p>
        <Link to="/" className="mt-2 text-blue-600 hover:underline">Home</Link>
      </div>
    );
  }

  return (
    <AdminDashboardLayout profile={profile} user={user}>
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-gray-600">Loading…</p>
      ) : (
        <div className="space-y-8">
          {overview && (
            <section className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-2xl font-bold text-gray-900">{overview.users}</p>
                <p className="mt-0.5 text-sm text-gray-500">Users</p>
                <Link to="/dashboard/admin/users" className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline">View all</Link>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-2xl font-bold text-gray-900">{overview.engineers}</p>
                <p className="mt-0.5 text-sm text-gray-500">Engineers</p>
                <Link to="/dashboard/admin/users" className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline">View all</Link>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-2xl font-bold text-gray-900">{overview.bookings}</p>
                <p className="mt-0.5 text-sm text-gray-500">Bookings</p>
                <Link to="/dashboard/admin/bookings" className="mt-2 inline-block text-sm font-medium text-blue-600 hover:underline">View all</Link>
              </div>
            </section>
          )}

          <section id="settings" className="scroll-mt-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Profile & settings</h2>
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-gray-100 ring-2 ring-gray-200">
                  {profileForm.avatar_url ? (
                    <img
                      src={profileForm.avatar_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-gray-400">
                      {(profileForm.name || user?.email || 'A').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{profileForm.name || 'Admin'}</h3>
                  <p className="mt-0.5 text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
              <form onSubmit={saveProfile} className="space-y-4">
                {profileSuccess && (
                  <p className="text-sm text-emerald-600">Profile updated. Name and photo will update in the sidebar and across the app.</p>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Admin Name"
                    className="w-full max-w-md rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profile photo</label>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={avatarUploading}
                      className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                      {avatarUploading ? 'Uploading…' : 'Upload photo'}
                    </button>
                    <span className="text-xs text-gray-500">JPEG, PNG, GIF or WebP, max 2MB</span>
                  </div>
                  <input
                    type="url"
                    value={profileForm.avatar_url}
                    onChange={(e) => setProfileForm((f) => ({ ...f, avatar_url: e.target.value }))}
                    placeholder="Or paste image URL"
                    className="mt-2 w-full max-w-md rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-slate-600 focus:ring-1 focus:ring-slate-600"
                  />
                </div>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  {profileSaving ? 'Saving…' : 'Save profile'}
                </button>
              </form>
            </div>
          </section>

          <section id="reviews" className="scroll-mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent reviews (moderation)</h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-gray-500">No reviews yet.</p>
            ) : (
              <ul className="space-y-4">
                {reviews.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-amber-600">★ {r.rating}/5</p>
                      {r.comment && <p className="mt-0.5 text-sm text-gray-700">{r.comment}</p>}
                      <p className="mt-1 text-xs text-gray-400">
                        {r.client_name} → {r.engineer_name} · {new Date(r.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteReview(r.id)}
                      className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
                    >
                      Delete
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
