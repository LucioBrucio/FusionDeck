import { describe, expect, it } from 'vitest';
import { RepeaterBookSource } from './repeaterbook.js';
import { MemoryCacheStore } from '../cache/memory-cache-store.js';
import type { Clock, HttpClient, HttpResponse, Logger } from '../ports/index.js';

const SILENT_LOG: Logger = { debug() {}, info() {}, warn() {}, error() {} };

class FakeClock implements Clock {
  constructor(public t = 0) {}
  now(): number {
    return this.t;
  }
}

function jsonResponse(status: number, body: unknown): HttpResponse {
  return {
    status,
    headers: {},
    text: async () => JSON.stringify(body),
    json: async <T>() => body as T,
  };
}

const WORLD = { north: 90, south: -90, east: 180, west: -180 };

describe('RepeaterBookSource', () => {
  it('negative-caches failures: no re-hit during the back-off window (§2.2)', async () => {
    let calls = 0;
    const http: HttpClient = {
      async request() {
        calls++;
        return jsonResponse(401, { ok: false, error_code: 'auth_missing' });
      },
    };
    const clock = new FakeClock(0);
    const src = new RepeaterBookSource({ http, cache: new MemoryCacheStore(clock), clock, log: SILENT_LOG });

    await expect(src.getRepeaters(WORLD)).rejects.toThrow();
    expect(calls).toBe(1);

    // Still within back-off → served from the negative cache, no network call.
    await expect(src.getRepeaters(WORLD)).rejects.toThrow();
    expect(calls).toBe(1);

    // Past the back-off window → retries exactly once more.
    clock.t = 61_000;
    await expect(src.getRepeaters(WORLD)).rejects.toThrow();
    expect(calls).toBe(2);
  });

  it('parses, geo-filters, and flags System Fusion vs FM', async () => {
    const body = {
      count: 2,
      results: [
        {
          'State ID': 'IT',
          'Rptr ID': '1',
          Callsign: 'IR2X',
          Frequency: '430.4625',
          'Input Freq': '439.4625',
          Landmark: 'Milano',
          Lat: '45.5',
          Long: '9.2',
          'System Fusion': 'Yes',
          'FM Analog': 'Yes',
        },
        {
          'State ID': 'IT',
          'Rptr ID': '2',
          Callsign: 'IR9Y',
          Frequency: '145.6',
          'Input Freq': '145.0',
          Lat: '37.5',
          Long: '15.0',
          'FM Analog': 'Yes',
        },
      ],
    };
    const http: HttpClient = {
      async request() {
        return jsonResponse(200, body);
      },
    };
    const clock = new FakeClock(0);
    const src = new RepeaterBookSource({ http, cache: new MemoryCacheStore(clock), clock, log: SILENT_LOG });

    // Box around Milan only — the Sicilian repeater is filtered out.
    const milan = await src.getRepeaters({ north: 46, south: 45, east: 10, west: 8 });
    expect(milan).toHaveLength(1);
    expect(milan[0]?.callsign).toBe('IR2X');
    expect(milan[0]?.linkedFreq.mode).toBe('C4FM/FM');
    expect(milan[0]?.linkedFreq.rxFreqHz).toBe(430_462_500);
    expect(milan[0]?.linkedFreq.txFreqHz).toBe(439_462_500);
  });
});
