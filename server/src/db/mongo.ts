import { MongoClient, type Db } from 'mongodb';
import type { Database } from '../types.js';
import { SEED_VERSION } from '../seed.js';

/**
 * MongoDB persistence: one collection per top-level array plus a `meta`
 * document for scalars and id sequences.
 *
 * The engine keeps working against a plain in-memory `Database` object, so this
 * driver is deliberately dumb — it hydrates the whole dataset on boot and
 * rewrites the collections on `commit()`. That keeps every business rule in
 * `engine.ts` unchanged while the data lives in Atlas.
 */

const COLLECTIONS = [
  'users',
  'credentials',
  'warehouses',
  'locations',
  'products',
  'receipts',
  'deliveries',
  'transfers',
  'adjustments',
  'ledger',
] as const;

const META_ID = 'stocksense';

export interface MetaDoc {
  _id: string;
  version: number;
  settings: Database['settings'];
  seq: { ledger: number; receipt: number; delivery: number; transfer: number; adjustment: number };
}

let client: MongoClient | null = null;
let database: Db | null = null;

export function mongoConfigured(uri = process.env.MONGO_URI): boolean {
  return typeof uri === 'string' && uri.trim().length > 0;
}

export async function connectMongo(uri = process.env.MONGO_URI ?? ''): Promise<string> {
  client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  const name = new URL(uri).pathname.replace(/^\//, '') || 'stocksense';
  database = client.db(name);
  await database.command({ ping: 1 });
  return name;
}

export function mongoDb(): Db {
  if (!database) throw new Error('MongoDB is not connected');
  return database;
}

export async function closeMongo(): Promise<void> {
  await client?.close();
  client = null;
  database = null;
}

/** Reads the whole dataset, or null when it was never seeded at this version. */
export async function readMongo(): Promise<{ db: Database; seq: MetaDoc['seq'] } | null> {
  const d = mongoDb();
  const meta = (await d.collection<MetaDoc>('meta').findOne({ _id: META_ID })) as MetaDoc | null;
  if (!meta || meta.version !== SEED_VERSION) return null;

  const entries = await Promise.all(
    COLLECTIONS.map(async (name) => [name, await d.collection(name).find({}).toArray()] as const),
  );

  const db = { version: meta.version, settings: meta.settings } as unknown as Database;
  for (const [name, rows] of entries) {
    // `_id` is Mongo's own key; the domain ref/sku/id stays the identifier.
    (db as unknown as Record<string, unknown>)[name] = rows.map((r) => {
      const { _id, ...rest } = r as Record<string, unknown>;
      return rest;
    });
  }
  return { db, seq: meta.seq };
}

/** Replaces the dataset with `target`, preserving the append-only ledger. */
export async function writeMongo(target: Database, seq: MetaDoc['seq']): Promise<void> {
  const d = mongoDb();
  for (const name of COLLECTIONS) {
    const rows = (target as unknown as Record<string, unknown>)[name] as Record<string, unknown>[];
    const col = d.collection(name);
    await col.deleteMany({});
    if (rows.length) await col.insertMany(rows, { ordered: false });
  }
  const meta: MetaDoc = { _id: META_ID, version: target.version, settings: target.settings, seq };
  await d.collection<MetaDoc>('meta').replaceOne({ _id: META_ID }, meta, { upsert: true });
  await ensureIndexes(d);
}

/** Indexes the read paths the dashboard, ledger and document screens use. */
async function ensureIndexes(d: Db): Promise<void> {
  await Promise.all([
    d.collection('products').createIndex({ sku: 1 }, { unique: true }),
    d.collection('locations').createIndex({ id: 1 }, { unique: true }),
    d.collection('users').createIndex({ email: 1 }, { unique: true }),
    d.collection('ledger').createIndex({ id: 1 }, { unique: true }),
    // FIFO consumption and the per-SKU rollup both walk the ledger by sku+time.
    d.collection('ledger').createIndex({ sku: 1, at: 1 }),
    d.collection('ledger').createIndex({ type: 1, at: -1 }),
    d.collection('receipts').createIndex({ ref: 1 }, { unique: true }),
    d.collection('deliveries').createIndex({ ref: 1 }, { unique: true }),
    d.collection('transfers').createIndex({ ref: 1 }, { unique: true }),
    d.collection('adjustments').createIndex({ ref: 1 }, { unique: true }),
  ]);
}
