/**
 * `npm run mongo:check` — verifies the MONGO_URI in `server/.env` is reachable
 * and reports what is already stored, without mutating anything.
 */
import dotenv from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(here, '../../.env') });

const { closeMongo, connectMongo, mongoConfigured, readMongo } from await import('../src/db/mongo.js');

if (!mongoConfigured()) {
  console.error('MONGO_URI is not set in server/.env — nothing to check.');
  process.exit(1);
}

// Never print the URI: it carries the atlas password.
console.log('Connecting to MongoDB Atlas…');
const name = await connectMongo();
console.log(`Connected. Database: ${name}`);

const found = await readMongo();
if (!found) {
  console.log('No compatible dataset yet — the API will seed it on first boot.');
} else {
  const db = found.db;
  console.log(
    `Stored: ${db.products.length} products, ${db.ledger.length} ledger entries, ` +
      `${db.receipts.length} receipts, ${db.deliveries.length} deliveries, ` +
      `${db.transfers.length} transfers, ${db.adjustments.length} adjustments`,
  );
}

await closeMongo();
