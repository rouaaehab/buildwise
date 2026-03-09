import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';

const router = Router();

/**
 * GET /api/messages/support-admin – id and name of the support admin (for "Message admin")
 * Returns the first admin by id so client/engineer can open a conversation with them.
 */
router.get('/support-admin', requireAuth, async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Service unavailable' });

    const { data: admin, error } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('role', 'admin')
      .order('id', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    if (!admin) return res.json({ id: null, name: null });

    res.json({ id: admin.id, name: admin.name || 'Support' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/conversations – list people I have chatted with (last message preview)
 */
router.get('/conversations', requireAuth, async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Service unavailable' });
    const userId = req.user.id;

    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, sender_id, receiver_id, message, created_at')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    if (!messages?.length) return res.json({ conversations: [] });

    const seen = new Set();
    const otherIds = [];
    const lastByOther = {};
    for (const m of messages) {
      const other = m.sender_id === userId ? m.receiver_id : m.sender_id;
      if (seen.has(other)) continue;
      seen.add(other);
      otherIds.push(other);
      lastByOther[other] = { message: m.message, created_at: m.created_at };
    }

    const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', otherIds);
    const nameMap = Object.fromEntries((profiles || []).map((p) => [p.id, p.name]));

    const conversations = otherIds.map((id) => ({
      user_id: id,
      name: nameMap[id] || null,
      last_message: lastByOther[id]?.message?.slice(0, 80) || '',
      last_at: lastByOther[id]?.created_at,
    }));

    res.json({ conversations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/messages/unread-count – number of messages received and not read
 */
router.get('/unread-count', requireAuth, async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Service unavailable' });
    const userId = req.user.id;
    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .is('read_at', null);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ unread_count: count ?? 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/messages?with=:userId – messages between me and userId (and mark as read)
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Service unavailable' });
    const userId = req.user.id;
    const withId = req.query.with;
    if (!withId) return res.status(400).json({ error: 'Query "with" (user id) is required' });

    const { data: rowsA, error: errA } = await supabase
      .from('messages')
      .select('*')
      .eq('sender_id', userId)
      .eq('receiver_id', withId)
      .order('created_at', { ascending: true });
    const { data: rowsB, error: errB } = await supabase
      .from('messages')
      .select('*')
      .eq('sender_id', withId)
      .eq('receiver_id', userId)
      .order('created_at', { ascending: true });
    const error = errA || errB;
    const rows = [...(rowsA || []), ...(rowsB || [])].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );

    if (error) return res.status(500).json({ error: error.message });

    // Mark messages I received from this user as read
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('receiver_id', userId)
      .eq('sender_id', withId)
      .is('read_at', null);

    const senderIds = [...new Set(rows?.map((r) => r.sender_id) || [])];
    const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', senderIds);
    const nameMap = Object.fromEntries((profiles || []).map((p) => [p.id, p.name]));

    const messages = (rows || []).map((r) => ({
      id: r.id,
      sender_id: r.sender_id,
      receiver_id: r.receiver_id,
      message: r.message,
      created_at: r.created_at,
      sender_name: nameMap[r.sender_id] || null,
      is_mine: r.sender_id === userId,
    }));

    const { data: otherProfile } = await supabase.from('profiles').select('name').eq('id', withId).single();
    res.json({ messages, other_name: otherProfile?.name ?? null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/messages – send a message. Body: receiver_id, message
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    if (!supabase) return res.status(503).json({ error: 'Service unavailable' });
    const { receiver_id, message } = req.body;
    if (!receiver_id || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'receiver_id and message are required' });
    }
    const senderId = req.user.id;
    if (senderId === receiver_id) {
      return res.status(400).json({ error: 'Cannot message yourself' });
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiver_id,
        message: message.trim(),
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    const { data: senderProfile } = await supabase.from('profiles').select('name').eq('id', senderId).single();

    res.status(201).json({
      message: {
        id: data.id,
        sender_id: data.sender_id,
        receiver_id: data.receiver_id,
        message: data.message,
        created_at: data.created_at,
        sender_name: senderProfile?.name || null,
        is_mine: true,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
