-- Bookings: consultation requests from clients to engineers
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles (id) on delete cascade,
  engineer_id uuid not null references public.profiles (id) on delete cascade,
  datetime timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'completed', 'cancelled')),
  zoom_link text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint booking_no_self check (client_id != engineer_id)
);

create index if not exists idx_bookings_client_id on public.bookings (client_id);
create index if not exists idx_bookings_engineer_id on public.bookings (engineer_id);
create index if not exists idx_bookings_datetime on public.bookings (datetime);

alter table public.bookings enable row level security;

-- Clients can read their own bookings and create bookings (as client)
create policy "Clients can read own bookings"
  on public.bookings for select
  using (auth.uid() = client_id);

create policy "Clients can create bookings"
  on public.bookings for insert
  with check (auth.uid() = client_id);

-- Engineers can read bookings where they are the engineer
create policy "Engineers can read their bookings"
  on public.bookings for select
  using (auth.uid() = engineer_id);

-- Engineers can update their bookings (accept/reject, add zoom_link)
create policy "Engineers can update their bookings"
  on public.bookings for update
  using (auth.uid() = engineer_id);

create trigger bookings_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();
