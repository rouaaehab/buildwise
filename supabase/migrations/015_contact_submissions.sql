-- Contact form submissions from "Send us a message" (public). Admins view and reply by email.
create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  role text check (role is null or role in ('client', 'engineer')),
  message text not null,
  created_at timestamptz default now()
);

create index if not exists idx_contact_submissions_created_at on public.contact_submissions (created_at desc);

alter table public.contact_submissions enable row level security;

-- No public read; server uses service role for insert (POST /api/contact) and admin read (GET /api/admin/contact-submissions)
create policy "No direct public access"
  on public.contact_submissions for all
  using (false)
  with check (false);
