# Codex task: Sprint 2 application shell and authentication

We are starting Sprint 2 of the adult-only, store-safe romantic AI companion mobile app.

Read `BUILD_PLAN.md` and `AGENTS.md` completely before editing files. Inspect the existing Sprint 1 implementation and preserve its tested `VoiceService` boundary and lifecycle behavior.

Implement only Sprint 2: application shell, authentication, onboarding, preferences, Supabase foundation, Row Level Security, and authenticated private ElevenLabs session authorization.

Do not implement conversation history, transcripts, summaries, memory, subscriptions, RevenueCat, usage allowances, billing, production monitoring, reporting, or later-sprint privacy and deletion features.

## Goal

Convert the Sprint 1 public development-agent proof into an authenticated application where adult users complete onboarding, select approved companion preferences, and start private ElevenLabs voice sessions using short-lived server-issued authorization.

## Before implementing

1. Inspect the complete workspace and current Git diff.
2. Read `BUILD_PLAN.md` and `AGENTS.md` completely.
3. Run the existing verification suite.
4. Review the current `VoiceService` and ElevenLabs adapter lifecycle.
5. Check the current official Supabase Auth, Row Level Security, Edge Function authentication, Expo React Native, and ElevenLabs private WebRTC authorization documentation.
6. Inspect installed TypeScript definitions and current APIs. Do not guess package APIs.
7. Present a short implementation plan before changing files.

## Required foundation

- Create or document a Supabase development project.
- Use the current stable Supabase JavaScript client compatible with the existing Expo version.
- Add the Supabase CLI and committed migrations.
- Add validated client environment configuration.
- Keep TypeScript strict.
- Preserve ESLint, Prettier, Jest, Expo Router, and GitHub Actions.
- Update `AGENTS.md` and `README.md` when commands or setup change.
- Keep development and future production configuration clearly separated.

## Client configuration

- Use only the Supabase project URL and publishable client key in the mobile application.
- Treat all `EXPO_PUBLIC_*` values as public.
- Never place a Supabase service-role key, ElevenLabs API key, permanent token, database password, or other secret in the mobile application.
- Keep local environment files ignored.
- Update `.env.example` with placeholders only.
- Validate missing and malformed environment values with understandable UI errors.

## Authentication

- Implement email registration.
- Implement email login.
- Implement logout.
- Restore the authenticated session after application restart.
- Handle loading, invalid credentials, unverified email where applicable, expired sessions, network failure, and logout errors.
- Do not add social login yet.
- Do not log email addresses, access tokens, refresh tokens, authorization headers, or authentication payloads.

## Routing

- Use Expo Router route groups for authenticated and unauthenticated application areas.
- Unauthenticated users must not access protected routes.
- Authenticated users who have not completed onboarding must be directed to onboarding.
- Authenticated users who have completed onboarding must be directed to the companion home screen.
- Avoid navigation loops during initial session restoration.
- Preserve cleanup of active voice conversations when navigating away or signing out.

## Onboarding

- Add an explicit adult-age declaration.
- Add a clear disclosure that the companion is artificial intelligence, not human, conscious, physically present, a therapist, or an emergency service.
- Require affirmative acceptance before onboarding can complete.
- Record the declaration timestamp, accepted disclosure or terms version, and onboarding completion timestamp.
- Do not claim that an age checkbox is strong identity or age verification.
- Keep styling minimal and consistent with Sprint 1.

## Application shell

- Add a minimal authenticated companion home screen.
- Add approved personality selection: Caring, Playful, and Confident.
- Add selection from a small trusted list of configured ElevenLabs voice IDs.
- Users must not enter raw system prompts or arbitrary voice IDs.
- Add a basic settings and account screen containing current preferences, account email where appropriate, and logout.
- Do not implement account deletion yet; that belongs to a later sprint.

## Database migrations

Create the minimum Sprint 2 schema required for the following tables.

### `profiles`

- `id` matching `auth.users.id`
- `created_at`
- `updated_at`
- `adult_declared_at`
- `accepted_disclosure_version`
- `accepted_terms_version` if terms acceptance is included
- `onboarding_completed_at`

### `companion_preferences`

- `user_id`
- `personality_mode_id`
- `voice_id`
- `created_at`
- `updated_at`

Requirements:

- Use appropriate primary keys, foreign keys, constraints, and update behavior.
- Restrict personality and voice values to trusted configured identifiers.
- Enable Row Level Security on every user-owned table.
- A user may select, insert, update, and read only their own records.
- Do not grant users access to other users' records.
- Avoid permissive policies such as unrestricted `using (true)` or `with check (true)`.
- Use migrations as the source of truth; do not rely only on dashboard-created schema.
- Add deterministic RLS tests using two distinct test users.

## Private ElevenLabs voice authorization

- Change the ElevenLabs development agent to private as a documented manual dashboard step.
- Add a Supabase Edge Function that issues the current ElevenLabs-supported short-lived authorization for a WebRTC conversation.
- Verify the current ElevenLabs React Native SDK and private-agent API before implementation.
- For WebRTC, use the currently documented conversation-token flow rather than assuming the older WebSocket signed-URL flow.
- Authenticate the caller using the current documented Supabase Edge Function authentication approach.
- Reject missing, invalid, or expired Supabase sessions.
- Store `ELEVENLABS_API_KEY` and `ELEVENLABS_AGENT_ID` only as Supabase Edge Function secrets.
- Do not accept an arbitrary agent ID from the mobile client.
- Do not add subscription, entitlement, allowance, or usage checks yet.
- Do not log JWTs, authorization headers, ElevenLabs tokens, signed URLs, prompts, transcripts, audio, or sensitive conversation content.
- Return minimal safe errors without exposing upstream response bodies or secrets.

## Voice integration

- Preserve the provider-neutral typed `VoiceService` abstraction.
- Update the provider adapter so the UI still contains no ElevenLabs-specific implementation.
- Obtain short-lived authorization immediately before starting a conversation.
- Do not persist the ElevenLabs conversation token.
- Handle authorization failure, expired authentication, Edge Function failure, upstream ElevenLabs failure, connection failure, and cleanup.
- Ensure conversations still end when the user taps End, navigates away, signs out, or the component or provider unmounts.
- Preserve mute, interruption, listening, speaking, connecting, reconnecting, and error states.
- Do not log conversation content.

## Testing

- Preserve all Sprint 1 tests.
- Add authentication state tests for initial loading and session restoration, unauthenticated state, authenticated state, logout, and expired or failed session restoration.
- Add protected-routing tests where practical.
- Add onboarding validation and completion tests.
- Add preference validation and persistence tests.
- Add environment-validation tests.
- Add SQL and RLS tests proving that a user can access their own profile and preferences, and cannot read, insert, or update rows owned by another user.
- Add Edge Function tests using a mocked ElevenLabs request.
- Automated tests must never call real ElevenLabs or production Supabase services.
- Add private-session authorization tests for unauthenticated, invalid-token, upstream-error, and success cases.
- Add lifecycle tests proving logout and navigation close an active voice session.

## CI and commands

- Update GitHub Actions to run all relevant formatting, linting, type checking, unit tests, Edge Function tests, and database or RLS tests.
- If database tests require Docker or the Supabase CLI, configure CI explicitly and document local prerequisites.
- Keep CI deterministic and free of real credentials.
- Do not suppress errors with broad ignores.

## Documentation

Update `README.md` with exact Windows instructions for:

- Installing the Supabase CLI and any Docker dependency.
- Creating or linking a development Supabase project.
- Starting the local Supabase stack.
- Applying and resetting migrations.
- Running database and RLS tests.
- Configuring `EXPO_PUBLIC_SUPABASE_URL`.
- Configuring the public Supabase publishable key.
- Setting Edge Function secrets without committing them.
- Deploying the authorization Edge Function.
- Making the ElevenLabs development agent private.
- Configuring allowed development redirect URLs if required.
- Testing email registration when email confirmation is enabled.
- Rebuilding or restarting the Expo development client when required.

Also document which steps must be completed manually in the Supabase, ElevenLabs, Expo or EAS, email-provider, and Android environments.

## Security review

Before completion, review the final repository for:

- Supabase service-role keys
- ElevenLabs API keys
- JWTs and refresh tokens
- Real user email addresses
- Local environment files
- Signing credentials
- Permissive RLS policies
- Arbitrary agent or voice identifiers supplied by clients
- Authentication headers or conversation content in logs
- Voice sessions surviving logout or navigation

## Definition of done

- A fresh `npm ci` succeeds.
- Formatting passes.
- Linting passes.
- Strict type checking passes.
- All automated tests pass.
- Supabase migrations apply cleanly to an empty local database.
- RLS tests pass with two distinct users.
- GitHub Actions cover the Sprint 2 verification commands.
- A user can register, sign in, sign out, and restore a session.
- Unauthenticated users cannot access protected screens.
- Onboarding requires the adult declaration and AI disclosure.
- Personality and voice preferences persist.
- A user cannot access another user's profile or preferences.
- The mobile application contains no permanent ElevenLabs or Supabase server secret.
- Voice sessions require authenticated server-issued short-lived authorization.
- The physical Android development build can still start, interrupt, mute, and end a private-agent voice conversation.
- The final diff is reviewed for leaked secrets, lifecycle errors, unhandled authentication states, permissive RLS, and work outside Sprint 2.

## Final report

- Summarize what was implemented.
- List every verification command and result.
- Report any manual Supabase, ElevenLabs, Expo, email-provider, or Android steps.
- Report remaining security, authentication, RLS, or physical-device risks.
- Clearly identify anything that could not be verified locally.
- Do not claim the private voice flow is complete until it has been tested on a physical Android phone.

Do not begin memory, conversation history, or subscriptions until authenticated private-agent voice works reliably on the physical phone.
