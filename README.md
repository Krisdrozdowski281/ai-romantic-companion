# AI Companion — Sprint 1 voice proof

An intentionally minimal, adult-only, store-safe Expo React Native prototype for proving a real-time ElevenLabs voice conversation on a physical Android phone. It uses Expo SDK 57, Expo Router, strict TypeScript, the official ElevenLabs React Native SDK, and LiveKit/WebRTC native modules.

This project **does not run in Expo Go**. It requires an Expo development build because the voice SDK uses native WebRTC modules.

## What is included

- Welcome and conversation screens
- Start, end, and microphone mute controls
- Connecting, connected, reconnecting, listening, speaking, ending, and error states
- Clear microphone denial and connection/SDK errors
- Provider-neutral typed `VoiceService` with a thin ElevenLabs adapter
- Cleanup on end, navigation away, and provider unmount
- ESLint, Prettier, Jest, React Native Testing Library, strict type checking, and GitHub Actions

Supabase, RevenueCat, memory, subscriptions, a custom backend, and production styling are deliberately outside Sprint 1.

## Prerequisites on Windows

1. Install 64-bit [Node.js](https://nodejs.org/) 22.13 or newer and Git.
2. Install [Android Studio](https://developer.android.com/studio), including Android SDK Platform 36, Android SDK Build-Tools, and Android SDK Platform-Tools.
3. Set `JAVA_HOME` to Android Studio's bundled JDK, normally `C:\Program Files\Android\Android Studio\jbr`, and add `%JAVA_HOME%\bin` to your user `Path`.
4. In Android Studio's SDK Manager, install the Google USB Driver if your phone uses it. Some manufacturers require their own Windows USB driver.
5. Set `ANDROID_HOME` to your Android SDK directory, normally `%LOCALAPPDATA%\Android\Sdk`, and add `%ANDROID_HOME%\platform-tools` to your user `Path`.
6. Open a new PowerShell window and confirm:

   ```powershell
   node --version
   npm --version
   java -version
   adb version
   ```

## ElevenLabs development agent setup

1. In the ElevenLabs dashboard, create one development agent with a store-safe adult companion prompt and one voice.
2. Enable voice conversations and user interruption/barge-in in the agent's conversation settings.
3. For Sprint 1 only, make the development agent available without authentication. Production private-agent authorization is intentionally deferred to Sprint 2.
4. Copy its agent ID. It should look like `agent_...`. Do not create or copy an ElevenLabs API key into this project.
5. Create a local environment file:

   ```powershell
   Copy-Item .env.example .env.local
   notepad .env.local
   ```

6. Replace the placeholder with the development agent ID:

   ```dotenv
   EXPO_PUBLIC_ELEVENLABS_AGENT_ID=agent_your_actual_development_agent_id
   ```

`.env.local` is ignored by Git. The `EXPO_PUBLIC_` prefix means Expo embeds this value in the JavaScript bundle, so it is suitable only for the non-secret public agent ID—never an API key or token. Restart Metro after changing it.

## Install and verify

From PowerShell in the repository root:

```powershell
npm ci
npm run verify
npx expo-doctor
```

The individual checks are `npm run format:check`, `npm run lint`, `npm run typecheck`, and `npm test`.

## Physical Android phone setup

1. On the phone, open **Settings → About phone** and tap **Build number** seven times.
2. Open **Developer options**, enable **USB debugging**, and connect the phone by a data-capable USB cable.
3. Accept the phone's RSA debugging prompt.
4. In PowerShell, verify that the serial is listed as `device`, not `unauthorized`:

   ```powershell
   adb devices
   ```

5. Keep the phone and PC on the same network. Allow Node.js through Windows Defender Firewall on private networks when prompted.

## Option A: local Android development build

This requires Android Studio and the Android SDK configured above:

```powershell
npm run android -- --device
```

Select the physical phone if prompted. Expo generates the ignored native project, builds the development client, installs it, and starts Metro. Later JavaScript-only changes need only:

```powershell
npm start
```

Rebuild after changing native dependencies, native permissions, or Expo config plugins.

## Option B: EAS cloud development build

This avoids compiling Android locally:

```powershell
npx eas-cli@latest login
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android --profile development
```

The `development` profile produces an installable APK. Open the build URL on the phone, download the APK, allow installs from that browser when Android asks, and install it. Then start Metro on the PC:

```powershell
npm start
```

Open the installed **AI Companion Voice Proof** development client and select the detected bundler or scan Metro's QR code. If LAN discovery is blocked, try `npx expo start --dev-client --tunnel`.

## Manual voice acceptance test

1. Open the conversation screen and tap **Start conversation**.
2. Grant microphone permission. Confirm connecting becomes connected and listening/speaking changes with each turn.
3. Speak while the agent is speaking and confirm interruption works.
4. Mute and confirm the label changes to **Unmute microphone**; unmute and continue.
5. Hold a continuous conversation for at least ten minutes, watching for audio loss, stuck states, or unexpected disconnects.
6. Tap **End conversation** and confirm the state returns to ready. Start a second call.
7. Start a call and use Android Back; confirm the call audio stops.
8. Deny microphone permission once and confirm the UI directs you to Android Settings.
9. Disable the network during a call and confirm reconnecting or a clear recoverable connection error is shown.

The automated checks cannot prove ten-minute audio stability, barge-in quality, device routing, or dashboard configuration; those require this physical-device test.

## Troubleshooting

- **Expo Go opens:** close it and open the installed development client. Expo Go cannot load LiveKit WebRTC.
- **Phone cannot find Metro:** confirm both devices are on the same LAN, allow Node through Windows Firewall, or use the tunnel command above.
- **`unauthorized` in `adb devices`:** revoke USB debugging authorizations on the phone, reconnect, and accept the RSA prompt.
- **Microphone remains denied:** open **Android Settings → Apps → AI Companion Voice Proof → Permissions → Microphone** and choose Allow.
- **Configuration error:** check `.env.local`, ensure the value begins with `agent_`, then restart Metro with `npx expo start --dev-client --clear`.
- **Connection rejected:** confirm the development agent exists, voice conversation is enabled, and authentication is disabled for this Sprint 1 proof.

Official references: [ElevenLabs React Native SDK](https://elevenlabs.io/docs/eleven-agents/libraries/react-native), [ElevenLabs Expo integration](https://elevenlabs.io/docs/eleven-agents/guides/integrations/expo-react-native), and [Expo development builds](https://docs.expo.dev/develop/development-builds/create-a-build/).
