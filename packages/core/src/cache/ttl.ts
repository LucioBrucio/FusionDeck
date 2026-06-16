/**
 * Cache TTLs (ms), aligned to upstream refresh cadences (§4.1).
 *
 * These caps are how the LocalProvider stays polite even during a fallback
 * storm (§2.2): aggressive caching keeps us well under the ~72 req/day Yaesu
 * budget when many desktop clients drop to local at once.
 */
export const TTL = {
  /** RepeaterBook is fairly static. */
  repeaterBook: 24 * 60 * 60_000,
  /** WIRES-X active pages refresh ~20 min. */
  wiresX: 20 * 60_000,
  /** YSF reflector mirrors (pistar.uk / W0CHP) refresh hourly. */
  ysfRegistry: 60 * 60_000,
  /** Dashboard last-heard is near real-time. */
  ysfDashboard: 30_000,
  /** aprs.fi liveness. */
  aprs: 5 * 60_000,
} as const;
