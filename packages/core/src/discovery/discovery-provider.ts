import type {
  GeoArea,
  HeardEntry,
  Reflector,
  ReflectorRef,
  Repeater,
  Room,
} from '../domain/index.js';

/**
 * The discovery contract (§2.1). One interface, two implementations:
 * `RemoteProvider` (calls the central community API) and `LocalProvider`
 * (runs the same core in-process). The `DiscoveryGateway` picks between them
 * at runtime, transparently to the UI.
 */
export interface DiscoveryProvider {
  getRepeaters(area: GeoArea): Promise<Repeater[]>;
  getActiveRooms(): Promise<Room[]>;
  getReflectors(): Promise<Reflector[]>;
  getLastHeard(target: ReflectorRef): Promise<HeardEntry[]>;
}
