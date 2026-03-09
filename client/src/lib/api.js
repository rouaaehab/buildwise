import { supabase } from './supabase';

// In production, prefer same-origin /api and let the host proxy to the backend.
// In local dev, keep using VITE_API_URL or the Vite proxy.
const API_URL = import.meta.env.DEV ? (import.meta.env.VITE_API_URL || '') : '';

async function getAuthHeaders() {
  const { data: { session } } = await supabase?.auth.getSession() ?? {};
  const token = session?.access_token;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function apiFetch(path, options = {}) {
  const headers = await getAuthHeaders();
  const url = `${API_URL}${path}`;
  const res = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
  const text = await res.text();
  if (!res.ok) {
    let body = {};
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      if (text.trimStart().toLowerCase().startsWith('<!')) {
        throw new Error(
          'API returned HTML instead of JSON. Is the backend running? In dev, start the server (e.g. npm run dev in server/). ' +
          'If deployed, set VITE_API_URL to your API base URL.'
        );
      }
      throw new Error(res.statusText || `Request failed: ${res.status}`);
    }
    throw new Error(body.error || res.statusText || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    if (text.trimStart().toLowerCase().startsWith('<!')) {
      throw new Error(
        'API returned HTML instead of JSON. Is the backend running? In dev, start the server (e.g. npm run dev in server/). ' +
        'If deployed, set VITE_API_URL to your API base URL.'
      );
    }
    throw new Error('Invalid JSON in API response');
  }
}
