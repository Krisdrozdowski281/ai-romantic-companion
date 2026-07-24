import { VoiceService } from './VoiceService';
import type { VoiceAdapter } from './types';

describe('VoiceService lifecycle guards', () => {
  it('preserves a configuration error when the SDK reports its initial disconnected state', () => {
    const service = new VoiceService({
      configurationError: 'Development agent ID is missing.',
      permissionGateway: { requestPermission: jest.fn() },
    });

    service.handleProviderStatus('disconnected');

    expect(service.getSnapshot()).toMatchObject({
      connection: 'error',
      error: { code: 'configuration' },
    });
  });

  it('preserves a provider error when the SDK subsequently reports disconnected', async () => {
    const service = new VoiceService({
      agentId: 'agent_test123',
      permissionGateway: {
        requestPermission: jest.fn().mockResolvedValue('granted'),
      },
    });
    service.bindAdapter({
      startSession: jest.fn(),
      endSession: jest.fn(),
      setMuted: jest.fn(),
    });
    await service.start();
    service.handleProviderStatus('connected');

    service.handleProviderStatus('error', 'The voice connection timed out.');
    service.handleProviderStatus('disconnected');

    expect(service.getSnapshot()).toMatchObject({
      connection: 'error',
      error: {
        code: 'connection',
        message: 'The voice connection timed out.',
      },
    });
  });

  it('ignores a late connected callback after the user ends a connecting session', async () => {
    const adapter: jest.Mocked<VoiceAdapter> = {
      startSession: jest.fn(),
      endSession: jest.fn(),
      setMuted: jest.fn(),
    };
    const service = new VoiceService({
      agentId: 'agent_test123',
      permissionGateway: {
        requestPermission: jest.fn().mockResolvedValue('granted'),
      },
    });
    service.bindAdapter(adapter);
    await service.start();

    await service.end();
    service.handleProviderStatus('connected');

    expect(service.getSnapshot().connection).toBe('idle');
    expect(adapter.endSession).toHaveBeenCalledTimes(1);
  });
});
