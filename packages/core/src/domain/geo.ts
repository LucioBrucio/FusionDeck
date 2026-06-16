export interface GeoPoint {
  lat: number;
  lng: number;
}

/**
 * Provenance of a coordinate. Surfaced in the UI for honesty (§4.3): a
 * WIRES-X room's location is owner-declared, not measured.
 */
export type GeoAccuracy = 'exact' | 'owner-declared' | 'none';

export interface GeoLocation extends GeoPoint {
  accuracy: GeoAccuracy;
}

/** A geographic query window (bounding box) used by discovery sources. */
export interface GeoArea {
  north: number;
  south: number;
  east: number;
  west: number;
}
