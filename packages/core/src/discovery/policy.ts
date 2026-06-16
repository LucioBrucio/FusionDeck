/**
 * Tunables for the remote-first → local fallback decision (§2.1).
 * The exact thresholds are an open question (§10) — these are provisional.
 */
export interface DiscoveryPolicy {
  /** Abort the remote call after this many ms and fall back to local. */
  remoteTimeoutMs: number;
  /** Remote data older than this is considered stale → prefer local. */
  stalenessMs: number;
  /** When true, serve cached/stale data immediately, then revalidate. */
  staleWhileRevalidate: boolean;
}

export const DEFAULT_DISCOVERY_POLICY: DiscoveryPolicy = {
  remoteTimeoutMs: 4_000,
  stalenessMs: 30 * 60_000,
  staleWhileRevalidate: true,
};
