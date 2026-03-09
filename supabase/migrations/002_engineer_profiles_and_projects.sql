-- Engineer profiles: one per engineer (profile.role = 'engineer')
create table if not exists public.engineer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  bio text,
  skills text[] default '{}',
  experience_years int,
  rating numeric(3,2) default null,
  availability text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Portfolio projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  engineer_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  media_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_projects_engineer_id on public.projects (engineer_id);

-- RLS engineer_profiles
alter table public.engineer_profiles enable row level security;

create policy "Engineers can read own profile"
  on public.engineer_profiles for select
  using (auth.uid() = user_id);

create policy "Engineers can insert own profile"
  on public.engineer_profiles for insert
  with check (auth.uid() = user_id);

create policy "Engineers can update own profile"
  on public.engineer_profiles for update
  using (auth.uid() = user_id);

-- Public can read engineer profiles (for discovery in Phase 4)
create policy "Public can read engineer profiles"
  on public.engineer_profiles for select
  using (true);

-- RLS projects
alter table public.projects enable row level security;

create policy "Engineers can manage own projects"
  on public.projects for all
  using (auth.uid() = engineer_id)
  with check (auth.uid() = engineer_id);

create policy "Public can read projects"
  on public.projects for select
  using (true);

-- Optional: updated_at trigger for engineer_profiles
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger engineer_profiles_updated_at
  before update on public.engineer_profiles
  for each row execute function public.set_updated_at();

create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();
