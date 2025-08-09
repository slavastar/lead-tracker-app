-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create leads table
create table public.leads (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  company text,
  metadata jsonb,
  created_at timestamp with time zone default now()
);

-- Indexes
create index on leads (user_id);
create index on leads using gin (metadata);

-- RLS
alter table leads enable row level security;

create policy "Users can read their leads"
  on leads for select
  using (auth.uid() = user_id);

create policy "Users can insert their leads"
  on leads for insert
  with check (auth.uid() = user_id);

create policy "Users can update their leads"
  on leads for update
  using (auth.uid() = user_id);

create policy "Users can delete their leads"
  on leads for delete
  using (auth.uid() = user_id);