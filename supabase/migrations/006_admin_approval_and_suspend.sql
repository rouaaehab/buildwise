-- Admin: engineer approval and user suspend
-- Run after 001 and 002

alter table public.profiles
  add column if not exists suspended boolean not null default false;

alter table public.engineer_profiles
  add column if not exists approved boolean not null default false;

-- Existing engineer profiles stay visible; new ones need admin approval
update public.engineer_profiles set approved = true where approved is not true;
