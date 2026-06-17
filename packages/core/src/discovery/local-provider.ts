import type {
  GeoArea,
  HeardEntry,
  Reflector,
  ReflectorRef,
  Repeater,
  Room,
} from '../domain/index.js';
import type { SourceDeps } from '../sources/types.js';
import { RepeaterBookSource, type RepeaterBookOptions } from '../sources/repeaterbook.js';
import { WiresXSource } from '../sources/wiresx.js';
import { YsfDvRefSource } from '../sources/ysf-dvref.js';
import { YsfDashboardSource } from '../sources/ysf-dashboard.js';
import type { DiscoveryProvider } from './discovery-provider.js';

export type LocalProviderDeps = SourceDeps;

export interface LocalProviderConfig {
  repeaterBook?: RepeaterBookOptions;
}

/**
 * Runs the same domain sources the server runs, embedded in-process. Used as
 * the desktop fallback (§2.1) and by the server itself.
 *
 * Politeness (§2.2): each source caches aggressively with TTLs aligned to
 * upstream cadences and honors the ~72 req/day Yaesu budget even here, so a
 * fallback storm can't turn into a thundering herd against the sources.
 */
export class LocalProvider implements DiscoveryProvider {
  private readonly repeaterBook: RepeaterBookSource;
  private readonly wiresX: WiresXSource;
  private readonly ysfRegistry: YsfDvRefSource;
  private readonly ysfDashboard: YsfDashboardSource;

  constructor(deps: LocalProviderDeps, config: LocalProviderConfig = {}) {
    this.repeaterBook = new RepeaterBookSource(deps, config.repeaterBook);
    this.wiresX = new WiresXSource(deps);
    this.ysfRegistry = new YsfDvRefSource(deps);
    this.ysfDashboard = new YsfDashboardSource(deps);
  }

  getRepeaters(area: GeoArea): Promise<Repeater[]> {
    return this.repeaterBook.getRepeaters(area);
  }

  getActiveRooms(): Promise<Room[]> {
    return this.wiresX.getActiveRooms();
  }

  getReflectors(): Promise<Reflector[]> {
    return this.ysfRegistry.getReflectors();
  }

  getLastHeard(target: ReflectorRef): Promise<HeardEntry[]> {
    return this.ysfDashboard.getLastHeard(target);
  }
}
