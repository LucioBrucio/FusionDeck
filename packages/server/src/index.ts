import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from '@fastify/cors';
import Fastify from 'fastify';
import { buildDiscovery } from './composition-root.js';
import { registerDiscoveryRoutes } from './routes/discovery.js';

// Load packages/server/.env if present (RepeaterBook token, port, etc.).
try {
  process.loadEnvFile();
} catch {
  // No .env file — fall back to the ambient environment.
}

const PORT = Number(process.env.PORT ?? 8787);
const HOST = process.env.HOST ?? '0.0.0.0';
const here = dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });

  const discovery = buildDiscovery({ cacheDir: join(here, '..', '.cache') });
  registerDiscoveryRoutes(app, discovery);

  app.get('/health', () => ({ status: 'ok', service: 'fusiondeck-server' }));

  await app.listen({ port: PORT, host: HOST });
}

main().catch((err: unknown) => {
  console.error('Failed to start FusionDeck server', err);
  process.exit(1);
});
