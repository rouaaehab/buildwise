-- Messages: chat between users (client ↔ engineer)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id) on delete cascade,
  receiver_id uuid not null references public.profiles (id) on delete cascade,
  message text not null,
  created_at timestamptz default now(),
  constraint message_no_self check (sender_id != receiver_id)
);

create index if not exists idx_messages_sender_receiver on public.messages (sender_id, receiver_id);
create index if not exists idx_messages_receiver_sender on public.messages (receiver_id, sender_id);
create index if not exists idx_messages_created_at on public.messages (created_at);

alter table public.messages enable row level security;

-- Users can read messages where they are sender or receiver
create policy "Users can read own messages"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Users can insert messages as sender (to any receiver)
create policy "Users can send messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

-- Enable Realtime for this table (client subscribes to new messages)
alter publication supabase_realtime add table public.messages;
