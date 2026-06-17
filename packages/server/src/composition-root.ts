import { LocalProvider, type DiscoveryProvider } from '@fusiondeck/core';
import { FsCacheStore } from './adapters/fs-cache-store.js';
import { PinoLogger } from './adapters/pino-logger.js';
import { SystemClock } from './adapters/system-clock.js';
import { UndiciHttpClient } from './adapters/undici-http-client.js';

export interface ServerConfig {
  cacheDir: string;
}

/**
 * Wires @fusiondeck/core with Node adapters. The central server runs the same
 * core the desktop embeds — only the injected ports differ (§2).
 */
export function buildDiscovery(config: ServerConfig): DiscoveryProvider {
  const clock = new SystemClock();
  return new LocalProvider(
    {
      http: new UndiciHttpClient(),
      cache: new FsCacheStore(config.cacheDir, clock),
      clock,
      log: new PinoLogger(),
    },
    {
      // RepeaterBook gates its API behind an approved token (see adapter).
      repeaterBook: {
        country: process.env.REPEATERBOOK_COUNTRY ?? 'Italy',
        appToken: process.env.REPEATERBOOK_TOKEN,
        userAgent: process.env.REPEATERBOOK_UA,
      },
    },
  );
}
