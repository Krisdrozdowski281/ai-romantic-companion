# Sprint 2 implementation status

Date: 2026-10-05. Branch: codex/sprint-2-auth-hardening.

## Delivered locally

- Protected authentication and onboarding routes, persisted session restoration, foreground token refresh and safe error handling.
- Atomic adult declaration and AI disclosure acceptance, approved voice/personality preferences loaded from Supabase.
- Own-row RLS and explicit database privileges, constraints and timestamp updates through a new migration.
- Authenticated private WebRTC authorization through the current Supabase wrapper; trusted server voice mapping, safe failures and no public-agent fallback.
- Voice shutdown on logout/navigation and cancellation of late session starts.
- Windows setup, isolated database tests, SDK bridge tests, actual authentication-wrapper tests and both CI jobs.

## Verification

- Fresh npm ci: passed.
- npm run verify: formatting, lint, strict TypeScript and 52 tests across 13 suites passed.
- npm run check:edge: passed.
- npm run test:edge: 8 tests passed, including signed/missing/expired/forged JWT cases with mocked dependencies.
- npm run test:db: all three migrations applied to a temporary empty database; 27 pgTAP assertions passed. Existing local users/data preserved.
- npx expo export --platform android --output-dir .expo/sprint2-export: passed; 1555 modules bundled.
- Final staged diff checked for whitespace, credentials, local files and sprint scope.

These are automated and bundle checks, not physical-device acceptance.

## Development deployment

Kris explicitly approved development deployment on 2026-10-05 and selected Charlotte.

- Resumed the paused existing project rekodexqrqzizujtpxwy; verified ACTIVE_HEALTHY.
- Linked the CLI. Its existing-temp-directory bug required preserving previous link metadata under ignored .expo/sprint2-link-backup.
- Direct CLI database dry run could not connect from this network. Used the authenticated Supabase Management API instead.
- Inspected existing columns, constraints, RLS and policies: they matched the original foundation migration, but no migration history existed.
- Recorded the verified original migration as a baseline, then applied hardening and Charlotte-default migrations with history entries in one transaction. Existing user rows and preferences were preserved.
- Configured only ELEVENLABS_VOICE_CHARLOTTE from the officially documented Charlotte ID. Existing agent/API secrets were preserved; Hope/Sarah remain unconfigured.
- Deployed elevenlabs-session version 14 and verified ACTIVE.
- Live unauthenticated and invalid-token requests: safe 401 responses; CORS OPTIONS: 204. No authenticated provider token or paid audio calls were made.
- Verified remote RLS, disabled anonymous reads/deletes, Charlotte RPC default and migration history.
- Confirmed email sign-in and email confirmation enabled. Added ai-companion://sign-in to the existing redirect allow-list while preserving other entries.

## Pending acceptance

Verify the ElevenLabs development agent is private, its voice override setting and personality_mode template are configured, and arbitrary prompt overrides remain disabled. These provider settings have not been changed or verified in this deployment.

Physical Android registration, confirmation, sign-in, restart restoration, onboarding, persistence, mute, interruption, End, navigation and logout acceptance remain unverified. Android SDK/adb were not available in this environment. Do not start Sprint 3 until private-agent voice passes on the phone.

No paid ElevenLabs calls were made. Supabase development deployment was completed after explicit approval.

## Remaining risks

npm audit --omit=dev reported 33 dependency advisories (21 high, 12 moderate, zero critical), including bundled Expo/React Native tooling. No forced framework downgrade was applied; dependency remediation requires review.

Provider conversation tokens do not by themselves cryptographically bind every client initialization override. Review agent settings as documented in README. Age declaration is self-attestation, not identity or age verification.

Sprint 2 code is ready for review; full completion still requires provider configuration verification and physical acceptance.
