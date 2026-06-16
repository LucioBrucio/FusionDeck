import { describe, expect, it } from 'vitest';
import type { Repeater } from '../domain/index.js';
import type { Clock, Logger } from '../ports/index.js';
import { DiscoveryGateway } from './discovery-gateway.js';
import type { DiscoveryProvider } from './discovery-provider.js';

const SILENT_LOG: Logger = { debug() {}, info() {}, warn() {}, error() {} };
const CLOCK: Clock = { now: () => 0 };
const AREA = { north: 46, south: 45, east: 10, west: 9 };

function repeater(id: string): Repeater {
  return {
    id,
    name: id,
    network: 'fm',
    linkedFreq: { rxFreqHz: 145_000_000, txFreqHz: 145_000_000 },
  };
}

function provider(repeaters: Repeater[], override?: Partial<DiscoveryProvider>): DiscoveryProvider {
  return {
    getRepeaters: async () => repeaters,
    getActiveRooms: async () => [],
    getReflectors: async () => [],
    getLastHeard: async () => [],
    ...override,
  };
}

describe('DiscoveryGateway', () => {
  it('prefers the remote provider when it succeeds', async () => {
    const gw = new DiscoveryGateway({
      remote: provider([repeater('remote')]),
      local: provider([repeater('local')]),
      clock: CLOCK,
      log: SILENT_LOG,
    });
    const out = await gw.getRepeaters(AREA);
    expect(out[0]?.id).toBe('remote');
  });

  it('falls back to local when the remote throws', async () => {
    const gw = new DiscoveryGateway({
      remote: provider([], {
        getRepeaters: async () => {
          throw new Error('remote down');
        },
      }),
      local: provider([repeater('local')]),
      clock: CLOCK,
      log: SILENT_LOG,
    });
    const out = await gw.getRepeaters(AREA);
    expect(out[0]?.id).toBe('local');
  });

  it('falls back to local when the remote exceeds the timeout', async () => {
    const gw = new DiscoveryGateway({
      remote: provider([], { getRepeaters: () => new Promise<Repeater[]>(() => {}) }),
      local: provider([repeater('local')]),
      clock: CLOCK,
      log: SILENT_LOG,
      policy: { remoteTimeoutMs: 20 },
    });
    const out = await gw.getRepeaters(AREA);
    expect(out[0]?.id).toBe('local');
  });
});
