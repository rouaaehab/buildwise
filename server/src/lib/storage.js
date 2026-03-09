import { supabase } from './supabase.js';

const AVATARS_BUCKET = 'avatars';
const AVATAR_MAX_BYTES = 2 * 1024 * 1024; // 2MB
const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const PROJECT_IMAGE_MAX = 5 * 1024 * 1024; // 5MB
const CERTIFICATE_MAX = 10 * 1024 * 1024; // 10MB
const CERTIFICATE_MIME = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

async function ensureBucket(name, opts) {
  if (!supabase) return;
  try {
    const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
    if (listErr) return;
    if ((buckets || []).some((b) => b.name === name)) return;
    const { error } = await supabase.storage.createBucket(name, { public: true, ...opts });
    if (error) console.warn(`Storage createBucket ${name} failed:`, error.message);
  } catch (err) {
    console.warn(`ensureBucket ${name} error:`, err.message);
  }
}

/**
 * Ensure storage buckets exist (call on server startup).
 */
export async function ensureAvatarsBucket() {
  await ensureBucket(AVATARS_BUCKET, {
    fileSizeLimit: AVATAR_MAX_BYTES,
    allowedMimeTypes: IMAGE_MIME,
  });
}

export async function ensureProjectImagesBucket() {
  await ensureBucket('project-images', {
    fileSizeLimit: PROJECT_IMAGE_MAX,
    allowedMimeTypes: IMAGE_MIME,
  });
}

export async function ensureCertificatesBucket() {
  await ensureBucket('certificates', {
    fileSizeLimit: CERTIFICATE_MAX,
    allowedMimeTypes: CERTIFICATE_MIME,
  });
}
