/**
 * `npm run reset` — drops the stored dataset and reseeds the canonical 2026
 * scenario. Works against whichever backend `MONGO_URI` selects.
 */
import dotenv from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { backendName, getDb, hardReset, initStore, shutdownStore } from '../src/store.js';

const here = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(here, '../.env') });

// Must follow the dotenv load: the backend is chosen from MONGO_URI.
const { backend } = await initStore();

const before = getDb();
console.log(
  `Before: ${before.products.length} SKUs, ${before.ledger.length} ledger entries (${backend})`,
);

await hardReset();

const after = getDb();
console.log(`After:  ${after.products.length} SKUs, ${after.ledger.length} ledger entries (${backendName()})`);
console.log(`Database reseeded via ${backendName()}.`);

await shutdownStore();
