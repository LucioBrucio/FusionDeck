export interface CacheEntry<T> {
  value: T;
  /** Epoch millis when this entry was stored. */
  storedAt: number;
}

/**
 * Cache port — a dumb key/value store. The domain owns TTL/staleness policy
 * (see cache/ttl + cache/cached); the store just persists.
 *
 * Host adapters: in-memory (default), filesystem (server), SQLite (desktop),
 * Redis (server at scale).
 */
export interface CacheStore {
  get<T>(key: string): Promise<CacheEntry<T> | undefined>;
  set<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
}
