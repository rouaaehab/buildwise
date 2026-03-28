import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';
import { MapPin, Briefcase, Star, ChevronRight } from 'lucide-react';

export default function BrowseEngineers() {
  const { user, profile } = useAuth();
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [minRating, setMinRating] = useState('');
  const [sort, setSort] = useState('rating');

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (minRating !== '') params.set('minRating', minRating);
    if (sort) params.set('sort', sort);

    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiFetch(`/api/engineers?${params.toString()}`);
        if (!cancelled) setEngineers(res.engineers || []);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [searchQuery, minRating, sort]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Find engineers
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Book a consultation with verified experts
              </p>
            </div>
            {user && profile?.role === 'client' && (
              <Link
                to="/dashboard/client"
                className="inline-flex items-center text-sm font-medium text-black hover:underline"
              >
                My dashboard
                <ChevronRight className="ml-0.5 h-4 w-4" />
              </Link>
            )}
          </div>

          {/* Filters */}
          <div className="mt-6 flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-gray-50/80 p-4">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Search
              </label>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Name, skill, location, bio…"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="w-32">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Min rating
              </label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="">Any</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="4.5">4.5+</option>
              </select>
            </div>
            <div className="w-40">
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                Sort by
              </label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-900 focus:border-primary focus:ring-1 focus:ring-primary"
              >
                <option value="rating">Rating</option>
                <option value="experience">Experience</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : engineers.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
            <p className="text-gray-600">No engineers found. Try adjusting your filters.</p>
          </div>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {engineers.map((eng) => (
              <li key={eng.id}>
                <Link
                  to={`/engineers/${eng.id}`}
                  className="group block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-gray-300"
                >
                  <div className="p-5 sm:p-6">
                    <div className="flex gap-4">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100 ring-2 ring-white">
                        {eng.avatar_url ? (
                          <img
                            src={eng.avatar_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xl font-bold text-gray-400">
                            {(eng.name || 'E').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="font-semibold text-gray-900 group-hover:text-primary">
                          {eng.name || 'Engineer'}
                        </h2>
                        {eng.profession && (
                          <p className="text-sm font-medium text-black mt-0.5">
                            {eng.profession}
                          </p>
                        )}
                        {eng.rating != null && (
                          <p className="mt-1 flex items-center gap-1 text-sm font-medium text-amber-700">
                            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                            {eng.rating.toFixed(1)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-gray-600">
                      {eng.location && (
                        <p className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 shrink-0 text-gray-400" />
                          {eng.location}
                        </p>
                      )}
                      {eng.experience_years != null && (
                        <p className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 shrink-0 text-gray-400" />
                          {eng.experience_years} years experience
                        </p>
                      )}
                      {eng.hourly_rate != null && (
                        <p className="font-semibold text-gray-900">
                          ${Number(eng.hourly_rate).toFixed(0)}/hr
                        </p>
                      )}
                    </div>

                    {eng.bio && (
                      <p className="mt-3 text-sm text-gray-600 line-clamp-2">{eng.bio}</p>
                    )}
                    {eng.skills?.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {eng.skills.slice(0, 4).map((s) => (
                          <span
                            key={s}
                            className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-800"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3">
                    <span className="text-sm font-medium text-black group-hover:underline">
                      View profile
                    </span>
                    <ChevronRight className="ml-0.5 inline-block h-4 w-4 align-middle" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
