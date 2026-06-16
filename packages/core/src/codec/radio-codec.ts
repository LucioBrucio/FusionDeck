/**
 * A single radio memory channel — the model-independent unit the codec layer
 * reads and writes. Frequencies in Hz. Extend cautiously; per-model quirks
 * belong inside the codec, not here.
 */
export interface Channel {
  index: number;
  name: string;
  rxFreqHz: number;
  txFreqHz: number;
  mode: 'FM' | 'C4FM' | 'AMS' | 'DN' | 'VW';
  toneHz?: number;
  /** Fusion DG-ID (0–99). */
  dgId?: number;
}

/**
 * Fixed SD-card folder/file layout a model expects (§5.1). The radio writes
 * and reads these paths via its on-device BACKUP menu — no serial protocol.
 */
export interface SdCardLayout {
  /** e.g. "FTM510D_MEMORY-CH/MEMFTM510D.dat" */
  memoryChannels: string;
  /** e.g. "FTM510D/BACKUP/CLNFTM510D.dat" */
  clone: string;
  /** e.g. "FTM510D/BACKUP/SYSFTM510D.dat" */
  system: string;
}

/**
 * Per-model codec (§3.2). The `.dat` format changes between models (the
 * FT3D→FT5D jump broke compatibility), so every radio is a separate plugin
 * behind this one interface.
 *
 * Uint8Array (not Node Buffer) keeps the contract isomorphic.
 */
export interface RadioCodec {
  readonly model: string;
  /** Parse a memory `.dat` buffer into channels. */
  parse(dat: Uint8Array): Channel[];
  /** Serialize channels back to a `.dat` buffer, recomputing the checksum. */
  serialize(channels: Channel[]): Uint8Array;
  readonly sdLayout: SdCardLayout;
}
