import type { FusionEntity } from '@fusiondeck/core';

/**
 * Sample stations so the UI renders meaningfully before the backend +
 * RepeaterBook wiring exist. StationsStore.load() replaces these with live
 * data once the server (or embedded LocalProvider) answers.
 */
export const SAMPLE_STATIONS: FusionEntity[] = [
  {
    id: 'rb:it:IR1UBN',
    name: 'Torino — Eremo',
    callsign: 'IR1UBN',
    network: 'fm',
    geoloc: { lat: 45.05, lng: 7.69, accuracy: 'exact' },
    linkedFreq: { rxFreqHz: 430_462_500, txFreqHz: 439_462_500, mode: 'C4FM/FM' },
    lastHeard: [{ callsign: 'IW1QLH', at: '2026-06-16T20:31:00Z' }],
  },
  {
    id: 'rb:it:IR2UCJ',
    name: 'Milano — Monte Penice',
    callsign: 'IR2UCJ',
    network: 'fm',
    geoloc: { lat: 44.85, lng: 9.27, accuracy: 'exact' },
    linkedFreq: { rxFreqHz: 145_287_500, txFreqHz: 144_687_500, mode: 'C4FM' },
  },
  {
    id: 'rb:it:IR5UCA',
    name: 'Firenze — Monte Morello',
    callsign: 'IR5UCA',
    network: 'fm',
    geoloc: { lat: 43.85, lng: 11.23, accuracy: 'exact' },
    linkedFreq: { rxFreqHz: 430_937_500, txFreqHz: 439_937_500, mode: 'C4FM/FM' },
    lastHeard: [{ callsign: 'IZ5ABC', at: '2026-06-16T20:28:00Z' }],
  },
  {
    id: 'rb:it:IR0UGM',
    name: 'Roma — Monte Cavo',
    callsign: 'IR0UGM',
    network: 'fm',
    geoloc: { lat: 41.74, lng: 12.71, accuracy: 'exact' },
    linkedFreq: { rxFreqHz: 431_012_500, txFreqHz: 439_412_500, mode: 'C4FM/FM' },
  },
  {
    id: 'ysf:ITALY',
    name: 'YSF Italy',
    callsign: 'IT-ITALY',
    network: 'ysf',
    geoloc: { lat: 45.46, lng: 9.19, accuracy: 'owner-declared' },
    connectedCount: 38,
    lastHeard: [{ callsign: 'IK2XYZ', at: '2026-06-16T20:33:00Z', target: 'ITALY' }],
  },
  {
    id: 'wiresx:LOMBARDIA',
    name: 'WIRES-X Lombardia',
    callsign: 'LOMBARDIA',
    network: 'wiresx',
    geoloc: { lat: 45.7, lng: 9.67, accuracy: 'owner-declared' },
    connectedCount: 142,
  },
  {
    id: 'ysf:CISAR',
    name: 'YSF CISAR',
    callsign: 'IT-CISAR',
    network: 'ysf',
    geoloc: { lat: 41.9, lng: 12.5, accuracy: 'owner-declared' },
    connectedCount: 12,
  },
];
