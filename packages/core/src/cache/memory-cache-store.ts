import type { CacheEntry, CacheStore, Clock } from '../ports/index.js';

/**
 * Minimal in-memory CacheStore. Isomorphic reference implementation — handy
 * for tests and as the desktop's first-run default before a persistent
 * adapter (SQLite / fs) is wired.
 */
export class MemoryCacheStore implements CacheStore {
  private readonly map = new Map<string, CacheEntry<unknown>>();

  constructor(private readonly clock: Clock) {}

  async get<T>(key: string): Promise<CacheEntry<T> | undefined> {
    return this.map.get(key) as CacheEntry<T> | undefined;
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.map.set(key, { value, storedAt: this.clock.now() });
  }

  async delete(key: string): Promise<void> {
    this.map.delete(key);
  }
}
