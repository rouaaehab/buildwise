-- Storage: RLS for project-images and certificates buckets (engineer portfolio + certificates)
-- Buckets are created by the server on startup.

-- Project images: engineers upload to project-images/{user_id}/*
create policy "Engineers can upload project images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'project-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Engineers can update own project images"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'project-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Engineers can delete own project images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'project-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Public can view project images"
  on storage.objects for select to public
  using (bucket_id = 'project-images');

-- Certificates: engineers upload to certificates/{user_id}/*
create policy "Engineers can upload certificates"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'certificates'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Engineers can update own certificates"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'certificates'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Engineers can delete own certificates"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'certificates'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "Public can view certificates"
  on storage.objects for select to public
  using (bucket_id = 'certificates');
