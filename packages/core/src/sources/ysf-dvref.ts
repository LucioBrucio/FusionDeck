import type { Reflector } from '../domain/index.js';
import type { SourceDeps } from './types.js';

/**
 * YSF reflector registry adapter (§4.1). The authoritative list migrated from
 * the YSFReflector Registry to DVRef in June 2025; the pistar.uk / W0CHP
 * mirrors (hourly, ~1650 reflectors) are good for cross-check and enrichment.
 *
 * Fase 3 feature — stubbed for the Fase 0 skeleton.
 */
export class YsfDvRefSource {
  constructor(private readonly deps: SourceDeps) {}

  async getReflectors(): Promise<Reflector[]> {
    this.deps.log.debug('YsfDvRefSource.getReflectors: not implemented yet (Fase 3)');
    return [];
  }
}
