-- Apply after the original foundation, including on previously linked development projects.
alter table public.profiles add constraint profiles_onboarding_declarations
check (onboarding_completed_at is null or (adult_declared_at is not null and accepted_disclosure_version is not null and accepted_disclosure_version = '2026-07-27'));

revoke all on public.profiles, public.companion_preferences from anon, authenticated;
grant select, insert, update on public.profiles, public.companion_preferences to authenticated;
drop policy "profiles own rows" on public.profiles;
drop policy "preferences own rows" on public.companion_preferences;
create policy profiles_select on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_insert on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy preferences_select on public.companion_preferences for select to authenticated using ((select auth.uid()) = user_id);
create policy preferences_insert on public.companion_preferences for insert to authenticated with check ((select auth.uid()) = user_id);
create policy preferences_update on public.companion_preferences for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create function public.sprint2_touch_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.sprint2_touch_updated_at();
create trigger preferences_updated_at before update on public.companion_preferences for each row execute function public.sprint2_touch_updated_at();

-- Both consent and default preferences commit in one transaction. Never accept another user's ID.
create function public.complete_onboarding(adult_accepted boolean, disclosure_accepted boolean)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if adult_accepted is distinct from true or disclosure_accepted is distinct from true then
    raise exception 'Both declarations required' using errcode = '22023';
  end if;
  insert into public.profiles (id, adult_declared_at, accepted_disclosure_version, onboarding_completed_at)
  values (auth.uid(), now(), '2026-07-27', now())
  on conflict (id) do update set
    adult_declared_at = coalesce(public.profiles.adult_declared_at, excluded.adult_declared_at),
    accepted_disclosure_version = excluded.accepted_disclosure_version,
    onboarding_completed_at = coalesce(public.profiles.onboarding_completed_at, excluded.onboarding_completed_at);
  insert into public.companion_preferences (user_id, personality_mode_id, voice_id)
  values (auth.uid(), 'caring', 'voice_hope') on conflict (user_id) do nothing;
end;
$$;
revoke all on function public.complete_onboarding(boolean, boolean) from public, anon;
grant execute on function public.complete_onboarding(boolean, boolean) to authenticated;
