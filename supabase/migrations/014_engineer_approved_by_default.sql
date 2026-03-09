-- New engineers appear in Browse engineers by default (no admin approval required).
-- To require approval again, set default back to false and use admin UI to approve.
alter table public.engineer_profiles
  alter column approved set default true;

-- Approve all existing engineers so they show in Browse engineers
update public.engineer_profiles set approved = true where approved is not true;
