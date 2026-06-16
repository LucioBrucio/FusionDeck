import type { GeoLocation } from './geo.js';
import type { Network } from './network.js';

/** RF channel associated with a repeater (from RepeaterBook). Frequencies in Hz. */
export interface RfChannel {
  rxFreqHz: number;
  txFreqHz: number;
  toneHz?: number;
  mode?: 'FM' | 'C4FM' | 'C4FM/FM';
}

/** A single "last heard" record from a YSF reflector dashboard (§4.1). */
export interface HeardEntry {
  callsign: string;
  /** ISO 8601 timestamp. */
  at: string;
  /** Reflector / room the station was heard on. */
  target?: string;
  viaGateway?: string;
}

/** Liveness signal cross-checked from a third source, e.g. aprs.fi (§4.1). */
export interface Liveness {
  source: string;
  /** ISO 8601 timestamp. */
  lastSeen: string;
}

/**
 * Unified, source-independent Fusion entity (§4.4). The normalize layer maps
 * every source into this shape so the UI and codec never see source quirks.
 */
export interface FusionEntity {
  id: string;
  name: string;
  callsign?: string;
  network: Network;
  geoloc?: GeoLocation;
  /** WIRES-X room popularity (connected nodes). */
  connectedCount?: number;
  /** YSF dashboard last-heard list. */
  lastHeard?: HeardEntry[];
  /** Associated RF repeater (RepeaterBook). */
  linkedFreq?: RfChannel;
  liveness?: Liveness;
}

/** An RF repeater as returned by RepeaterBook — always carries an RF channel. */
export interface Repeater extends FusionEntity {
  network: 'fm' | 'ysf' | 'wiresx';
  linkedFreq: RfChannel;
}

/** A WIRES-X room / node. */
export interface Room extends FusionEntity {
  network: 'wiresx';
}

/** A YSF reflector. */
export interface Reflector extends FusionEntity {
  network: 'ysf';
}

/** Lightweight reference to a reflector for last-heard queries. */
export interface ReflectorRef {
  id: string;
  name?: string;
}
