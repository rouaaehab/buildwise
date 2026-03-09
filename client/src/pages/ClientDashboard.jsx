import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';
import { uploadAvatar } from '../lib/uploadAvatar';
import ClientDashboardLayout from '../components/ClientDashboardLayout';
import { Calendar, MessageCircle, Video, ChevronRight, Users } from 'lucide-react';

function formatDate(dt) {
  return new Date(dt).toLocaleDateString(undefined, { dateStyle: 'medium' });
}
function formatTime(dt) {
  return new Date(dt).toLocaleTimeString(undefined, { timeStyle: 'short' });
}
function formatDateTime(dt) {
  return new Date(dt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function ClientDashboard() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileForm, setProfileForm] = useState({ name: '', avatar_url: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);

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

  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name ?? '',
        avatar_url: profile.avatar_url ?? '',
      });
    }
  }, [profile?.name, profile?.avatar_url]);

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

  const { stats, upcoming, nextBooking } = useMemo(() => {
    const list = bookings || [];
    const pending = list.filter((b) => b.status === 'pending').length;
    const accepted = list.filter((b) => b.status === 'accepted').length;
    const completed = list.filter((b) => b.status === 'completed').length;
    const upcomingList = [...list]
      .filter((b) => ['pending', 'accepted'].includes(b.status))
      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
      .slice(0, 5);
    const next = upcomingList[0] || null;
    return {
      stats: {
        bookings: list.length,
        pending,
        accepted,
        completed,
      },
      upcoming: upcomingList,
      nextBooking: next,
    };
  }, [bookings]);

  const topAction = (
    <Link
      to="/engineers"
      className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-gray-800"
    >
      <Users className="h-4 w-4" />
      Book a consultation
    </Link>
  );

  const rightSidebar = (
    <div className="rounded-2xl border border-gray-200/80 bg-[#fafaf9] p-5 shadow-sm">
      <h3 className="text-base font-bold text-indigo-900">Upcoming</h3>
      <div className="mt-4 space-y-4">
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-gray-500">No upcoming consultations.</p>
        ) : (
          upcoming.map((b) => (
            <div key={b.id} className="border-l-4 border-indigo-500 pl-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Consultation</p>
              <p className="text-sm font-bold text-indigo-900">{b.engineer_name}</p>
              <p className="text-xs text-gray-600 mt-0.5">
                {formatDate(b.datetime)} · {formatTime(b.datetime)}
              </p>
              <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                b.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {b.status}
              </span>
              <Link to={`/chat/${b.engineer_id}`} className="mt-1 inline-block text-xs text-indigo-600 hover:underline">
                Message
              </Link>
            </div>
          ))
        )}
      </div>
      {!loading && bookings.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200/80">
          <Link
            to="/bookings"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-700 hover:text-indigo-900"
          >
            View all bookings
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </div>
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-gray-600">Please log in.</p>
        <Link to="/login" className="ml-2 text-primary hover:underline">Log in</Link>
      </div>
    );
  }
  if (profile?.role === 'engineer') {
    return <Navigate to="/dashboard/engineer" replace />;
  }
  if (profile?.role === 'admin') {
    return <Navigate to="/dashboard/admin" replace />;
  }
  if (profile?.role !== 'client') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-gray-600">This dashboard is for clients.</p>
        <Link to="/" className="ml-2 text-primary hover:underline">Go home</Link>
      </div>
    );
  }

  return (
    <ClientDashboardLayout
      profile={profile}
      user={user}
      stats={stats}
      topAction={topAction}
      rightSidebar={rightSidebar}
    >
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pending</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{stats.accepted}</p>
              <p className="text-sm text-gray-500">Accepted</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
              <p className="text-sm text-gray-500">Completed</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{stats.bookings}</p>
              <p className="text-sm text-gray-500">Total bookings</p>
            </div>
          </div>

          {/* Next consultation */}
          {nextBooking && (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-gray-900">Next consultation</h2>
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{nextBooking.engineer_name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDateTime(nextBooking.datetime)}
                    </p>
                    <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      nextBooking.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {nextBooking.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {nextBooking.status === 'accepted' && nextBooking.zoom_link && (
                      <a
                        href={nextBooking.zoom_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                      >
                        <Video className="h-4 w-4" />
                        Join Zoom
                      </a>
                    )}
                    <Link
                      to={`/chat/${nextBooking.engineer_id}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Message
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Quick actions */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Quick actions</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                to="/engineers"
                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Book a consultation</p>
                  <p className="text-sm text-gray-500">Find an engineer and schedule a session</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
              </Link>
              <Link
                to="/bookings"
                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
                  <Calendar className="h-6 w-6 text-amber-700" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">My bookings</p>
                  <p className="text-sm text-gray-500">View and manage your consultations</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
              </Link>
              <Link
                to="/chat"
                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                  <MessageCircle className="h-6 w-6 text-emerald-700" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Messages</p>
                  <p className="text-sm text-gray-500">Chat with your engineers</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
              </Link>
            </div>
          </section>

          {/* Profile & image (Settings) */}
          <section id="settings" className="scroll-mt-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Profile</h2>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="shrink-0">
                  <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-200 border-2 border-gray-100">
                    {profileForm.avatar_url ? (
                      <img
                        src={profileForm.avatar_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-3xl font-bold text-gray-400">
                        {(profileForm.name || user?.email || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-bold text-gray-900">
                    {profileForm.name || 'Your name'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="font-medium text-gray-900 mb-3">Edit your profile</h3>
              <form onSubmit={saveProfile} className="space-y-4">
                {profileSuccess && (
                  <p className="text-sm text-emerald-600">Profile updated. Your name and photo are updated across the app.</p>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Jane Smith"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary"
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
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={avatarUploading}
                      className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {profileSaving ? 'Saving…' : 'Save profile'}
                </button>
              </form>
            </div>
          </section>
        </div>
      )}
    </ClientDashboardLayout>
  );
}
