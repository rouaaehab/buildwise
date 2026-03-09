import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

async function setSessionState(session, setUser, setProfile) {
  if (session?.user) {
    setUser(session.user);
    try {
      const { data: p } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      setProfile(p || null);
    } catch {
      setProfile(null);
    }
  } else {
    setUser(null);
    setProfile(null);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!supabase) {
      setLoading(false);
      return;
    }

    let subscription;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted.current) {
          await setSessionState(session, setUser, setProfile);
        }
      } catch {
        if (mounted.current) setUser(null), setProfile(null);
      } finally {
        if (mounted.current) setLoading(false);
      }
    })();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted.current) setSessionState(session, setUser, setProfile);
    });
    subscription = data?.subscription;

    return () => {
      mounted.current = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (email, password, options = {}) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: options.name, role: options.role || 'client' } },
    });
    if (error) throw error;
    return data;
  };

  const signIn = async (email, password) => {
    if (!supabase) throw new Error('Supabase not configured');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (!supabase) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && mounted.current) {
        await setSessionState(session, setUser, setProfile);
      }
    } catch {
      // ignore
    }
  };

  const value = { user, profile, loading, signUp, signIn, signOut, refreshProfile };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
