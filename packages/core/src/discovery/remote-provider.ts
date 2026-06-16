import type {
  GeoArea,
  HeardEntry,
  Reflector,
  ReflectorRef,
  Repeater,
  Room,
} from '../domain/index.js';
import type { HttpClient, Logger } from '../ports/index.js';
import type { DiscoveryProvider } from './discovery-provider.js';

export interface RemoteProviderOptions {
  /** Base URL of the central community API, e.g. https://api.fusiondeck.dev */
  baseUrl: string;
  timeoutMs?: number;
}

/** Talks to the central community API — the preferred path (§2.1). */
export class RemoteProvider implements DiscoveryProvider {
  constructor(
    private readonly http: HttpClient,
    private readonly opts: RemoteProviderOptions,
    private readonly log: Logger,
  ) {}

  getRepeaters(area: GeoArea): Promise<Repeater[]> {
    const q = new URLSearchParams({
      north: String(area.north),
      south: String(area.south),
      east: String(area.east),
      west: String(area.west),
    });
    return this.get<Repeater[]>(`/api/v1/repeaters?${q.toString()}`);
  }

  getActiveRooms(): Promise<Room[]> {
    return this.get<Room[]>('/api/v1/rooms');
  }

  getReflectors(): Promise<Reflector[]> {
    return this.get<Reflector[]>('/api/v1/reflectors');
  }

  getLastHeard(target: ReflectorRef): Promise<HeardEntry[]> {
    return this.get<HeardEntry[]>(
      `/api/v1/reflectors/${encodeURIComponent(target.id)}/last-heard`,
    );
  }

  private async get<T>(path: string): Promise<T> {
    const res = await this.http.request({
      url: `${this.opts.baseUrl}${path}`,
      method: 'GET',
      headers: { accept: 'application/json' },
      timeoutMs: this.opts.timeoutMs,
    });
    if (res.status < 200 || res.status >= 300) {
      this.log.warn(`remote discovery ${path} → HTTP ${res.status}`);
      throw new Error(`Remote discovery ${path} failed: HTTP ${res.status}`);
    }
    return res.json<T>();
  }
}
