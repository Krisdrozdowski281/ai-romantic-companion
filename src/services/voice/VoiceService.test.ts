import { VoiceService } from './VoiceService';
import type { MicrophonePermissionGateway, VoiceAdapter } from './types';

function createHarness(permission: 'granted' | 'denied' = 'granted') {
  const adapter: jest.Mocked<VoiceAdapter> = {
    startSession: jest.fn(),
    endSession: jest.fn(),
    setMuted: jest.fn(),
  };
  const permissionGateway: MicrophonePermissionGateway = {
    requestPermission: jest.fn().mockResolvedValue(permission),
  };
  const service = new VoiceService({
    agentId: 'agent_test123',
    permissionGateway,
  });
  service.bindAdapter(adapter);
  return { adapter, permissionGateway, service };
}

describe('VoiceService', () => {
  it('maps provider connection and mode states', async () => {
    const { service } = createHarness();

    await service.start();
    expect(service.getSnapshot().connection).toBe('connecting');

    service.handleProviderStatus('connected');
    service.handleProviderMode('listening');
    expect(service.getSnapshot()).toMatchObject({
      connection: 'connected',
      mode: 'listening',
    });

    service.handleProviderMode('speaking');
    expect(service.getSnapshot().mode).toBe('speaking');

    service.handleProviderStatus('connecting');
    expect(service.getSnapshot().connection).toBe('reconnecting');
  });

  it('reports microphone denial without starting the SDK', async () => {
    const { adapter, service } = createHarness('denied');

    await service.start();

    expect(adapter.startSession).not.toHaveBeenCalled();
    expect(service.getSnapshot()).toMatchObject({
      connection: 'error',
      error: { code: 'microphone-permission' },
    });
  });

  it('maps unexpected disconnection to a recoverable error', async () => {
    const { service } = createHarness();
    await service.start();
    service.handleProviderStatus('connected');

    service.handleProviderStatus('disconnected');

    expect(service.getSnapshot()).toMatchObject({
      connection: 'error',
      error: { code: 'connection' },
    });
  });

  it('ends one provider session when end is called repeatedly', async () => {
    let resolveEnd: (() => void) | undefined;
    const { adapter, service } = createHarness();
    adapter.endSession.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveEnd = resolve;
        }),
    );
    await service.start();
    service.handleProviderStatus('connected');

    const firstEnd = service.end();
    const secondEnd = service.end();
    expect(adapter.endSession).toHaveBeenCalledTimes(1);
    expect(service.getSnapshot().connection).toBe('ending');

    resolveEnd?.();
    await Promise.all([firstEnd, secondEnd]);
    expect(service.getSnapshot().connection).toBe('idle');
  });

  it('closes the provider during disposal', async () => {
    const { adapter, service } = createHarness();
    await service.start();
    service.handleProviderStatus('connected');

    await service.dispose();
    await service.dispose();

    expect(adapter.endSession).toHaveBeenCalledTimes(1);
  });

  it('does not start after cleanup wins a permission race', async () => {
    let resolvePermission: ((permission: 'granted') => void) | undefined;
    const adapter: jest.Mocked<VoiceAdapter> = {
      startSession: jest.fn(),
      endSession: jest.fn(),
      setMuted: jest.fn(),
    };
    const service = new VoiceService({
      agentId: 'agent_test123',
      permissionGateway: {
        requestPermission: () =>
          new Promise((resolve) => {
            resolvePermission = resolve;
          }),
      },
    });
    service.bindAdapter(adapter);

    const starting = service.start();
    await service.end();
    resolvePermission?.('granted');
    await starting;

    expect(adapter.startSession).not.toHaveBeenCalled();
  });

  it('controls mute only while connected', async () => {
    const { adapter, service } = createHarness();
    service.toggleMuted();
    expect(adapter.setMuted).not.toHaveBeenCalled();

    await service.start();
    service.handleProviderStatus('connected');
    service.toggleMuted();

    expect(adapter.setMuted).toHaveBeenCalledWith(true);
    expect(service.getSnapshot().muted).toBe(true);
  });
});
