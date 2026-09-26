/**
 * `npm run reset` — drops the stored dataset and reseeds the canonical 2026
 * scenario. Works against whichever backend `MONGO_URI` selects.
 */
import { backendName, getDb, hardReset, shutdownStore } from '../src/store.js';
import { initStore } from '../src/store.js';

await initStore();
const before = getDb();
console.log(
  `Before: ${before.products.length} SKUs, ${before.ledger.length} ledger entries (${backendName()})`,
);

await hardReset();

const after = getDb();
console.log(
  `After:  ${after.products.length} SKUs, ${after.ledger.length} ledger entries (${backendName()})`,
);
console.log('Database reseeded.');

await shutdownStore();
