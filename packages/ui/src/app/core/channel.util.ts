import type { Channel, FusionEntity, RfChannel } from '@fusiondeck/core';

/** Map a discovered station into a radio memory channel. */
export function stationToChannel(station: FusionEntity, index: number): Channel {
  const rf = station.linkedFreq;
  return {
    index,
    name: (station.callsign ?? station.name).slice(0, 16),
    rxFreqHz: rf?.rxFreqHz ?? 0,
    txFreqHz: rf?.txFreqHz ?? rf?.rxFreqHz ?? 0,
    mode: mapMode(rf?.mode),
  };
}

function mapMode(mode: RfChannel['mode']): Channel['mode'] {
  switch (mode) {
    case 'FM':
      return 'FM';
    case 'C4FM':
      return 'C4FM';
    case 'C4FM/FM':
      return 'AMS';
    default:
      return 'C4FM';
  }
}

export function formatMhz(hz: number): string {
  return hz ? (hz / 1e6).toFixed(4) : '—';
}

export function bandOf(hz: number): string {
  const mhz = hz / 1e6;
  if (mhz >= 144 && mhz <= 146) return '2 m';
  if (mhz >= 430 && mhz <= 440) return '70 cm';
  if (mhz >= 50 && mhz <= 54) return '6 m';
  return '';
}

/** A station is "live" if a network source reported a recent last-heard entry. */
export function isLive(station: FusionEntity): boolean {
  return !!station.lastHeard?.length;
}
