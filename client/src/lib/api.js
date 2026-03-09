import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || '';

async function getAuthHeaders() {
  const { data: { session } } = await supabase?.auth.getSession() ?? {};
  const token = session?.access_token;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function apiFetch(path, options = {}) {
  const headers = await getAuthHeaders();
  const res = await fetch(`${API_URL}${path}`, { ...options, headers: { ...headers, ...options.headers } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || res.statusText || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}
