import type { GeoArea, Repeater, RfChannel } from '../domain/index.js';
import { cached } from '../cache/cached.js';
import { TTL } from '../cache/ttl.js';
import type { SourceDeps } from './types.js';

/**
 * RepeaterBook adapter — the primary source of geolocated RF repeaters (§4.1).
 * Public API, no scraping. This is the Fase 0 source behind the map.
 *
 * The response mapping is intentionally minimal here; the exact query params
 * and column set get firmed up during Fase 0 wiring (initial scope: Italy, §10).
 */
export class RepeaterBookSource {
  constructor(private readonly deps: SourceDeps) {}

  getRepeaters(area: GeoArea): Promise<Repeater[]> {
    const key = `repeaterbook:${area.south},${area.west},${area.north},${area.east}`;
    return cached(this.deps, key, TTL.repeaterBook, async () => {
      const res = await this.deps.http.request({
        url: this.buildUrl(area),
        method: 'GET',
        headers: {
          accept: 'application/json',
          'user-agent': 'FusionDeck/0.0 (+https://github.com/LucioBrucio/FusionDeck)',
        },
      });
      if (res.status !== 200) {
        throw new Error(`RepeaterBook HTTP ${res.status}`);
      }
      const rows = await res.json<RepeaterBookRow[]>();
      return rows.map((row) => this.normalize(row));
    });
  }

  private buildUrl(area: GeoArea): string {
    // Placeholder query — RepeaterBook's export endpoint params are plugged in
    // during wiring. Keeping the adapter shape stable now is the point.
    const q = new URLSearchParams({
      lat: String((area.north + area.south) / 2),
      lng: String((area.east + area.west) / 2),
    });
    return `https://www.repeaterbook.com/api/export.php?${q.toString()}`;
  }

  private normalize(row: RepeaterBookRow): Repeater {
    const linkedFreq: RfChannel = {
      rxFreqHz: Math.round(Number(row.Frequency) * 1e6),
      txFreqHz: Math.round(Number(row.InputFreq ?? row.Frequency) * 1e6),
      mode: 'C4FM/FM',
    };
    const repeater: Repeater = {
      id: `rb:${row.State_ID ?? ''}:${row.Rptr_ID ?? row.Callsign}`,
      name: row.Landmark || row.Callsign,
      callsign: row.Callsign,
      network: 'fm',
      linkedFreq,
    };
    if (row.Lat && row.Long) {
      repeater.geoloc = { lat: Number(row.Lat), lng: Number(row.Long), accuracy: 'exact' };
    }
    return repeater;
  }
}

/** Partial RepeaterBook row — extend as the mapping is finalized. */
interface RepeaterBookRow {
  Rptr_ID?: string;
  State_ID?: string;
  Callsign: string;
  Frequency: string;
  InputFreq?: string;
  Landmark?: string;
  Lat?: string;
  Long?: string;
}
