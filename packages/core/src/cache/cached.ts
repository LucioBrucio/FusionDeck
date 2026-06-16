import type { CacheStore, Clock, Logger } from '../ports/index.js';

export interface CachedDeps {
  cache: CacheStore;
  clock: Clock;
  log: Logger;
}

/**
 * Read-through cache with TTL. On a fresh hit returns the cached value;
 * otherwise runs `produce`, stores, and returns it.
 *
 * Resilience: if `produce` throws but a (stale) cached value exists, we serve
 * the stale value rather than failing — important for the fallback story (§2.1).
 */
export async function cached<T>(
  deps: CachedDeps,
  key: string,
  ttlMs: number,
  produce: () => Promise<T>,
): Promise<T> {
  const hit = await deps.cache.get<T>(key);
  const now = deps.clock.now();
  if (hit && now - hit.storedAt < ttlMs) {
    return hit.value;
  }
  try {
    const value = await produce();
    await deps.cache.set(key, value);
    return value;
  } catch (err) {
    if (hit) {
      deps.log.warn(`cache "${key}": refresh failed, serving stale value`, {
        error: err instanceof Error ? err.message : String(err),
      });
      return hit.value;
    }
    throw err;
  }
}
