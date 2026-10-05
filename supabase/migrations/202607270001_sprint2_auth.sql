create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  adult_declared_at timestamptz, accepted_disclosure_version text,
  onboarding_completed_at timestamptz
);
create table public.companion_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  personality_mode_id text not null check (personality_mode_id in ('caring','playful','confident')),
  voice_id text not null check (voice_id in ('voice_hope','voice_sarah','voice_charlotte')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
alter table public.companion_preferences enable row level security;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.companion_preferences to authenticated;
create policy "profiles own rows" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "preferences own rows" on public.companion_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
