import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';
import { uploadAvatar } from '../lib/uploadAvatar';
import { uploadProjectImage } from '../lib/uploadProjectImage';
import { uploadCertificateDocument } from '../lib/uploadCertificateDocument';
import EngineerDashboardLayout from '../components/EngineerDashboardLayout';
import { Bell, MoreHorizontal, MapPin, Briefcase, Star } from 'lucide-react';
import { effectiveBookingStatus } from '../lib/bookingStatus';

function formatDateLong(dt) {
  return new Date(dt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatTime(dt) {
  return new Date(dt).toLocaleTimeString(undefined, { timeStyle: 'short' });
}
function formatDateTime(dt) {
  return new Date(dt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
function isToday(dt) {
  const d = new Date(dt);
  const t = new Date();
  return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
}

const CALENDAR_STATUS_STYLES = {
  pending: { border: 'border-l-amber-500', badge: 'bg-amber-100 text-amber-800', label: 'Pending' },
  accepted: { border: 'border-l-emerald-500', badge: 'bg-emerald-100 text-emerald-800', label: 'Accepted' },
  completed: { border: 'border-l-slate-400', badge: 'bg-slate-100 text-slate-700', label: 'Completed' },
};

export default function EngineerDashboard() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [engineerProfile, setEngineerProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [profileForm, setProfileForm] = useState({
    name: '', avatar_url: '', profession: '', location: '',
    bio: '', skills: '', experience_years: '', availability: '', hourly_rate: '',
  });
  const [projectForm, setProjectForm] = useState({
    title: '', description: '', media_url: '',
    category: '', location: '', year_completed: '', duration: '', budget_range: '',
  });
  const PROJECT_CATEGORIES = ['Residential', 'Commercial', 'Industrial', 'Infrastructure', 'Mixed-use', 'Other'];
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProjectId, setDeletingProjectId] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef(null);
  const [projectImageUploading, setProjectImageUploading] = useState(false);
  const projectImageInputRef = useRef(null);
  const [certificateDocUploading, setCertificateDocUploading] = useState(false);
  const certificateDocInputRef = useRef(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState(null);
  const [deletingCertificateId, setDeletingCertificateId] = useState(null);
  const [certificateForm, setCertificateForm] = useState({
    name: '', issuing_organization: '', issue_date: '', expiry_date: '',
    credential_id: '', document_url: '',
  });
  const [certificateSaving, setCertificateSaving] = useState(false);
  const [certificateError, setCertificateError] = useState('');

  useEffect(() => {
    if (profile?.role !== 'engineer' || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [profileRes, projectsRes, bookingsRes, certRes] = await Promise.all([
          apiFetch('/api/engineer/profile'),
          apiFetch('/api/engineer/projects'),
          apiFetch('/api/bookings'),
          apiFetch('/api/engineer/certificates').catch(() => ({ certificates: [] })),
        ]);
        if (!cancelled) {
          setEngineerProfile(profileRes.profile || null);
          setProjects(projectsRes.projects || []);
          setBookings(bookingsRes.bookings || []);
          setCertificates(certRes.certificates || []);
          setProfileForm((prev) => {
            const fromProfile = {
              name: profile?.name ?? prev.name,
              avatar_url: profile?.avatar_url ?? prev.avatar_url,
            };
            if (!profileRes.profile) return { ...prev, ...fromProfile };
            const p = profileRes.profile;
            return {
              ...fromProfile,
              profession: p.profession || '',
              location: p.location || '',
              bio: p.bio || '',
              skills: Array.isArray(p.skills) ? p.skills.join(', ') : '',
              experience_years: p.experience_years ?? '',
              availability: p.availability || '',
              hourly_rate: p.hourly_rate != null ? String(p.hourly_rate) : '',
            };
          });
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid refetch on every new `user` ref (token refresh)
  }, [user?.id, profile?.role, profile?.name, profile?.avatar_url]);

  const { stats, todayTasks, upcoming, upcomingByDate, activeBookings } = useMemo(() => {
    const list = bookings || [];
    const pending = list.filter((b) => effectiveBookingStatus(b) === 'pending').length;
    const accepted = list.filter((b) => effectiveBookingStatus(b) === 'accepted').length;
    const completed = list.filter((b) => effectiveBookingStatus(b) === 'completed').length;
    const today = list.filter((b) => isToday(b.datetime));
    const sorted = [...list]
      .filter((b) => ['pending', 'accepted'].includes(effectiveBookingStatus(b)))
      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    const next = sorted.slice(0, 14);
    const byDate = {};
    next.forEach((b) => {
      const key = formatDateLong(b.datetime);
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(b);
    });
    return {
      stats: {
        consultations: list.length,
        pending,
        accepted,
        completed,
      },
      todayTasks: today,
      upcoming: sorted.slice(0, 7),
      upcomingByDate: Object.entries(byDate),
      activeBookings: list.filter((b) => effectiveBookingStatus(b) === 'accepted'),
    };
  }, [bookings]);

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
    } catch (err) {
      setError(err.message);
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const handleProjectImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setProjectImageUploading(true);
    setError('');
    try {
      const url = await uploadProjectImage(user.id, file);
      setProjectForm((f) => ({ ...f, media_url: url }));
    } catch (err) {
      setError(err.message);
    } finally {
      setProjectImageUploading(false);
      e.target.value = '';
    }
  };

  const handleCertificateDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setCertificateDocUploading(true);
    setCertificateError('');
    try {
      const url = await uploadCertificateDocument(user.id, file);
      setCertificateForm((f) => ({ ...f, document_url: url }));
    } catch (err) {
      setCertificateError(err.message);
    } finally {
      setCertificateDocUploading(false);
      e.target.value = '';
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const skillsArr = profileForm.skills
        ? profileForm.skills.split(',').map((s) => s.trim()).filter(Boolean)
        : [];
      await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name: profileForm.name?.trim() || null,
          avatar_url: profileForm.avatar_url?.trim() || null,
        }),
      });
      const res = await apiFetch('/api/engineer/profile', {
        method: 'PUT',
        body: JSON.stringify({
          bio: profileForm.bio || null,
          skills: skillsArr,
          experience_years: profileForm.experience_years ? parseInt(profileForm.experience_years, 10) : null,
          availability: profileForm.availability || null,
          profession: profileForm.profession?.trim() || null,
          location: profileForm.location?.trim() || null,
          hourly_rate: profileForm.hourly_rate !== '' && profileForm.hourly_rate != null
            ? parseFloat(profileForm.hourly_rate, 10)
            : null,
        }),
      });
      setEngineerProfile(res.profile);
      await refreshProfile();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const emptyProjectForm = () => ({
    title: '', description: '', media_url: '',
    category: '', location: '', year_completed: '', duration: '', budget_range: '',
  });

  const addProject = async (e) => {
    e.preventDefault();
    if (!projectForm.title.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch('/api/engineer/projects', {
        method: 'POST',
        body: JSON.stringify({
          title: projectForm.title.trim(),
          description: projectForm.description?.trim() || null,
          media_url: projectForm.media_url?.trim() || null,
          category: projectForm.category?.trim() || null,
          location: projectForm.location?.trim() || null,
          year_completed: projectForm.year_completed?.trim() || null,
          duration: projectForm.duration?.trim() || null,
          budget_range: projectForm.budget_range?.trim() || null,
        }),
      });
      setProjects((prev) => [res.project, ...prev]);
      setProjectForm(emptyProjectForm());
      setShowProjectForm(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const updateProject = async (e) => {
    e.preventDefault();
    if (!editingProject || !projectForm.title.trim()) return;
    setSaving(true);
    setError('');
    try {
      const res = await apiFetch(`/api/engineer/projects/${editingProject.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: projectForm.title.trim(),
          description: projectForm.description?.trim() || null,
          media_url: projectForm.media_url?.trim() || null,
          category: projectForm.category?.trim() || null,
          location: projectForm.location?.trim() || null,
          year_completed: projectForm.year_completed?.trim() || null,
          duration: projectForm.duration?.trim() || null,
          budget_range: projectForm.budget_range?.trim() || null,
        }),
      });
      setProjects((prev) => prev.map((p) => (p.id === res.project.id ? res.project : p)));
      setEditingProject(null);
      setProjectForm(emptyProjectForm());
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async (id) => {
    if (!confirm('Remove this project?')) return;
    setError('');
    setDeletingProjectId(id);
    try {
      await apiFetch(`/api/engineer/projects/${id}`, { method: 'DELETE' });
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setError(e.message || 'Failed to delete project');
    } finally {
      setDeletingProjectId(null);
    }
  };

  const startEdit = (project) => {
    setEditingProject(project);
    setProjectForm({
      title: project.title || '',
      description: project.description || '',
      media_url: project.media_url || '',
      category: project.category || '',
      location: project.location || '',
      year_completed: project.year_completed || '',
      duration: project.duration || '',
      budget_range: project.budget_range || '',
    });
  };

  const cancelProjectForm = () => {
    setShowProjectForm(false);
    setEditingProject(null);
    setProjectForm(emptyProjectForm());
  };

  const emptyCertificateForm = () => ({
    name: '', issuing_organization: '', issue_date: '', expiry_date: '', credential_id: '', document_url: '',
  });

  const startEditCertificate = (cert) => {
    setEditingCertificate(cert);
    setCertificateForm({
      name: cert.name || '',
      issuing_organization: cert.issuing_organization || '',
      issue_date: cert.issue_date || '',
      expiry_date: cert.expiry_date || '',
      credential_id: cert.credential_id || '',
      document_url: cert.document_url || '',
    });
    setCertificateError('');
    setShowCertificateModal(true);
  };

  const closeCertificateModal = () => {
    setShowCertificateModal(false);
    setEditingCertificate(null);
    setCertificateForm(emptyCertificateForm());
    setCertificateError('');
  };

  const submitCertificate = async (e) => {
    e.preventDefault();
    if (!certificateForm.name?.trim() || !certificateForm.issuing_organization?.trim() || !certificateForm.issue_date) {
      setCertificateError('Certificate name, issuing organization, and issue date are required.');
      return;
    }
    setCertificateSaving(true);
    setCertificateError('');
    const payload = {
      name: certificateForm.name.trim(),
      issuing_organization: certificateForm.issuing_organization.trim(),
      issue_date: certificateForm.issue_date,
      expiry_date: certificateForm.expiry_date || null,
      credential_id: certificateForm.credential_id?.trim() || null,
      document_url: certificateForm.document_url?.trim() || null,
    };
    try {
      if (editingCertificate) {
        const res = await apiFetch(`/api/engineer/certificates/${editingCertificate.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setCertificates((prev) => prev.map((c) => (c.id === res.certificate.id ? res.certificate : c)));
      } else {
        const res = await apiFetch('/api/engineer/certificates', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setCertificates((prev) => [res.certificate, ...prev]);
      }
      closeCertificateModal();
    } catch (e) {
      setCertificateError(e.message);
    } finally {
      setCertificateSaving(false);
    }
  };

  const deleteCertificate = async (id) => {
    if (!confirm('Remove this certificate?')) return;
    setError('');
    setDeletingCertificateId(id);
    try {
      await apiFetch(`/api/engineer/certificates/${id}`, { method: 'DELETE' });
      setCertificates((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      setError(e.message || 'Failed to delete certificate');
    } finally {
      setDeletingCertificateId(null);
    }
  };

  if (authLoading || (profile?.role !== 'engineer' && user)) {
    if (user && profile?.role !== 'engineer') {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <p className="text-gray-600">
            Only engineers can access this page. <Link to="/" className="text-blue-600 hover:underline">Go home</Link>
          </p>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <p className="text-gray-600">Please log in.</p>
        <Link to="/login" className="ml-2 text-blue-600 hover:underline">Log in</Link>
      </div>
    );
  }

  const topAction = (
    <Link
      to="/bookings"
      className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow hover:bg-gray-800"
    >
      View booking requests
    </Link>
  );

  const rightSidebar = (
    <div className="rounded-2xl border border-gray-200/80 bg-[#fafaf9] p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-indigo-900">Calendar</h3>
      </div>
      <div className="mt-2 flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-1 w-3 rounded-full bg-amber-500" aria-hidden />
          <span className="text-gray-600">Pending</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1 w-3 rounded-full bg-emerald-500" aria-hidden />
          <span className="text-gray-600">Accepted</span>
        </span>
      </div>

      <div className="mt-5 space-y-6">
        {loading ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : upcomingByDate.length === 0 ? (
          <p className="text-sm text-gray-500">No upcoming sessions.</p>
        ) : (
          upcomingByDate.map(([dateLabel, events]) => (
            <div key={dateLabel}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-indigo-700/80">{dateLabel}</p>
                <button type="button" className="text-gray-400 hover:text-gray-600" aria-label="More options">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
              <ul className="mt-3 space-y-4">
                {events.map((b) => {
                  const eff = effectiveBookingStatus(b);
                  const style = CALENDAR_STATUS_STYLES[eff] || CALENDAR_STATUS_STYLES.pending;
                  return (
                    <li key={b.id} className="flex gap-3">
                      <span className="text-sm font-bold text-indigo-900 tabular-nums">{formatTime(b.datetime)}</span>
                      <div className={`min-h-[2.5rem] border-l-4 pl-3 ${style.border}`}>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Consultation</p>
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${style.badge}`}>
                            {style.label}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-indigo-900">{b.client_name}</p>
                        <Link to={`/chat/${b.client_id}`} className="mt-0.5 inline-block text-xs text-indigo-600 hover:underline">
                          Message
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </div>

      {!loading && upcoming.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200/80">
          <Link
            to="/bookings"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-700 hover:text-indigo-900"
          >
            View all bookings
          </Link>
        </div>
      )}
    </div>
  );

  // Merge so layout always gets name + avatar_url from profiles table; engineer fields from engineer_profiles.
  // Otherwise engineerProfile (no name/avatar) would replace profile and revert greeting/sidebar to email/initials.
  const layoutProfile = engineerProfile
    ? { ...(profile || {}), ...engineerProfile }
    : (profile || null);

  return (
    <EngineerDashboardLayout
      profile={layoutProfile}
      user={user}
      stats={stats}
      topAction={topAction}
      rightSidebar={rightSidebar}
    >
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="text-gray-600">Loading…</p>
      ) : (
        <div className="space-y-8">
          {/* Stat widgets */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-sm text-gray-500">Pending requests</p>
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
              <p className="text-2xl font-bold text-gray-900">{stats.consultations}</p>
              <p className="text-sm text-gray-500">Total consultations</p>
            </div>
          </div>

          {/* Active consultations cards */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Active consultations</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeBookings.length === 0 ? (
                <p className="col-span-full text-sm text-gray-500">No active sessions. Accepted bookings will appear here.</p>
              ) : (
                activeBookings.map((b) => (
                  <div
                    key={b.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900">{b.client_name}</p>
                        <p className="text-sm text-gray-500">{formatDateTime(b.datetime)}</p>
                      </div>
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        Accepted
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      {b.zoom_link && (
                        <a
                          href={b.zoom_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-black hover:underline"
                        >
                          Join Zoom
                        </a>
                      )}
                      <Link to={`/chat/${b.client_id}`} className="text-sm text-black px-4 hover:underline">
                        Message
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Tasks for today */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-gray-900">Tasks for today</h2>
            <ul className="space-y-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              {todayTasks.length === 0 ? (
                <li className="text-sm text-gray-500">No sessions scheduled for today.</li>
              ) : (
                todayTasks.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center gap-3 border-l-4 border-primary/60 py-2 pl-3"
                  >
                    <span className="flex-1 font-medium text-gray-900">
                      {formatTime(b.datetime)} – {b.client_name}
                    </span>
                    <Link to={`/chat/${b.client_id}`} className="text-sm text-primary hover:underline">
                      Message
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </section>

          {/* Profile & portfolio (Settings section) */}
          <section id="settings" className="scroll-mt-6 space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Profile & portfolio</h2>

            {/* Profile preview card (demo-style) */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="shrink-0">
                  <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-200 border-2 border-gray-100">
                    {profileForm.avatar_url ? (
                      <img src={profileForm.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-3xl font-bold text-gray-400">
                        {(profileForm.name || user?.email || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{profileForm.name || 'Your name'}</h3>
                  {profileForm.profession && (
                    <p className="text-black font-medium mt-0.5">{profileForm.profession}</p>
                  )}
                  {profileForm.location && (
                    <p className="flex items-center gap-1.5 text-sm text-gray-600 mt-1">
                      <MapPin className="h-4 w-4 shrink-0" />
                      {profileForm.location}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                    {profileForm.experience_years != null && profileForm.experience_years !== '' && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-4 w-4 shrink-0" />
                        {profileForm.experience_years} years experience
                      </span>
                    )}
                    <span>{projects.length} projects</span>
                    {profileForm.hourly_rate != null && profileForm.hourly_rate !== '' && (
                      <span className="font-medium text-gray-900">
                        ${Number(profileForm.hourly_rate).toFixed(0)}/hr
                      </span>
                    )}
                    {engineerProfile?.rating != null && (
                      <span className="flex items-center gap-1 font-medium text-amber-700">
                        <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                        {Number(engineerProfile.rating).toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {profileForm.bio && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">About</h4>
                  <p className="text-sm text-gray-600">{profileForm.bio}</p>
                </div>
              )}
              {profileForm.skills && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Skills & Expertise</h4>
                  <div className="flex flex-wrap gap-2">
                    {profileForm.skills.split(',').map((s) => s.trim()).filter(Boolean).map((skill) => (
                      <span key={skill} className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-800">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="font-medium text-gray-900 mb-3">Edit your profile</h3>
              <form onSubmit={saveProfile} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Ahmed Mahmoud"
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
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={avatarUploading}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
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
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Profession</label>
                    <input
                      type="text"
                      value={profileForm.profession}
                      onChange={(e) => setProfileForm((f) => ({ ...f, profession: e.target.value }))}
                      placeholder="e.g. Architectural Engineering"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={profileForm.location}
                      onChange={(e) => setProfileForm((f) => ({ ...f, location: e.target.value }))}
                      placeholder="e.g. Alexandria, Egypt"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">About</label>
                  <textarea
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm((f) => ({ ...f, bio: e.target.value }))}
                    rows={3}
                    placeholder="Expert in…"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma-separated)</label>
                  <input
                    type="text"
                    value={profileForm.skills}
                    onChange={(e) => setProfileForm((f) => ({ ...f, skills: e.target.value }))}
                    placeholder="e.g. Building Design, Revit, 3D Modeling"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Years of experience</label>
                    <input
                      type="number"
                      min={0}
                      value={profileForm.experience_years}
                      onChange={(e) => setProfileForm((f) => ({ ...f, experience_years: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                    <input
                      type="text"
                      value={profileForm.availability}
                      onChange={(e) => setProfileForm((f) => ({ ...f, availability: e.target.value }))}
                      placeholder="e.g. Mon–Fri 9–5"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hourly rate (RM)</label>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={profileForm.hourly_rate}
                      onChange={(e) => setProfileForm((f) => ({ ...f, hourly_rate: e.target.value }))}
                      placeholder="e.g. 140"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {saving ? 'Saving…' : 'Save profile'}
                </button>
              </form>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Portfolio projects</h3>
                {!showProjectForm && !editingProject && (
                  <button
                    type="button"
                    onClick={() => setShowProjectForm(true)}
                    className="text-sm text-black hover:underline"
                  >
                    + Add project
                  </button>
                )}
              </div>

              {(showProjectForm || editingProject) && (
                <form
                  onSubmit={editingProject ? updateProject : addProject}
                  className="mb-4 rounded-xl border border-gray-200 bg-gray-50/50 p-5 space-y-4"
                >
                  <h4 className="font-medium text-gray-900">{editingProject ? 'Edit project' : 'Upload new project'}</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project title *</label>
                    <input
                      type="text"
                      value={projectForm.title}
                      onChange={(e) => setProjectForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="e.g., New Administrative Capital Complex"
                      required
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      value={projectForm.category}
                      onChange={(e) => setProjectForm((f) => ({ ...f, category: e.target.value }))}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary"
                    >
                      <option value="">Select category</option>
                      {PROJECT_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={projectForm.location}
                      onChange={(e) => setProjectForm((f) => ({ ...f, location: e.target.value }))}
                      placeholder="e.g., Cairo, Egypt"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project description *</label>
                    <textarea
                      value={projectForm.description}
                      onChange={(e) => setProjectForm((f) => ({ ...f, description: e.target.value }))}
                      placeholder="Describe your project, challenges faced, and solutions implemented…"
                      rows={3}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year completed</label>
                      <input
                        type="text"
                        value={projectForm.year_completed}
                        onChange={(e) => setProjectForm((f) => ({ ...f, year_completed: e.target.value }))}
                        placeholder="2024"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                      <input
                        type="text"
                        value={projectForm.duration}
                        onChange={(e) => setProjectForm((f) => ({ ...f, duration: e.target.value }))}
                        placeholder="18 months"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Budget range</label>
                      <input
                        type="text"
                        value={projectForm.budget_range}
                        onChange={(e) => setProjectForm((f) => ({ ...f, budget_range: e.target.value }))}
                        placeholder="$1M - $5M"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project image</label>
                    <input
                      ref={projectImageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      className="hidden"
                      onChange={handleProjectImageUpload}
                    />
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <button
                        type="button"
                        onClick={() => projectImageInputRef.current?.click()}
                        disabled={projectImageUploading}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {projectImageUploading ? 'Uploading…' : 'Upload image'}
                      </button>
                      <span className="text-xs text-gray-500">JPEG, PNG, GIF or WebP, max 5MB</span>
                    </div>
                    <input
                      type="url"
                      value={projectForm.media_url}
                      onChange={(e) => setProjectForm((f) => ({ ...f, media_url: e.target.value }))}
                      placeholder="Or paste image URL"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {editingProject ? 'Update' : 'Add project'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelProjectForm}
                      className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              <ul className="space-y-4">
                {projects.length === 0 && !showProjectForm && !editingProject && (
                  <li className="text-sm text-gray-500">No projects yet. Add one to showcase your work.</li>
                )}
                {projects.map((p) => (
                  <li key={p.id} className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                    <div className="flex flex-col sm:flex-row">
                      {p.media_url && (
                        <div className="sm:w-48 shrink-0 aspect-video sm:aspect-square bg-gray-100">
                          <img src={p.media_url} alt="" className="h-full w-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold text-gray-900">{p.title}</h4>
                            {p.category && (
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                                {p.category}
                              </span>
                            )}
                          </div>
                          {p.location && <p className="text-sm text-gray-600 mt-0.5">{p.location}</p>}
                          {p.description && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{p.description}</p>}
                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                            {p.year_completed && <span>{p.year_completed}</span>}
                            {p.duration && <span>{p.duration}</span>}
                            {p.budget_range && <span>{p.budget_range}</span>}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                          <button type="button" onClick={() => startEdit(p)} className="text-sm text-black hover:underline">
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteProject(p.id)}
                            disabled={deletingProjectId === p.id}
                            className="text-sm text-red-600 hover:underline disabled:opacity-50"
                          >
                            {deletingProjectId === p.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Certificates */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Certificates</h3>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCertificate(null);
                    setCertificateForm(emptyCertificateForm());
                    setCertificateError('');
                    setShowCertificateModal(true);
                  }}
                  className="text-sm text-black hover:underline"
                >
                  + Add certificate
                </button>
              </div>
              {certificates.length === 0 ? (
                <p className="text-sm text-gray-500">No certificates yet. Add one for verification.</p>
              ) : (
                <ul className="space-y-3">
                  {certificates.map((c) => {
                    const hasExt = (ext) => c.document_url && new RegExp(`\\.${ext}(\\?|$)`, 'i').test(c.document_url);
                    const isImage = hasExt('jpe?g') || hasExt('png') || hasExt('gif') || hasExt('webp');
                    const isPdf = hasExt('pdf');
                    return (
                      <li key={c.id} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        {/* Thumbnail or icon for uploaded document */}
                        <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                          {c.document_url ? (
                            isImage ? (
                              <img
                                src={c.document_url}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : isPdf ? (
                              <a href={c.document_url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-2 text-gray-500 hover:text-primary">
                                <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
                                <span className="text-[10px] mt-0.5">PDF</span>
                              </a>
                            ) : (
                              <a href={c.document_url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center p-2 text-gray-500 hover:text-primary" title="View document">
                                <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
                                <span className="text-[10px] mt-0.5">Doc</span>
                              </a>
                            )
                          ) : (
                            <span className="text-xs text-gray-400 p-2 text-center">No file</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.issuing_organization}</p>
                          {c.credential_id && <p className="text-xs text-gray-500 mt-0.5">ID: {c.credential_id}</p>}
                          <span className="mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 bg-emerald-100">
                            Verified
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {c.document_url && (
                            <a
                              href={c.document_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg border border-primary bg-primary/10 px-3 py-2 text-sm font-medium text-black hover:bg-primary/20"
                            >
                              View document
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => startEditCertificate(c)}
                            className="text-sm text-black hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCertificate(c.id)}
                            disabled={deletingCertificateId === c.id}
                            className="text-sm text-red-600 hover:underline disabled:opacity-50"
                          >
                            {deletingCertificateId === c.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          {/* Add Certificate modal */}
          {showCertificateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeCertificateModal}>
              <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-900">{editingCertificate ? 'Edit certificate' : 'Add certificate'}</h3>
                  <button type="button" onClick={closeCertificateModal} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                    ×
                  </button>
                </div>
                <form onSubmit={submitCertificate} className="p-4 space-y-4">
                  {certificateError && <p className="text-sm text-red-600">{certificateError}</p>}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Certificate name *</label>
                    <input
                      type="text"
                      value={certificateForm.name}
                      onChange={(e) => setCertificateForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g., Professional Engineer License"
                      required
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Issuing organization *</label>
                    <input
                      type="text"
                      value={certificateForm.issuing_organization}
                      onChange={(e) => setCertificateForm((f) => ({ ...f, issuing_organization: e.target.value }))}
                      placeholder="e.g., Egyptian Engineers Syndicate"
                      required
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Issue date *</label>
                      <input
                        type="date"
                        value={certificateForm.issue_date}
                        onChange={(e) => setCertificateForm((f) => ({ ...f, issue_date: e.target.value }))}
                        required
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry date (optional)</label>
                      <input
                        type="date"
                        value={certificateForm.expiry_date}
                        onChange={(e) => setCertificateForm((f) => ({ ...f, expiry_date: e.target.value }))}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Credential ID / License number (optional)</label>
                    <input
                      type="text"
                      value={certificateForm.credential_id}
                      onChange={(e) => setCertificateForm((f) => ({ ...f, credential_id: e.target.value }))}
                      placeholder="e.g., EES-2020-12345"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Certificate document</label>
                    <input
                      ref={certificateDocInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                      className="hidden"
                      onChange={handleCertificateDocUpload}
                    />
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <button
                        type="button"
                        onClick={() => certificateDocInputRef.current?.click()}
                        disabled={certificateDocUploading}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {certificateDocUploading ? 'Uploading…' : 'Upload document'}
                      </button>
                      <span className="text-xs text-gray-500">PDF or image, max 10MB</span>
                    </div>
                    <input
                      type="url"
                      value={certificateForm.document_url}
                      onChange={(e) => setCertificateForm((f) => ({ ...f, document_url: e.target.value }))}
                      placeholder="Or paste document URL"
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900"
                    />
                  </div>
                  <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
                    Certificates are posted to your profile right away so clients can see them when browsing.
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={certificateSaving}
                      className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {certificateSaving ? (editingCertificate ? 'Saving…' : 'Adding…') : (editingCertificate ? 'Save changes' : 'Add certificate')}
                    </button>
                    <button
                      type="button"
                      onClick={closeCertificateModal}
                      className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </EngineerDashboardLayout>
  );
}
