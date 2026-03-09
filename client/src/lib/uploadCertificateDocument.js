import { supabase } from './supabase';

const BUCKET = 'certificates';
const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

/**
 * Upload a certificate document (image or PDF) to Supabase Storage.
 * @param {string} userId - Current user (engineer) id
 * @param {File} file - Document file
 * @returns {Promise<string>} Public URL
 */
export async function uploadCertificateDocument(userId, file) {
  if (!supabase || !userId || !file) throw new Error('Missing supabase, userId, or file');
  if (file.size > MAX_BYTES) throw new Error('File must be under 10MB');
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Use an image (JPEG, PNG, GIF, WebP) or PDF');
  const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
  const safeExt = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'pdf'].includes(ext) ? ext : 'pdf';
  const path = `${userId}/${Date.now()}-cert.${safeExt}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
