import type { CacheStore, Clock, HttpClient, Logger } from '../ports/index.js';

/** Dependencies every discovery source needs — the injected I/O ports. */
export interface SourceDeps {
  http: HttpClient;
  cache: CacheStore;
  clock: Clock;
  log: Logger;
}
