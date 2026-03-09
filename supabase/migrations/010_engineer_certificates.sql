-- Engineer certificates (for profile verification)
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  engineer_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  issuing_organization text not null,
  issue_date date not null,
  expiry_date date,
  credential_id text,
  document_url text,
  status text not null default 'pending' check (status in ('pending', 'verified')),
  created_at timestamptz default now()
);

create index if not exists idx_certificates_engineer_id on public.certificates (engineer_id);

alter table public.certificates enable row level security;

create policy "Engineers can manage own certificates"
  on public.certificates for all
  using (auth.uid() = engineer_id)
  with check (auth.uid() = engineer_id);

create policy "Public can read verified certificates"
  on public.certificates for select
  using (status = 'verified');
