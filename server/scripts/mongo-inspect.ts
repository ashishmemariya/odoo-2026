/**
 * Read-only inspection of the Atlas database: collection names, counts and a
 * sample of identifying fields. Never prints credentials.
 */
import dotenv from 'dotenv';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { closeMongo, connectMongo } from '../src/db/mongo.js';

const here = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(here, '../.env') });

const name = await connectMongo();
console.log(`database: ${name}`);

const { mongoDb } = await import('../src/db/mongo.js');
const d = mongoDb();

const names = (await d.listCollections().toArray()).map((c) => c.name).sort();
console.log(`collections: ${names.join(', ')}`);

for (const n of names) {
  const count = await d.collection(n).countDocuments();
  console.log(`  ${n}: ${count}`);
}

const meta = await d.collection('meta').findOne({ _id: 'stocksense' });
console.log(`meta.version=${meta?.version} signature=${String(meta?.signature).slice(0, 60)}...`);

const skus = await d.collection('products').find({}, { projection: { sku: 1 } }).limit(40).toArray();
console.log(`product skus: ${skus.map((s) => s.sku).join(', ')}`);

const led = await d.collection('ledger').find({}, { projection: { id: 1, type: 1 } }).limit(6).toArray();
console.log(`ledger sample: ${JSON.stringify(led)}`);

await closeMongo();
