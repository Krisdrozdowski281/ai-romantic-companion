import type {
  MicrophonePermissionGateway,
  ProviderConnectionStatus,
  ProviderConversationMode,
  VoiceAdapter,
  VoiceErrorCode,
  VoiceState,
} from './types';

type Listener = () => void;

const INITIAL_STATE: VoiceState = {
  connection: 'idle',
  mode: 'idle',
  muted: false,
  error: null,
};

export interface VoiceServiceOptions {
  agentId?: string;
  configurationError?: string;
  permissionGateway: MicrophonePermissionGateway;
}

export class VoiceService {
  private adapter: VoiceAdapter | null = null;
  private state: VoiceState;
  private readonly listeners = new Set<Listener>();
  private readonly agentId: string | undefined;
  private readonly permissionGateway: MicrophonePermissionGateway;
  private desiredActive = false;
  private hasConnected = false;
  private operationId = 0;
  private endingPromise: Promise<void> | null = null;
  private disposed = false;

  constructor(options: VoiceServiceOptions) {
    this.agentId = options.agentId;
    this.permissionGateway = options.permissionGateway;
    this.state = options.configurationError
      ? {
          ...INITIAL_STATE,
          connection: 'error',
          error: { code: 'configuration', message: options.configurationError },
        }
      : INITIAL_STATE;
  }

  readonly getSnapshot = (): VoiceState => this.state;

  readonly subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  bindAdapter(adapter: VoiceAdapter): void {
    this.adapter = adapter;
  }

  async start(): Promise<void> {
    if (
      this.disposed ||
      this.desiredActive ||
      this.endingPromise ||
      !['idle', 'error'].includes(this.state.connection)
    ) {
      return;
    }

    if (!this.agentId) {
      this.fail('configuration', 'A valid development agent ID is required.');
      return;
    }

    if (!this.adapter) {
      this.fail('sdk', 'Voice SDK is not ready. Close and reopen this screen.');
      return;
    }

    const operationId = ++this.operationId;
    this.setState({ ...INITIAL_STATE, connection: 'requesting-permission' });

    try {
      const permission = await this.permissionGateway.requestPermission();
      if (operationId !== this.operationId || this.disposed) return;

      if (permission !== 'granted') {
        this.fail(
          'microphone-permission',
          'Microphone permission was denied. Allow microphone access in Android Settings, then try again.',
        );
        return;
      }

      this.desiredActive = true;
      this.hasConnected = false;
      this.setState({ ...this.state, connection: 'connecting', error: null });
      await this.adapter.startSession(this.agentId);
    } catch (error: unknown) {
      if (operationId !== this.operationId || this.disposed) return;
      this.desiredActive = false;
      this.fail(
        'connection',
        toSafeErrorMessage(error, 'Could not start the voice conversation.'),
      );
    }
  }

  async end(): Promise<void> {
    if (this.endingPromise) return this.endingPromise;

    const shouldEndProvider =
      this.desiredActive ||
      this.hasConnected ||
      ['connecting', 'connected', 'reconnecting'].includes(
        this.state.connection,
      );

    ++this.operationId;
    this.desiredActive = false;
    this.hasConnected = false;

    if (!shouldEndProvider || !this.adapter) {
      this.setState({ ...INITIAL_STATE, muted: this.state.muted });
      return;
    }

    this.setState({
      ...this.state,
      connection: 'ending',
      mode: 'idle',
      error: null,
    });
    this.endingPromise = this.endProvider();
    return this.endingPromise;
  }

  private async endProvider(): Promise<void> {
    try {
      await this.adapter?.endSession();
      this.setState({ ...INITIAL_STATE, muted: this.state.muted });
    } catch (error: unknown) {
      this.fail(
        'sdk',
        toSafeErrorMessage(
          error,
          'The voice SDK could not close the conversation.',
        ),
      );
    } finally {
      this.endingPromise = null;
    }
  }

  toggleMuted(): void {
    if (this.state.connection !== 'connected' || !this.adapter) return;
    const muted = !this.state.muted;

    try {
      this.adapter.setMuted(muted);
      this.setState({ ...this.state, muted });
    } catch (error: unknown) {
      this.fail(
        'sdk',
        toSafeErrorMessage(error, 'The microphone mute control failed.'),
      );
    }
  }

  handleProviderStatus(
    status: ProviderConnectionStatus,
    message?: string,
  ): void {
    if (this.disposed || this.state.error?.code === 'configuration') return;

    switch (status) {
      case 'connecting':
        if (this.desiredActive) {
          this.setState({
            ...this.state,
            connection: this.hasConnected ? 'reconnecting' : 'connecting',
            mode: 'idle',
            error: null,
          });
        }
        break;
      case 'connected':
        if (!this.desiredActive || this.state.connection === 'ending') break;
        this.desiredActive = true;
        this.hasConnected = true;
        this.setState({ ...this.state, connection: 'connected', error: null });
        break;
      case 'error':
        this.desiredActive = false;
        this.hasConnected = false;
        this.fail(
          'connection',
          message || 'The voice connection failed. Try again.',
        );
        break;
      case 'disconnected':
        if (this.state.connection === 'ending' || !this.desiredActive) {
          this.setState({ ...INITIAL_STATE, muted: this.state.muted });
        } else {
          this.desiredActive = false;
          this.hasConnected = false;
          this.fail(
            'connection',
            'The voice conversation disconnected. Start again to reconnect.',
          );
        }
        break;
    }
  }

  handleProviderMode(mode: ProviderConversationMode): void {
    if (this.disposed || this.state.connection !== 'connected') return;
    this.setState({ ...this.state, mode });
  }

  handleProviderMuted(muted: boolean): void {
    if (!this.disposed && muted !== this.state.muted) {
      this.setState({ ...this.state, muted });
    }
  }

  async dispose(): Promise<void> {
    if (this.disposed) return;
    ++this.operationId;
    this.desiredActive = false;
    this.hasConnected = false;
    this.disposed = true;

    try {
      await this.adapter?.endSession();
    } catch {
      // Cleanup is best-effort during provider teardown. No conversation data is logged.
    } finally {
      this.listeners.clear();
    }
  }

  private fail(code: VoiceErrorCode, message: string): void {
    this.setState({
      ...this.state,
      connection: 'error',
      mode: 'idle',
      error: { code, message },
    });
  }

  private setState(state: VoiceState): void {
    if (this.disposed) return;
    this.state = state;
    this.listeners.forEach((listener) => listener());
  }
}

function toSafeErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim())
    return `${fallback} ${error.message}`;
  if (typeof error === 'string' && error.trim()) return `${fallback} ${error}`;
  return fallback;
}
