-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. CHURCHES TABLE
create table public.churches (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  deep_research_profile jsonb not null default '{}'::jsonb,
  branding_assets jsonb not null default '{}'::jsonb,
  subscription_status text default 'inactive', -- 'active', 'inactive', 'past_due'
  stripe_customer_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. SERMONS TABLE
create table public.sermons (
  id uuid default uuid_generate_v4() primary key,
  church_id uuid references public.churches(id) not null,
  transcript text not null,
  title text, -- Optional but helpful
  series_title text, -- Optional but helpful for "Current Series" context
  status text default 'pending_processing',
  audio_url text,
  processing_error text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. ASSETS TABLE
create table public.assets (
  id uuid default uuid_generate_v4() primary key,
  sermon_id uuid references public.sermons(id) not null,
  type text not null, -- e.g., 'email_recap', 'devotional'
  content_markdown text,
  pdf_url text,
  status text default 'pending', -- 'processing', 'completed', 'failed'
  error text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. STORAGE BUCKET (You must run this in the Storage UI or via Policy, but for SQL Editor:)
insert into storage.buckets (id, name, public) 
values ('sermon-assets', 'sermon-assets', true)
on conflict (id) do nothing;

-- 5. RLS POLICIES (Simple Public Access for this Demo - Harden for prod!)
alter table public.churches enable row level security;
alter table public.sermons enable row level security;
alter table public.assets enable row level security;

create policy "Enable read access for all users" on public.churches for select using (true);
create policy "Enable read access for all users" on public.sermons for select using (true);
create policy "Enable read access for all users" on public.assets for select using (true);
create policy "Enable insert for all users" on public.assets for insert with check (true);
create policy "Enable update for all users" on public.assets for update using (true);

-- 6. ONBOARDING REQUESTS TABLE
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
