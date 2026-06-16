import type { HeardEntry, ReflectorRef } from '../domain/index.js';
import type { SourceDeps } from './types.js';

/**
 * YSF per-reflector dashboard adapter (DG9VH-style), §4.1. Provides the real
 * "Currently TXing" + last-heard list by reading the reflector logfile.
 *
 * Honesty caveat (§4.3): this is *network* activity only — purely local RF
 * QSOs not forwarded to a reflector are invisible here. Never present it as
 * "everything heard on the repeater".
 *
 * Fase 3 feature — stubbed for the Fase 0 skeleton.
 */
export class YsfDashboardSource {
  constructor(private readonly deps: SourceDeps) {}

  async getLastHeard(target: ReflectorRef): Promise<HeardEntry[]> {
    this.deps.log.debug('YsfDashboardSource.getLastHeard: not implemented yet (Fase 3)', {
      target: target.id,
    });
    return [];
  }
}
