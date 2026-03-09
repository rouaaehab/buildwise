import { supabase } from '../lib/supabase.js';

/**
 * Get user from Authorization: Bearer <token> and attach to req.user (and req.profile with role).
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid authorization' });
  }

  if (!supabase) {
    return res.status(503).json({ error: 'Auth not configured' });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, role, avatar_url')
      .eq('id', user.id)
      .single();

    req.user = user;
    req.profile = profile || { id: user.id, name: user.email, role: 'client' };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Restrict to certain roles. Use after requireAuth.
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.profile) return res.status(401).json({ error: 'Unauthorized' });
    if (!allowedRoles.includes(req.profile.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
}
