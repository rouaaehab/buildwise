-- Engineer hourly rate for consultations (display on browse + profile)
alter table public.engineer_profiles
  add column if not exists hourly_rate numeric(10,2);
