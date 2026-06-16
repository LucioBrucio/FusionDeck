import type { Channel } from '@fusiondeck/core';

/**
 * Tier 1 (Fase 1): emit a CSV importable by ADMS-18 — zero binary reverse
 * engineering (§5.2). This is the MVP path: ADMS-18 stays in the loop, but
 * FusionDeck owns the "map → channels" step.
 *
 * NOTE: ADMS-18's CSV carries a "Check" line/column the user must not hand-edit
 * (§5.3) — that warning is the tell that a checksum exists in the binary too.
 * The exact column set is finalized against ADMS-18's documented import format.
 */
export function toAdms18Csv(channels: Channel[]): string {
  const header = ['No.', 'Name', 'RX Frequency', 'TX Frequency', 'Mode', 'Tone'];
  const rows = channels.map((c) => [
    String(c.index),
    c.name,
    mhz(c.rxFreqHz),
    mhz(c.txFreqHz),
    c.mode,
    c.toneHz ? c.toneHz.toFixed(1) : '',
  ]);
  return [header, ...rows].map((cols) => cols.map(csvCell).join(',')).join('\r\n');
}

function mhz(hz: number): string {
  return (hz / 1e6).toFixed(5);
}

function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
