import type { Channel, RadioCodec } from '@fusiondeck/core';
import { FTM510DE_SD_LAYOUT } from './sd-layout.js';

/**
 * Yaesu FTM-510DE codec (§5).
 *
 * Transport is the SD card — no serial protocol (§5.1). The binary `.dat`
 * format still needs reverse-engineering via controlled diffing (§5.3):
 * frequencies likely BCD, names ASCII, tone/DG-ID/mode as flags/indices, plus
 * a trailing checksum to recompute (or the radio rejects the file).
 *
 * Until that mapping lands (Fase 2), `parse`/`serialize` throw. The CSV path
 * (Fase 1, Tier 1) in ./csv needs no binary RE and is the MVP.
 */
export class Ftm510deCodec implements RadioCodec {
  readonly model = 'FTM-510DE';
  readonly sdLayout = FTM510DE_SD_LAYOUT;

  parse(_dat: Uint8Array): Channel[] {
    throw new Error('FTM-510DE .dat parsing not implemented yet (Fase 2 — see docs/DESIGN.md §5.3)');
  }

  serialize(_channels: Channel[]): Uint8Array {
    throw new Error(
      'FTM-510DE .dat serialization not implemented yet (Fase 2 — see docs/DESIGN.md §5.3)',
    );
  }
}

export { FTM510DE_SD_LAYOUT } from './sd-layout.js';
export { toAdms18Csv } from './csv.js';
