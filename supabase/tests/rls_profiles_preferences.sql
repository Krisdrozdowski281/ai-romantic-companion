begin;
select plan(3);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'one@example.test', 'not-used', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'two@example.test', 'not-used', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

set local role authenticated;
set local "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';
insert into public.profiles (id) values (auth.uid());
select is((select count(*)::integer from public.profiles), 1, 'a user reads only their own profile');

set local "request.jwt.claim.sub" = '22222222-2222-2222-2222-222222222222';
select is((select count(*)::integer from public.profiles), 0, 'a second user cannot read the first profile');
select throws_ok(
  $$insert into public.companion_preferences (user_id, personality_mode_id, voice_id) values ('11111111-1111-1111-1111-111111111111', 'caring', 'voice_hope')$$,
  '42501', null, 'a second user cannot write first-user preferences'
);

select * from finish();
rollback;
