import { supabase } from './supabase';

const BUCKET = 'project-images';
const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/**
 * Upload a portfolio project image to Supabase Storage.
 * @param {string} userId - Current user (engineer) id
 * @param {File} file - Image file
 * @returns {Promise<string>} Public URL
 */
export async function uploadProjectImage(userId, file) {
  if (!supabase || !userId || !file) throw new Error('Missing supabase, userId, or file');
  if (file.size > MAX_BYTES) throw new Error('Image must be under 5MB');
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Use a JPEG, PNG, GIF, or WebP image');
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeExt = ['jpeg', 'jpg', 'png', 'gif', 'webp'].includes(ext) ? ext : 'jpg';
  const path = `${userId}/${Date.now()}-project.${safeExt}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
