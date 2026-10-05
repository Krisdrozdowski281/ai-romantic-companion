-- Use the approved Charlotte voice for new onboarding; preserve existing preferences.
create or replace function public.complete_onboarding(adult_accepted boolean, disclosure_accepted boolean)
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
  values (auth.uid(), 'caring', 'voice_charlotte') on conflict (user_id) do nothing;
end;
$$;
revoke all on function public.complete_onboarding(boolean, boolean) from public, anon;
grant execute on function public.complete_onboarding(boolean, boolean) to authenticated;
