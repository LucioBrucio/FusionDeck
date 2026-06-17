// Domain model (§4.4)
export type * from './domain/index.js';

// Hexagonal ports (§2)
export type * from './ports/index.js';

// Radio codec contracts (§3.2)
export type * from './codec/index.js';

// Discovery (§2.1)
export type { DiscoveryProvider } from './discovery/discovery-provider.js';
export { DEFAULT_DISCOVERY_POLICY, type DiscoveryPolicy } from './discovery/policy.js';
export { DiscoveryGateway, type DiscoveryGatewayDeps } from './discovery/discovery-gateway.js';
export { RemoteProvider, type RemoteProviderOptions } from './discovery/remote-provider.js';
export {
  LocalProvider,
  type LocalProviderDeps,
  type LocalProviderConfig,
} from './discovery/local-provider.js';

// Cache
export { MemoryCacheStore } from './cache/memory-cache-store.js';
export { cached, type CachedDeps } from './cache/cached.js';
export { TTL } from './cache/ttl.js';

// Sources
export * from './sources/index.js';
