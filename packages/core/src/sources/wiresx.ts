import type { Room } from '../domain/index.js';
import type { SourceDeps } from './types.js';

/**
 * WIRES-X adapter (§4.1, §4.2). No public API → HTML scraping of Yaesu's
 * active node/room pages (refresh ~20 min). Prefer the Live-Wires-X JSON
 * mirror where possible and honor the ~72 req/day budget (§2.2).
 *
 * Fase 3 feature — stubbed for the Fase 0 skeleton.
 */
export class WiresXSource {
  constructor(private readonly deps: SourceDeps) {}

  async getActiveRooms(): Promise<Room[]> {
    this.deps.log.debug('WiresXSource.getActiveRooms: not implemented yet (Fase 3)');
    return [];
  }
}
