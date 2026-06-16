import type { Liveness } from '../domain/index.js';
import type { SourceDeps } from './types.js';

/**
 * aprs.fi adapter (§4.1) — confirms a station is "alive" via its last-seen
 * timestamp. Requires an API key. Used for liveness enrichment, not primary
 * discovery.
 *
 * Fase 3 feature — stubbed for the Fase 0 skeleton.
 */
export class AprsSource {
  constructor(private readonly deps: SourceDeps) {}

  async getLiveness(callsign: string): Promise<Liveness | undefined> {
    this.deps.log.debug('AprsSource.getLiveness: not implemented yet (Fase 3)', { callsign });
    return undefined;
  }
}
