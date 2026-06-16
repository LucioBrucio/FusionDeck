/**
 * The parallel networks FusionDeck unifies (§4.2).
 *
 * - `wiresx` — Yaesu's proprietary WIRES-X network (connectivity + popularity,
 *   no "who's talking now", no public API).
 * - `ysf` — the open YSF ecosystem (downloadable reflector lists, hourly
 *   mirrors, per-reflector last-heard dashboards).
 * - `fm` — plain analog FM repeaters.
 */
export type Network = 'wiresx' | 'ysf' | 'fm';
