-- Optional duration (hours) and total amount for admin reporting
alter table public.bookings
  add column if not exists duration_hours numeric(6,2),
  add column if not exists amount numeric(10,2);

comment on column public.bookings.duration_hours is 'Consultation length in hours (e.g. 1 = 1hr, 0.5 = 30min)';
comment on column public.bookings.amount is 'Total amount charged for the booking';
