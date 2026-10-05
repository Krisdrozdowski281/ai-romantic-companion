# AI Companion — Sprint 2

An adult-only, store-safe Expo React Native development app with email authentication, session restoration, onboarding, approved companion preferences, and private ElevenLabs WebRTC session authorization. The companion's current working identity is Luna.

This requires an **Expo development build**, not Expo Go. Native ElevenLabs/LiveKit WebRTC modules require a physical Android acceptance test. Automated checks prove application and authorization behavior; they do not prove live audio quality.

## Included

- Email registration, login, logout, persisted Supabase sessions and foreground token refresh.
- Protected Expo Router groups. The home, settings and conversation screens require sign-in and completed onboarding.
- An explicit 18+ declaration and versioned AI disclosure, saved together with default preferences by an atomic database function.
- Caring, Playful and Confident personality choices, plus Hope, Sarah and Charlotte voice slots configured by the developer.
- Charlotte is the approved development default. Only its server mapping is configured currently; Hope and Sarah return a safe unavailable error until their IDs are configured. Existing saved preferences are preserved: select Charlotte in Settings if needed.
- Saved preferences reload after restarting. The server reads the signed-in user's preferences immediately before granting a voice session.
- Private WebRTC conversation tokens. Permanent ElevenLabs credentials stay in Edge Function secrets.
- Voice start/end/mute/listening/speaking/reconnect/error states, navigation/logout cleanup and cancellation guards.
- Migrations, RLS tests with two users, mock-only authentication/Edge Function tests, and CI.

Sprint 2 does not add stored transcripts, history, memories, billing, allowances, account deletion, monitoring or reporting. The phone test below is the gate before Sprint 3.

## Windows prerequisites and installation

Use Node.js 22.13 or newer, Git, Docker Desktop with its Linux container engine, and Android Studio with Android SDK Platform 36 and platform-tools. Set `JAVA_HOME` to Android Studio's JDK and `ANDROID_HOME` to the installed Android SDK. Add platform-tools to PATH.

From this repository:

```powershell
npm ci
npm run verify
npm run check:edge
npm run test:edge
npx supabase --version
```

Supabase CLI and Deno are pinned development dependencies; no separate global installation is required. Keep the committed npm and Deno lockfiles. Automated Edge Function tests mock every request; they never connect to real Supabase or ElevenLabs services.

## Local database and RLS verification

Start Docker Desktop, then:

```powershell
npx supabase start
npm run test:db
```

`test:db` creates an empty temporary database inside this project's Supabase PostgreSQL container, copies only the platform Auth schema, applies every committed application migration, runs pgTAP assertions, and drops that temporary database. Existing local application data and users are preserved.

For a **disposable** local development stack, these commands apply the source-of-truth migrations and run the same SQL tests:

```powershell
npx supabase migration up --local
npx supabase test db
```

To reset a disposable stack to an empty state:

```powershell
npx supabase db reset --local
```

Reset erases that local stack's data. Do not use it on a stack with data you need. The normal verification script does not reset the development stack.

## Development Supabase project and client configuration

Use a dedicated Supabase **development** project; keep future production projects separate. If this repository is already linked, reuse its existing development project.

1. In the Supabase dashboard, create or open the development project and enable email/password sign-in.
2. Use a current JWT signing key, as required by `@supabase/server`; migrate legacy shared-secret authentication if necessary.
3. Obtain its HTTPS project URL and **publishable** key, which starts with `sb_publishable_`.
4. Copy the client template and fill it locally:

```powershell
Copy-Item .env.example .env.local
notepad .env.local
```

Only the project URL and publishable key belong in the mobile app. Server secrets and service-role keys are rejected by validation. Loopback HTTP is accepted only for local development on localhost, 127.0.0.1 or the Android emulator's 10.0.2.2. Physical phones should use the development project's HTTPS URL.

Link and deploy migrations when preparing that development project:

```powershell
npx supabase login
npx supabase link --project-ref YOUR_DEVELOPMENT_PROJECT_REF
npx supabase db push --dry-run
npx supabase db push
```

Enter the database password through the CLI's private prompt. Never write it into source or command history. The second migration upgrades the existing Sprint 2 foundation without resetting its data.

## Email confirmation

Enable email confirmation in Supabase Auth. Add `ai-companion://sign-in` to the allowed development redirect URLs. Supabase's built-in email sender has development restrictions; configure an approved SMTP sender if needed.

Create an account, open the confirmation link, then return to the app and sign in with email/password. This sprint does not use the confirmation link to install an authenticated session automatically. Local Supabase provides its email inbox at http://127.0.0.1:54324.

## Private ElevenLabs agent and approved voices

Manual ElevenLabs dashboard setup:

1. Reuse the development agent and enable authentication so it is private. Keep the tested microphone interruption behavior.
2. Configure one adult AI companion identity. Its trusted agent prompt must interpret `{{personality_mode}}` as one of Caring (warm and calm), Playful (humorous and lightly teasing), or Confident (direct and composed). All modes must retain the build plan's AI transparency and store-safe boundaries.
3. Enable only the voice-ID override needed by the SDK. Keep system-prompt overrides disabled. Review the provider's override permissions; server-issued tokens authorize a session, rather than cryptographically binding every client initialization setting.
4. Select three approved voice IDs from your account and label the slots Hope, Sarah and Charlotte consistently. These are configured slots, not guessed provider IDs. Every ID must be 20 alphanumeric characters.
5. Copy the selected IDs into the ignored server environment file below. No arbitrary voice or agent ID can be entered in the app.
6. Disable provider audio retention for this development agent where available and review its transcript retention settings separately; the app itself saves no conversation content.

Create `.env.edge.local` from the server template:

```powershell
Copy-Item supabase/functions/.env.example .env.edge.local
notepad .env.edge.local
npx supabase secrets set --env-file .env.edge.local
npx supabase functions deploy elevenlabs-session
```

The server file contains `ELEVENLABS_API_KEY`, `ELEVENLABS_AGENT_ID`, `ELEVENLABS_VOICE_HOPE`, `ELEVENLABS_VOICE_SARAH`, and `ELEVENLABS_VOICE_CHARLOTTE`. Use a restricted development API key with the ElevenAgents conversation-token permission. Never copy this file into the mobile app.

The function uses the current `@supabase/server` authenticated-user wrapper, checks the JWT audience, verifies onboarding, loads preferences under the caller's RLS policies, and requests a short-lived WebRTC token. `verify_jwt = false` bypasses only the legacy gateway check; the wrapper still verifies the user JWT. Missing, invalid, forged and expired JWTs are rejected. No subscription or allowance checks are included yet.

## Run on a physical Android phone

Enable USB debugging, connect using a data cable, and accept the RSA prompt.

```powershell
adb devices
npm run android -- --device
```

Rebuild the development client after native dependency/configuration changes. Later JavaScript changes only need:

```powershell
npm start
```

The phone and PC must share a network for Metro. If LAN discovery fails, use `npx expo start --dev-client --tunnel`. If configuration changes, restart Metro with `npx expo start --dev-client --clear`.

EAS cloud builds require separate account/build setup. When ready, the existing development profile can be used with `npx eas-cli@latest build --platform android --profile development`.

## Verification and acceptance

| Command                | Coverage                                                       |
| ---------------------- | -------------------------------------------------------------- |
| `npm ci`               | Fresh dependency installation                                  |
| `npm run verify`       | Formatting, lint, strict TypeScript and app/unit tests         |
| `npm run check:edge`   | Deno checks for the actual Edge Function entry point           |
| `npm run test:edge`    | Real auth wrapper tests and mocked provider/database responses |
| `npm run test:db`      | Empty-database migrations and two-user RLS/consent tests       |
| `npx supabase test db` | SQL suite against an already migrated disposable local stack   |

CI has separate app/Edge Function and database jobs. It uses no real provider credentials.

Physical Android acceptance remains mandatory:

1. Register with email confirmation enabled; confirm and sign in. Test invalid credentials and an unavailable network.
2. Try protected deep links while signed out; none should expose home, settings or conversation.
3. Verify onboarding requires both the 18+ declaration and AI disclosure.
4. Save a personality and voice, restart the app, and verify both persist.
5. Start a private-agent call and verify the selected voice and personality. Hold a stable ten-minute conversation.
6. Interrupt the agent, mute/unmute, end the call, and start a second call.
7. Navigate away and sign out during a call; audio must stop. Verify session restoration after a restart and rejection after logout.
8. Deny microphone permission; confirm guidance is useful. Disconnect the network during a call and verify recovery/error behavior.
9. With two development users, verify that neither can read or modify the other's rows.

Record the device, development build, date and pass/fail results before calling Sprint 2 complete. Any paid live conversation must use an agreed development limit.

## Manual environment steps

Supabase project/SMTP/signing-key setup, remote migration and function deployment, private-agent/voice configuration, Android development-client installation, and the physical live-call test depend on the relevant dashboards, credentials and device. A local test pass does not establish that any of those remote/device steps is finished.

Official implementation references: [Supabase React Native Auth](https://supabase.com/docs/guides/auth/quickstarts/react-native), [function authentication](https://supabase.com/docs/guides/functions/auth), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [ElevenLabs React Native SDK](https://elevenlabs.io/docs/eleven-agents/libraries/react-native), [overrides](https://elevenlabs.io/docs/eleven-agents/customization/personalization/overrides), and [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/).
