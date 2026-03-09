-- Demo data seed
-- Run this in Supabase SQL Editor (Database → SQL Editor) AFTER you have:
--   1. Run all migrations (001 through 006)
--   2. Signed up at least one user as Engineer and one as Client
-- This adds: engineer bio/skills/availability, 3 portfolio projects, 2 bookings (1 accepted, 1 pending),
-- 1 review, and 4 chat messages. Refresh the app to see Browse engineers, Bookings, Messages, and Reviews.

do $$
declare
  v_eng_id uuid;
  v_client_id uuid;
  ep_id uuid;
  book_id uuid;
  book_id2 uuid;
begin
  -- Pick first engineer and first client (not suspended)
  select id into v_eng_id from public.profiles where role = 'engineer' and (suspended is null or suspended = false) limit 1;
  select id into v_client_id from public.profiles where role = 'client' and (suspended is null or suspended = false) limit 1;

  if v_eng_id is null then
    raise notice 'No engineer found. Sign up one user as Engineer first, then run this seed again.';
    return;
  end if;
  if v_client_id is null then
    raise notice 'No client found. Sign up one user as Client first, then run this seed again.';
    return;
  end if;

  -- Ensure engineer has a profile with demo content (upsert)
  insert into public.engineer_profiles (user_id, bio, skills, experience_years, availability, approved)
  values (
    v_eng_id,
    'Structural and MEP engineer with 12+ years in commercial and residential projects. I specialise in feasibility studies, detailed design, and construction support.',
    array['Structural', 'MEP', 'CAD', 'BIM', 'Feasibility studies'],
    12,
    'Mon–Fri 9:00–18:00 (GMT); flexible for international clients',
    true
  )
  on conflict (user_id) do update set
    bio = excluded.bio,
    skills = excluded.skills,
    experience_years = excluded.experience_years,
    availability = excluded.availability,
    approved = true,
    updated_at = now();

  select id into ep_id from public.engineer_profiles where user_id = v_eng_id limit 1;

  -- Demo projects (avoid duplicates by checking title)
  if not exists (select 1 from public.projects where engineer_id = v_eng_id and title = 'Mixed-use tower – structural concept') then
    insert into public.projects (engineer_id, title, description, media_url)
    values
      (v_eng_id, 'Mixed-use tower – structural concept', 'Concept and preliminary structural design for 24-storey mixed-use building. Steel frame with composite floors.', 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'),
      (v_eng_id, 'Hospital MEP upgrade', 'Full MEP design for critical care wing upgrade. HVAC, medical gases, and BMS integration.', null),
      (v_eng_id, 'Residential BIM coordination', 'BIM coordination and clash detection for 120-unit residential scheme. Revit and Navisworks.', 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800');
  end if;

  -- Demo bookings (client ↔ engineer)
  if not exists (select 1 from public.bookings b where b.client_id = v_client_id and b.engineer_id = v_eng_id limit 1) then
    insert into public.bookings (client_id, engineer_id, datetime, status, zoom_link)
    values
      (v_client_id, v_eng_id, now() + interval '2 days', 'accepted', 'https://zoom.us/j/1234567890'),
      (v_client_id, v_eng_id, now() + interval '5 days', 'pending', null);

    select id into book_id from public.bookings where client_id = v_client_id and engineer_id = v_eng_id and status = 'accepted' limit 1;

    -- One review for the accepted booking
    if book_id is not null then
      insert into public.reviews (booking_id, rating, comment)
      values (book_id, 5, 'Very professional and clear advice. Would book again.')
      on conflict (booking_id) do nothing;
    end if;
  end if;

  -- Demo messages (only if none exist between this pair)
  if not exists (select 1 from public.messages m where (m.sender_id = v_client_id and m.receiver_id = v_eng_id) or (m.sender_id = v_eng_id and m.receiver_id = v_client_id) limit 1) then
    insert into public.messages (sender_id, receiver_id, message)
    values
      (v_client_id, v_eng_id, 'Hi, I''d like to discuss a small extension project. Are you available for a call this week?'),
      (v_eng_id, v_client_id, 'Hi! Yes, I have slots on Wednesday and Thursday afternoon. Which works for you?'),
      (v_client_id, v_eng_id, 'Thursday afternoon would be great. I''ve sent the booking request.'),
      (v_eng_id, v_client_id, 'Received. I''ve accepted it and added the Zoom link. See you then.');
  end if;

  raise notice 'Demo data added for engineer % and client %. Refresh the app to see it.', v_eng_id, v_client_id;
end $$;
