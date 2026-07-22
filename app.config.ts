import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'AI Companion Voice Proof',
  slug: 'ai-romantic-companion',
  version: '0.1.0',
  orientation: 'portrait',
  scheme: 'ai-companion',
  extra: {
    eas: {
    projectId: '9672fd55-5640-4c07-8129-2b4576d38805',
  },
},
  userInterfaceStyle: 'automatic',
  plugins: [
    'expo-router',
    [
      'expo-audio',
      {
        microphonePermission:
          'Microphone access is required for a live voice conversation with your AI companion.',
      },
    ],
    'expo-asset',
    'expo-status-bar',
    '@livekit/react-native-expo-plugin',
    '@config-plugins/react-native-webrtc',
  ],
  experiments: { typedRoutes: true },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.example.airomanticcompanion',
    infoPlist: {
      NSMicrophoneUsageDescription:
        'Microphone access is required for a live voice conversation with your AI companion.',
    },
  },
  android: {
    package: 'com.example.airomanticcompanion',
    permissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.INTERNET',
      'android.permission.MODIFY_AUDIO_SETTINGS',
      'android.permission.WAKE_LOCK',
      'android.permission.BLUETOOTH',
      'android.permission.BLUETOOTH_CONNECT',
    ],
  },
});
