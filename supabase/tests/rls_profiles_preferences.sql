begin;
select no_plan();
insert into auth.users(id) values
 ('11111111-1111-1111-1111-111111111111'),
 ('22222222-2222-2222-2222-222222222222');

set local role authenticated;
set local "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';
select throws_ok($$select public.complete_onboarding(false,true)$$,'22023','Both declarations required','adult declaration required');
select throws_ok($$select public.complete_onboarding(true,false)$$,'22023','Both declarations required','AI disclosure required');
select lives_ok($$select public.complete_onboarding(true,true)$$,'onboarding creates own profile and defaults');
select is((select count(*)::integer from public.profiles),1,'reads own profile');
select ok((select adult_declared_at is not null and onboarding_completed_at is not null and accepted_disclosure_version = '2026-07-27' from public.profiles),'consent recorded');
select is((select voice_id from public.companion_preferences),'voice_charlotte','default preference recorded');
select lives_ok($$update public.companion_preferences set personality_mode_id='playful',voice_id='voice_sarah'$$,'can update own preferences');
select is((select personality_mode_id from public.companion_preferences),'playful','preference persists');
select throws_ok($$update public.companion_preferences set voice_id='arbitrary_voice'$$,'23514',null,'arbitrary voice rejected');
select throws_ok($$update public.companion_preferences set personality_mode_id='arbitrary_mode'$$,'23514',null,'arbitrary personality rejected');
select ok((select updated_at >= created_at from public.companion_preferences),'update timestamp maintained');
select lives_ok($$select public.complete_onboarding(true,true)$$,'onboarding repeat is idempotent');
select is((select personality_mode_id from public.companion_preferences),'playful','repeat onboarding preserves preferences');
select throws_ok($$delete from public.profiles$$,'42501',null,'deletion excluded from Sprint 2');

set local "request.jwt.claim.sub" = '22222222-2222-2222-2222-222222222222';
select is((select count(*)::integer from public.profiles),0,'cannot read other profile');
select is((select count(*)::integer from public.companion_preferences),0,'cannot read other preferences');
select throws_ok($$insert into public.profiles(id) values ('11111111-1111-1111-1111-111111111111')$$,'42501',null,'cannot insert other profile');
select throws_ok($$insert into public.companion_preferences(user_id,personality_mode_id,voice_id) values ('11111111-1111-1111-1111-111111111111','caring','voice_hope')$$,'42501',null,'cannot insert other preferences');
with changed as (update public.profiles set accepted_disclosure_version='other' where id='11111111-1111-1111-1111-111111111111' returning id) select is((select count(*)::integer from changed),0,'cannot update other profile');
with changed as (update public.companion_preferences set voice_id='voice_charlotte' where user_id='11111111-1111-1111-1111-111111111111' returning user_id) select is((select count(*)::integer from changed),0,'cannot update other preferences');
select lives_ok($$select public.complete_onboarding(true,true)$$,'second user can onboard');
select is((select count(*)::integer from public.profiles),1,'second user reads only own profile');

set local "request.jwt.claim.sub" = '11111111-1111-1111-1111-111111111111';
select is((select personality_mode_id from public.companion_preferences),'playful','other user did not change first user');
select throws_ok($$update public.profiles set adult_declared_at=null$$,'23514',null,'completed onboarding requires consent');
set local role anon;
select throws_ok($$select * from public.profiles$$,'42501',null,'anonymous profile reads denied');
select throws_ok($$select * from public.companion_preferences$$,'42501',null,'anonymous preference reads denied');
select throws_ok($$select public.complete_onboarding(true,true)$$,'42501',null,'anonymous onboarding denied');
select * from finish();
rollback;
