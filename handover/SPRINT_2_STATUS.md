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
- npm run verify: formatting, lint, strict TypeScript and 51 tests across 13 suites passed.
- npm run check:edge: passed.
- npm run test:edge: 8 tests passed, including signed/missing/expired/forged JWT cases with mocked dependencies.
- npm run test:db: both migrations applied to a temporary empty database; 27 pgTAP assertions passed. Existing local users/data preserved.
- npx expo export --platform android --output-dir .expo/sprint2-export: passed; 1555 modules bundled.
- Final staged diff checked for whitespace, credentials, local files and sprint scope.

These are automated and bundle checks, not physical-device acceptance.

## Pending development environment and acceptance

Cloud writes require explicit approval under the shared AGENTS.md. Approval has been requested for the existing development project; deployment has not been performed.

Read-only inspection found existing ElevenLabs agent/API secrets, but not ELEVENLABS_VOICE_HOPE, ELEVENLABS_VOICE_SARAH or ELEVENLABS_VOICE_CHARLOTTE. Configure approved voice IDs server-side before deploying the updated function. Never paste API keys into chat.

The CLI database dry run could not find a linked project ref. Complete supabase link privately, then review migration dry-run output before applying. Verify the ElevenLabs development agent is private, its voice override setting and personality_mode template are configured, and arbitrary prompt overrides remain disabled.

Physical Android registration, confirmation, sign-in, restart restoration, onboarding, persistence, mute, interruption, End, navigation and logout acceptance remain unverified. Android SDK/adb were not available in this environment. Do not start Sprint 3 until private-agent voice passes on the phone.

No paid ElevenLabs calls were made. No cloud migration or function deployment was made.

## Remaining risks

npm audit --omit=dev reported 33 dependency advisories (21 high, 12 moderate, zero critical), including bundled Expo/React Native tooling. No forced framework downgrade was applied; dependency remediation requires review.

Provider conversation tokens do not by themselves cryptographically bind every client initialization override. Review agent settings as documented in README. Age declaration is self-attestation, not identity or age verification.

Sprint 2 code is ready for review; full completion still requires deployment/configuration and physical acceptance.
