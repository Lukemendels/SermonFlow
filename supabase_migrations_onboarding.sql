-- 7. ONBOARDING REQUESTS TABLE
create table public.onboarding_requests (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  church_name text,
  website text,
  denomination text,
  social_links jsonb default '{}'::jsonb,
  status text default 'pending_research',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.onboarding_requests enable row level security;

create policy "Enable insert for authenticated users" on public.onboarding_requests 
  for insert with check (auth.uid() = user_id);

create policy "Enable read for users based on user_id" on public.onboarding_requests
  for select using (auth.uid() = user_id);
