import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';

export default function Chat() {
  const { user, profile, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [supportAdmin, setSupportAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [convRes, supportRes] = await Promise.all([
          apiFetch('/api/messages/conversations'),
          (profile?.role === 'client' || profile?.role === 'engineer')
            ? apiFetch('/api/messages/support-admin').catch(() => ({ id: null, name: null }))
            : Promise.resolve({ id: null, name: null }),
        ]);
        if (!cancelled) {
          setConversations(convRes.conversations || []);
          setSupportAdmin(supportRes?.id ? { id: supportRes.id, name: supportRes.name || 'Support' } : null);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, profile?.role]);

  const formatDate = (dt) => {
    if (!dt) return '';
    const d = new Date(dt);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <p className="text-gray-600">Log in to use chat.</p>
        <Link to="/login" className="mt-2 text-blue-600 hover:underline">Log in</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      

      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Messages</h1>
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
        )}

        {loading ? (
          <p className="text-gray-600">Loading…</p>
        ) : (() => {
          const hasSupportConversation = supportAdmin && conversations.some((c) => c.user_id === supportAdmin.id);
          const list =
            supportAdmin && !hasSupportConversation
              ? [
                  {
                    user_id: supportAdmin.id,
                    name: 'Support (Admin)',
                    last_message: 'Ask a question or report an issue',
                    last_at: null,
                  },
                  ...conversations,
                ]
              : conversations;
          return list.length === 0 ? (
            <p className="text-gray-600">
              No conversations yet. Message an engineer from their profile or from a booking, or contact Support above.
            </p>
          ) : (
            <ul className="space-y-0 bg-white rounded-lg shadow divide-y divide-gray-200">
              {list.map((c) => (
                <li key={c.user_id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/chat/${c.user_id}`)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{c.name || 'User'}</p>
                      <p className="text-sm text-gray-500 truncate">{c.last_message || 'No messages'}</p>
                    </div>
                    {c.last_at && (
                      <span className="text-xs text-gray-400 shrink-0">{formatDate(c.last_at)}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          );
        })()}
      </main>
    </div>
  );
}
