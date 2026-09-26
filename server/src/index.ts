import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { api } from './routes.js';
import { HttpError } from './engine.js';
import { backendName, getDb, initStore, shutdownStore } from './store.js';

const here = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(here, '../.env') });
const PORT = Number(process.env.PORT ?? 4000);

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.use('/api', api);

app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Unknown API endpoint')));

// Serve the built client in production (`npm run build && npm start`).
const clientDist = resolve(here, '../../client/dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => res.sendFile(resolve(clientDist, 'index.html')));
}

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, ...(err.meta ?? {}) });
    return;
  }
  const message = err instanceof Error ? err.message : 'Unexpected server error';
  console.error('[stocksense]', message);
  res.status(500).json({ error: message });
});

// Connect the persistence backend before accepting traffic, so the very first
// request already sees a hydrated dataset (MongoDB when MONGO_URI is set).
const { seeded } = await initStore();
if (seeded) console.log('[stocksense] empty datastore — seeded the canonical 2026 scenario');

const server = app.listen(PORT, () => {
  const db = getDb();
  console.log(
    `StockSense API  ->  http://localhost:${PORT}/api/health   (${backendName()} · ${db.products.length} SKUs, ${db.ledger.length} ledger entries)`,
  );
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    server.close();
    void shutdownStore().finally(() => process.exit(0));
  });
}
