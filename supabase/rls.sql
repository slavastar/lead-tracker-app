alter table leads enable row level security;

create policy "Users can view their leads" on leads
  for select using (auth.uid() = user_id);

create policy "Users can insert their leads" on leads
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their leads" on leads
  for delete using (auth.uid() = user_id);