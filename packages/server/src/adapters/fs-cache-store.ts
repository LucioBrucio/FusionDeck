import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { CacheEntry, CacheStore, Clock } from '@fusiondeck/core';

/** Filesystem CacheStore — one JSON file per key under `dir`. */
export class FsCacheStore implements CacheStore {
  constructor(
    private readonly dir: string,
    private readonly clock: Clock,
  ) {}

  private path(key: string): string {
    const hash = createHash('sha1').update(key).digest('hex');
    return join(this.dir, `${hash}.json`);
  }

  async get<T>(key: string): Promise<CacheEntry<T> | undefined> {
    try {
      const raw = await readFile(this.path(key), 'utf8');
      return JSON.parse(raw) as CacheEntry<T>;
    } catch {
      return undefined;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    const entry: CacheEntry<T> = { value, storedAt: this.clock.now() };
    await writeFile(this.path(key), JSON.stringify(entry), 'utf8');
  }

  async delete(key: string): Promise<void> {
    await rm(this.path(key), { force: true });
  }
}
