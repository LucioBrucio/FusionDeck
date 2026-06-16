import type { DiscoveryProvider, GeoArea } from '@fusiondeck/core';
import type { FastifyInstance } from 'fastify';

/** REST surface mirroring the DiscoveryProvider contract (§2.1). */
export function registerDiscoveryRoutes(app: FastifyInstance, discovery: DiscoveryProvider): void {
  app.get('/api/v1/repeaters', async (req) => {
    const q = req.query as Record<string, string | undefined>;
    const area: GeoArea = {
      north: Number(q.north),
      south: Number(q.south),
      east: Number(q.east),
      west: Number(q.west),
    };
    return discovery.getRepeaters(area);
  });

  app.get('/api/v1/rooms', () => discovery.getActiveRooms());

  app.get('/api/v1/reflectors', () => discovery.getReflectors());

  app.get('/api/v1/reflectors/:id/last-heard', (req) => {
    const { id } = req.params as { id: string };
    return discovery.getLastHeard({ id });
  });
}
