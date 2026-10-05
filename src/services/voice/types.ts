export type ProviderConnectionStatus =
  'disconnected' | 'connecting' | 'connected' | 'error';

export type ProviderConversationMode = 'listening' | 'speaking';

export type VoiceConnectionState =
  | 'idle'
  | 'requesting-permission'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'ending'
  | 'error';

export type VoiceConversationMode = 'idle' | 'listening' | 'speaking';

export type VoiceErrorCode =
  'configuration' | 'microphone-permission' | 'connection' | 'sdk';

export interface VoiceError {
  code: VoiceErrorCode;
  message: string;
}

export interface VoiceState {
  connection: VoiceConnectionState;
  mode: VoiceConversationMode;
  muted: boolean;
  error: VoiceError | null;
}

export interface VoiceAdapter {
  startSession(authorization: VoiceAuthorization): void | Promise<void>;
  endSession(): void | Promise<void>;
  setMuted(muted: boolean): void;
}
export interface VoiceAuthorization {
  conversationToken: string;
  voiceId: string;
  personalityMode: 'caring' | 'playful' | 'confident';
}

export interface MicrophonePermissionGateway {
  requestPermission(): Promise<'granted' | 'denied'>;
}
