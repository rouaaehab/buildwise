-- Reviews: client rates engineer after a booking (accepted/completed)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  rating smallint not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now()
);

create index if not exists idx_reviews_booking_id on public.reviews (booking_id);

-- Get engineer_id from booking for aggregate
create index if not exists idx_bookings_engineer_for_reviews on public.bookings (engineer_id);

alter table public.reviews enable row level security;

-- Clients can insert a review for their own booking
create policy "Clients can create review for own booking"
  on public.reviews for insert
  with check (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id and b.client_id = auth.uid()
    )
  );

-- Everyone can read reviews (for profile display)
create policy "Anyone can read reviews"
  on public.reviews for select
  using (true);

-- Recompute engineer_profiles.rating when reviews change
create or replace function public.update_engineer_rating()
returns trigger as $$
declare
  eng_id uuid;
  avg_rating numeric;
begin
  if TG_OP = 'DELETE' then
    eng_id := (select engineer_id from public.bookings where id = OLD.booking_id);
  else
    eng_id := (select engineer_id from public.bookings where id = NEW.booking_id);
  end if;
  if eng_id is null then return coalesce(NEW, OLD); end if;

  select round(avg(rating)::numeric, 2) into avg_rating
  from public.reviews r
  join public.bookings b on b.id = r.booking_id
  where b.engineer_id = eng_id;

  update public.engineer_profiles
  set rating = avg_rating, updated_at = now()
  where user_id = eng_id;
  return coalesce(NEW, OLD);
end;
$$ language plpgsql security definer;

create trigger on_review_change
  after insert or update or delete on public.reviews
  for each row execute function public.update_engineer_rating();
