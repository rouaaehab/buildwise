import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';
import {
  MapPin,
  Briefcase,
  FolderOpen,
  Star,
  Video,
  MessageCircle,
  Check,
  Calendar,
} from 'lucide-react';

export default function EngineerProfile() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const [engineer, setEngineer] = useState(null);
  const [projects, setProjects] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [requestDatetime, setRequestDatetime] = useState('');
  const [requestDurationValue, setRequestDurationValue] = useState('1');
  const [requestDurationUnit, setRequestDurationUnit] = useState('hours');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiFetch(`/api/engineers/${id}`);
        if (!cancelled) {
          setEngineer(res.engineer);
          setProjects(res.projects || []);
          setCertificates(res.certificates || []);
          setReviews(res.reviews || []);
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Engineer not found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const handleRequestConsultation = async (e) => {
    e.preventDefault();
    if (!requestDatetime.trim()) return;
    setRequesting(true);
    setRequestError('');
    const val = Number(requestDurationValue) || 1;
    const durationHours = requestDurationUnit === 'days' ? val * 24 : val;
    if (durationHours < 0.25 || durationHours > 720) {
      setRequestError('Duration must be between 15 min and 30 days.');
      setRequesting(false);
      return;
    }
    try {
      await apiFetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          engineer_id: id,
          datetime: new Date(requestDatetime).toISOString(),
          duration_hours: durationHours,
        }),
      });
      setRequestSent(true);
      setRequestDatetime('');
      setRequestDurationValue('1');
      setRequestDurationUnit('hours');
    } catch (e) {
      setRequestError(e.message);
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !engineer) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <p className="text-gray-600">{error || 'Engineer not found'}</p>
        <Link to="/engineers" className="mt-2 text-primary font-medium hover:underline">
          ← Browse engineers
        </Link>
      </div>
    );
  }

  const reviewCount = reviews.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link
            to="/engineers"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            ← Browse engineers
          </Link>
          
        </div>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: profile + about + skills + projects + reviews */}
          <div className="lg:col-span-2 space-y-6">
            {/* Summary card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="shrink-0">
                  <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-200 ring-2 ring-white shadow">
                    {engineer.avatar_url ? (
                      <img
                        src={engineer.avatar_url}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-gray-400">
                        {(engineer.name || 'E').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {engineer.name || 'Engineer'}
                  </h1>
                  {engineer.profession && (
                    <p className="text-black font-medium mt-0.5">{engineer.profession}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                    {engineer.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                        {engineer.location}
                      </span>
                    )}
                    {engineer.experience_years != null && (
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4 shrink-0 text-gray-400" />
                        {engineer.experience_years} years experience
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <FolderOpen className="h-4 w-4 shrink-0 text-gray-400" />
                      {projects.length} projects
                    </span>
                  </div>
                  {engineer.rating != null && (
                    <p className="mt-2 flex items-center gap-1.5 font-medium text-amber-700">
                      <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                      {engineer.rating.toFixed(1)}
                      {reviewCount > 0 && (
                        <span className="text-gray-500 font-normal">
                          ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* About */}
            {engineer.bio && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">About</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{engineer.bio}</p>
              </div>
            )}

            {/* Skills */}
            {engineer.skills?.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Skills & Expertise</h2>
                <div className="flex flex-wrap gap-2">
                  {engineer.skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-800"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Certificates */}
            {certificates.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Certificates</h2>
                <ul className="space-y-3">
                  {certificates.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 bg-gray-50/50 p-3">
                      <div>
                        <p className="font-medium text-gray-900">{c.name}</p>
                        <p className="text-sm text-gray-500">{c.issuing_organization}</p>
                        {(c.issue_date || c.credential_id) && (
                          <p className="text-xs text-gray-500 mt-1">
                            {[c.issue_date && new Date(c.issue_date).toLocaleDateString(undefined, { dateStyle: 'medium' }), c.credential_id].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                      {c.document_url && (
                        <a href={c.document_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">
                          View document
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Projects */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Projects</h2>
              {projects.length === 0 ? (
                <p className="text-gray-500 text-sm">No projects listed yet.</p>
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2">
                  {projects.map((p) => (
                    <li
                      key={p.id}
                      className="overflow-hidden rounded-xl border border-gray-100 bg-gray-50"
                    >
                      {p.media_url && (
                        <div className="aspect-video bg-gray-200">
                          <img
                            src={p.media_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-medium text-gray-900">{p.title}</h3>
                        {p.category && (
                          <span className="text-xs font-medium text-gray-500">{p.category}</span>
                        )}
                        {p.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{p.description}</p>
                        )}
                        {(p.location || p.year_completed) && (
                          <p className="text-xs text-gray-500 mt-2">
                            {[p.location, p.year_completed].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Reviews from clients (same as in Admin moderation & My bookings) */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Reviews from clients
              </h2>
              {reviews.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No reviews yet. Clients can leave a review after a consultation.
                </p>
              ) : (
                <ul className="space-y-4">
                  {reviews.slice(0, 10).map((r) => (
                    <li key={r.id} className="border-l-4 border-primary/30 pl-4">
                      <div className="flex flex-wrap items-center gap-2 text-amber-600">
                        <Star className="h-4 w-4 fill-amber-500 text-amber-500 shrink-0" />
                        <span className="font-medium">{r.rating}/5</span>
                        {r.client_name && (
                          <span className="text-gray-500 font-normal text-sm">
                            — {r.client_name}
                          </span>
                        )}
                      </div>
                      {r.comment && (
                        <p className="text-gray-700 text-sm mt-1">{r.comment}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(r.created_at).toLocaleDateString(undefined, {
                          dateStyle: 'medium',
                        })}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right: pricing + CTA (match design: $/hr, Available pill, Book Consultation, Send Message) */}
          <div className="lg:col-span-1 text-center">
            <div className="sticky top-6 space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                {/* Hourly rate – large, dark */}
                {engineer.hourly_rate != null && (
                  <p className="text-3xl font-bold tracking-tight text-gray-900">
                    ${Number(engineer.hourly_rate).toFixed(0)}/hr
                  </p>
                )}
                {/* Availability – green pill with calendar icon */}
                {engineer.availability && (
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                    Available
                  </span>
                )}
                {!engineer.availability && engineer.hourly_rate != null && (
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    Check availability
                  </span>
                )}

                <div className="mt-6 space-y-3">
                  {profile?.role === 'client' && user && (
                    <>
                      {requestSent ? (
                        <p className="text-sm text-gray-600">
                          Request sent. Check{' '}
                          <Link to="/bookings" className="font-medium text-black hover:underline">
                            My bookings
                          </Link>{' '}
                          for status.
                        </p>
                      ) : (
                        <form onSubmit={handleRequestConsultation} className="space-y-3">
                          {requestError && (
                            <p className="text-sm text-red-600">{requestError}</p>
                          )}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Date & time
                            </label>
                            <input
                              type="datetime-local"
                              value={requestDatetime}
                              onChange={(e) => setRequestDatetime(e.target.value)}
                              min={new Date().toISOString().slice(0, 16)}
                              required
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Consultation duration
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                min={requestDurationUnit === 'days' ? '1' : '0.25'}
                                max={requestDurationUnit === 'days' ? '30' : '720'}
                                step={requestDurationUnit === 'days' ? '1' : '0.25'}
                                value={requestDurationValue}
                                onChange={(e) => setRequestDurationValue(e.target.value)}
                                className="w-30 rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary"
                              />
                              <select
                                value={requestDurationUnit}
                                onChange={(e) => {
                                  const newUnit = e.target.value;
                                  setRequestDurationUnit(newUnit);
                                  if (newUnit === 'days' && (Number(requestDurationValue) < 1 || !requestDurationValue)) {
                                    setRequestDurationValue('1');
                                  }
                                }}
                                  className="w-36 rounded-lg border border-gray-200 px-3 py-2 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary"
                              >
                                <option value="hours">Hours</option>
                                <option value="days">Days</option>
                              </select>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">e.g. 1 hour or 10 days (up to 30 days)</p>
                          </div>
                          <button
                            type="submit"
                            disabled={requesting}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                          >
                            <Video className="h-5 w-5" />
                            {requesting ? 'Sending…' : 'Book Consultation'}
                          </button>
                        </form>
                      )}
                      <Link
                        to={`/chat/${id}`}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-3.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                      >
                        <MessageCircle className="h-5 w-5 text-gray-600" />
                        Send Message
                      </Link>
                    </>
                  )}
                  {user && profile?.role !== 'client' && (
                    <p className="text-sm text-gray-600">
                      <Link to="/login" className="text-primary hover:underline">Log in</Link> as a
                      client to book a consultation.
                    </p>
                  )}
                  {!user && (
                    <p className="text-sm text-gray-600">
                      <Link to="/login" className="text-primary hover:underline">Log in</Link> as a
                      client to book a consultation.
                    </p>
                  )}
                </div>
              </div>

              {/* Consultation includes */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3">Consultation includes</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                    30-minute video call
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                    Project requirement analysis
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                    Expert recommendations
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                    Follow-up summary report
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
