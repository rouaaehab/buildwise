-- Engineer profile image + profession/location; project portfolio fields
-- Run after 006

-- Profile avatar (all users; engineers use for profile photo)
alter table public.profiles
  add column if not exists avatar_url text;

-- Engineer profile: profession (e.g. "Architectural Engineering"), location (e.g. "Alexandria, Egypt")
alter table public.engineer_profiles
  add column if not exists profession text,
  add column if not exists location text;

-- Portfolio projects: category, location, year, duration, budget (match "Upload New Project" demo)
alter table public.projects
  add column if not exists category text,
  add column if not exists location text,
  add column if not exists year_completed text,
  add column if not exists duration text,
  add column if not exists budget_range text;
