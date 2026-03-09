-- Track when a message was read by the receiver (for unread badge)
alter table public.messages
  add column if not exists read_at timestamptz;
