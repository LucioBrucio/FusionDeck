import type {
  GeoArea,
  HeardEntry,
  Reflector,
  ReflectorRef,
  Repeater,
  Room,
} from '../domain/index.js';
import type { Clock, Logger } from '../ports/index.js';
import type { DiscoveryProvider } from './discovery-provider.js';
import { DEFAULT_DISCOVERY_POLICY, type DiscoveryPolicy } from './policy.js';

export interface DiscoveryGatewayDeps {
  remote: DiscoveryProvider;
  local: DiscoveryProvider;
  clock: Clock;
  log: Logger;
  policy?: Partial<DiscoveryPolicy>;
}

/**
 * Remote-first discovery with transparent local fallback (§2.1).
 *
 * Each call races the remote provider against the policy timeout. On timeout,
 * error, or unreachable remote we fall back to the embedded LocalProvider. The
 * switch is invisible to the UI — both sides satisfy DiscoveryProvider.
 *
 * TODO(§10): layer in staleness comparison, a remote health-check, and the
 * stale-while-revalidate path. Today's gateway covers timeout + error
 * fallback, which is the load-bearing case; thresholds are still open.
 */
export class DiscoveryGateway implements DiscoveryProvider {
  private readonly policy: DiscoveryPolicy;

  constructor(private readonly deps: DiscoveryGatewayDeps) {
    this.policy = { ...DEFAULT_DISCOVERY_POLICY, ...deps.policy };
  }

  getRepeaters(area: GeoArea): Promise<Repeater[]> {
    return this.withFallback('getRepeaters', (p) => p.getRepeaters(area));
  }

  getActiveRooms(): Promise<Room[]> {
    return this.withFallback('getActiveRooms', (p) => p.getActiveRooms());
  }

  getReflectors(): Promise<Reflector[]> {
    return this.withFallback('getReflectors', (p) => p.getReflectors());
  }

  getLastHeard(target: ReflectorRef): Promise<HeardEntry[]> {
    return this.withFallback('getLastHeard', (p) => p.getLastHeard(target));
  }

  private async withFallback<T>(
    op: string,
    call: (p: DiscoveryProvider) => Promise<T>,
  ): Promise<T> {
    try {
      return await this.withTimeout(call(this.deps.remote), this.policy.remoteTimeoutMs);
    } catch (err) {
      this.deps.log.warn(`discovery.${op}: remote failed, falling back to local`, {
        error: err instanceof Error ? err.message : String(err),
      });
      return call(this.deps.local);
    }
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`remote timed out after ${ms}ms`)), ms);
      promise.then(
        (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        (error: unknown) => {
          clearTimeout(timer);
          reject(error instanceof Error ? error : new Error(String(error)));
        },
      );
    });
  }
}
