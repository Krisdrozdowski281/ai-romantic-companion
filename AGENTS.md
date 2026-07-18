# Repository instructions

This repository follows `BUILD_PLAN.md`, one sprint at a time. Do not add later-sprint systems early.

## Commands

- Install: `npm ci`
- Start the development-build bundler: `npm start`
- Build/install Android locally: `npm run android -- --device`
- Cloud Android development build: `npx eas-cli@latest build --platform android --profile development`
- Lint: `npm run lint`
- Type-check: `npm run typecheck`
- Test: `npm test`
- Full verification: `npm run verify`

## Layout

- `app/`: Expo Router screens and layout
- `src/config/`: validated public development configuration
- `src/features/`: feature UI
- `src/services/voice/`: provider-neutral voice service and ElevenLabs bridge
- `.github/workflows/`: CI

## Rules

- Keep TypeScript strict; fix errors without broad ignores.
- Never put API keys, permanent secrets, signing files, or local environment files in Git.
- `EXPO_PUBLIC_*` values are public bundle configuration, never secrets.
- Never log or place transcripts, prompts, audio, memories, or sensitive conversation content in analytics, fixtures, tests, or console output.
- Keep provider-specific code behind the voice-service boundary.
- End active conversations on user action, navigation away, and unmount.
- Add tests for behavior changes. In later sprints, authentication, Row Level Security, entitlements, and usage logic require dedicated tests.
- Update setup and architecture documentation whenever those behaviors change.
- Work is done only when relevant checks pass and the final diff is reviewed for secrets, lifecycle errors, unhandled states, and sprint scope.
