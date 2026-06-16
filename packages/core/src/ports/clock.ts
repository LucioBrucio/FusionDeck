/** Time port — injected so cache TTL and staleness logic stay deterministic and testable. */
export interface Clock {
  /** Epoch millis. */
  now(): number;
}
