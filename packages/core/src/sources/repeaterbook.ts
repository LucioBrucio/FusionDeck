import type { GeoArea, Repeater, RfChannel } from '../domain/index.js';
import { cached } from '../cache/cached.js';
import { TTL } from '../cache/ttl.js';
import type { SourceDeps } from './types.js';

export interface RepeaterBookOptions {
  /** RepeaterBook "rest of world" country filter (initial scope: Italy, §10). */
  country?: string;
  /**
   * RepeaterBook application token. Since 2025 the API is gated; request one
   * (non-commercial is free but discretionary) at
   * https://www.repeaterbook.com/api/token_request.php — sent as X-RB-App-Token.
   */
  appToken?: string;
  /**
   * User-Agent. RepeaterBook requires an app identifier plus a contact email
   * and rejects generic agents — override with your own contact for approval,
   * e.g. "FusionDeck/0.1 (+https://github.com/LucioBrucio/FusionDeck; you@example.com)".
   */
  userAgent?: string;
}

/** RepeaterBook export endpoint for countries outside North America. */
const ROW_ENDPOINT = 'https://www.repeaterbook.com/api/exportROW.php';

const DEFAULT_UA = 'FusionDeck/0.1 (+https://github.com/LucioBrucio/FusionDeck)';

/**
 * RepeaterBook adapter — the primary source of geolocated RF repeaters (§4.1).
 * Public API, no scraping.
 *
 * Politeness (§2.2): we fetch a whole country once and cache it (RepeaterBook
 * is fairly static, 24h TTL), then filter by the requested area in-memory. A
 * map pan therefore costs zero extra upstream requests within the TTL window.
 */
export class RepeaterBookSource {
  private readonly country: string;
  private readonly appToken: string | undefined;
  private readonly userAgent: string;

  private static readonly FAILURE_BACKOFF_MS = 60_000;
  /** Epoch millis until which we skip RepeaterBook after a failure (§2.2). */
  private failedUntil = 0;

  constructor(
    private readonly deps: SourceDeps,
    options: RepeaterBookOptions = {},
  ) {
    this.country = options.country ?? 'Italy';
    this.appToken = options.appToken;
    this.userAgent = options.userAgent ?? DEFAULT_UA;
  }

  async getRepeaters(area: GeoArea): Promise<Repeater[]> {
    const all = await this.fetchCountry();
    return all.filter((repeater) => inArea(repeater, area));
  }

  private fetchCountry(): Promise<Repeater[]> {
    const key = `repeaterbook:country:${this.country}`;
    return cached(this.deps, key, TTL.repeaterBook, async () => {
      // Negative cache (§2.2): after a failure, skip RepeaterBook for a back-off
      // window. Without this, every map pan would retry a 401/429 immediately.
      if (this.deps.clock.now() < this.failedUntil) {
        throw new Error('RepeaterBook in back-off after a recent failure; not retrying yet.');
      }
      try {
        return await this.requestCountry();
      } catch (err) {
        this.failedUntil = this.deps.clock.now() + RepeaterBookSource.FAILURE_BACKOFF_MS;
        throw err;
      }
    });
  }

  private async requestCountry(): Promise<Repeater[]> {
    const url = `${ROW_ENDPOINT}?country=${encodeURIComponent(this.country)}`;
    const headers: Record<string, string> = {
      accept: 'application/json',
      'user-agent': this.userAgent,
    };
    // Preferred auth header per RepeaterBook API docs.
    if (this.appToken) headers['x-rb-app-token'] = this.appToken;

    const res = await this.deps.http.request({ url, method: 'GET', headers });

    if (res.status === 401 || res.status === 403) {
      throw new Error(
        `RepeaterBook auth failed (HTTP ${res.status}). The API now requires an approved ` +
          'application token — set REPEATERBOOK_TOKEN. Request one at ' +
          'https://www.repeaterbook.com/api/token_request.php',
      );
    }
    if (res.status === 429) {
      throw new Error('RepeaterBook rate-limited (HTTP 429) — backing off.');
    }
    if (res.status !== 200) {
      throw new Error(`RepeaterBook HTTP ${res.status} for country=${this.country}`);
    }

    const body = await res.json<RepeaterBookResponse>();
    const rows = body.results ?? [];
    this.deps.log.info('RepeaterBook fetched', { country: this.country, count: rows.length });
    return rows
      .map((row) => normalize(row))
      .filter((repeater): repeater is Repeater => repeater !== null);
  }
}

function inArea(repeater: Repeater, area: GeoArea): boolean {
  const g = repeater.geoloc;
  // Keep ungeolocated entries; the UI can still list them even off-map.
  if (!g) return true;
  return g.lat <= area.north && g.lat >= area.south && g.lng <= area.east && g.lng >= area.west;
}

function normalize(row: RepeaterBookRow): Repeater | null {
  const outputMhz = num(row.Frequency);
  if (outputMhz === null) return null; // no usable RF channel

  const inputMhz = num(row['Input Freq']);
  const fusion = isYes(row['System Fusion']);
  const fm = isYes(row['FM Analog']);
  const mode: RfChannel['mode'] = fusion ? (fm ? 'C4FM/FM' : 'C4FM') : 'FM';

  // RepeaterBook "Frequency" is the repeater output (radio RX); "Input Freq"
  // is the repeater input (radio TX).
  const linkedFreq: RfChannel = {
    rxFreqHz: Math.round(outputMhz * 1e6),
    txFreqHz: Math.round((inputMhz ?? outputMhz) * 1e6),
    mode,
  };
  const tone = num(row.PL);
  if (tone !== null) linkedFreq.toneHz = tone;

  const stateId = row['State ID'] ?? row.Country ?? '';
  const rptrId = row['Rptr ID'] ?? row.Callsign;
  const repeater: Repeater = {
    id: `rb:${stateId}:${rptrId}`,
    name: row.Landmark || row['Nearest City'] || row.City || row.Callsign,
    callsign: row.Callsign,
    network: 'fm',
    linkedFreq,
  };

  const lat = num(row.Lat);
  const lng = num(row.Long);
  if (lat !== null && lng !== null) {
    repeater.geoloc = { lat, lng, accuracy: 'exact' };
  }
  return repeater;
}

function num(value: string | undefined): number | null {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function isYes(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().toLowerCase() === 'yes';
}

interface RepeaterBookResponse {
  count?: number;
  results?: RepeaterBookRow[];
}

/** Subset of RepeaterBook's ROW export columns we consume. */
interface RepeaterBookRow {
  'State ID'?: string;
  'Rptr ID'?: string;
  Callsign: string;
  Frequency?: string;
  'Input Freq'?: string;
  PL?: string;
  Country?: string;
  City?: string;
  'Nearest City'?: string;
  Landmark?: string;
  Lat?: string;
  Long?: string;
  'FM Analog'?: string;
  'System Fusion'?: string;
}
