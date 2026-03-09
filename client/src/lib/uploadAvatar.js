import { supabase } from './supabase';

const BUCKET = 'avatars';
const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * Upload a profile image to Supabase Storage and return the public URL.
 * @param {string} userId - Current user id (auth.uid())
 * @param {File} file - Image file from input
 * @returns {Promise<string>} Public URL of the uploaded file
 */
export async function uploadAvatar(userId, file) {
  if (!supabase || !userId || !file) throw new Error('Missing supabase, userId, or file');
  if (file.size > MAX_BYTES) throw new Error('Image must be under 2MB');
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Use a JPEG, PNG, GIF, or WebP image');
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeExt = ['jpeg', 'jpg', 'png', 'gif', 'webp'].includes(ext) ? ext : 'jpg';
  const path = `${userId}/avatar.${safeExt}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: true,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
