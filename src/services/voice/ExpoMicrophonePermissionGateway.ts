import { requestRecordingPermissionsAsync } from 'expo-audio';

import type { MicrophonePermissionGateway } from './types';

export const expoMicrophonePermissionGateway: MicrophonePermissionGateway = {
  async requestPermission() {
    const permission = await requestRecordingPermissionsAsync();
    return permission.granted ? 'granted' : 'denied';
  },
};
