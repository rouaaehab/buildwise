import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../lib/api';
import { supabase } from '../lib/supabase';

export default function ChatThread() {
  const { userId } = useParams();
  const { user, profile, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState([]);
  const [otherName, setOtherName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!user || !userId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const msgRes = await apiFetch(`/api/messages?with=${userId}`);
        if (!cancelled) {
          setMessages(msgRes.messages || []);
          setOtherName(msgRes.other_name || 'User');
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, userId]);

  useEffect(() => {
    if (!user || !userId || !supabase) return;
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const row = payload.new;
          const isWithMe =
            (row.sender_id === user.id && row.receiver_id === userId) ||
            (row.receiver_id === user.id && row.sender_id === userId);
          if (!isWithMe) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [
              ...prev,
              {
                id: row.id,
                sender_id: row.sender_id,
                receiver_id: row.receiver_id,
                message: row.message,
                created_at: row.created_at,
                sender_name: row.sender_id === user.id ? profile?.name : otherName,
                is_mine: row.sender_id === user.id,
              },
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, userId, profile?.name, otherName]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setError('');
    try {
      const res = await apiFetch('/api/messages', {
        method: 'POST',
        body: JSON.stringify({ receiver_id: userId, message: text }),
      });
      setMessages((prev) => {
        if (prev.some((m) => m.id === res.message?.id)) return prev;
        return [...prev, res.message];
      });
      setInput('');
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dt) =>
    new Date(dt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

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
        <p className="text-gray-600">Log in to chat.</p>
        <Link to="/login" className="mt-2 text-blue-600 hover:underline">Log in</Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <header className="shrink-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4">
        <Link to="/chat" className="text-gray-600 hover:underline">← Messages</Link>
        <h1 className="text-lg font-semibold text-gray-900 truncate">{otherName}</h1>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 max-w-2xl mx-auto w-full">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
        )}

        {loading ? (
          <p className="text-gray-600">Loading messages…</p>
        ) : messages.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No messages yet. Say hello!</p>
        ) : (
          <ul className="space-y-3">
            {messages.map((m) => (
              <li
                key={m.id}
                className={`flex ${m.is_mine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    m.is_mine ? 'bg-blue-600 text-white' : 'bg-white shadow text-gray-900'
                  }`}
                >
                  {!m.is_mine && m.sender_name && (
                    <p className="text-xs opacity-80 mb-0.5">{m.sender_name}</p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{m.message}</p>
                  <p className={`text-xs mt-1 ${m.is_mine ? 'text-blue-100' : 'text-gray-500'}`}>
                    {formatTime(m.created_at)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <div ref={bottomRef} />
      </main>

      <footer className="shrink-0 bg-white border-t border-gray-200 p-4 max-w-2xl mx-auto w-full">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}
