-- Storage: RLS policies for avatars bucket (for profile photo uploads)
-- The bucket "avatars" is created automatically by the server on startup.
-- Run this migration so authenticated users can upload to avatars/{user_id}/.

-- Allow authenticated users to upload to their own folder: avatars/{user_id}/*
create policy "Users can upload own avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to update their own files in avatars
create policy "Users can update own avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow authenticated users to delete their own files in avatars
create policy "Users can delete own avatar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow public read (bucket is public; this allows SELECT for listing if needed)
create policy "Public can view avatars"
  on storage.objects for select to public
  using (bucket_id = 'avatars');
