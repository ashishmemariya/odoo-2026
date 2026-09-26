import type { Database } from './types.js';
import { buildSeed, SEED_VERSION } from './seed.js';
import * as file from './db/file.js';
import type { Sequences } from './db/file.js';
import { closeMongo, connectMongo, mongoConfigured, readMongo, writeMongo } from './db/mongo.js';

/**
 * The single persistence seam.
 *
 * The engine and routes work against a plain in-memory `Database` and call
 * `commit()` after a mutation. Which backend actually stores it is decided once
 * at boot from `MONGO_URI`: MongoDB (Atlas or local) when present, otherwise a
 * JSON file. Nothing above this module knows the difference.
 */

export type Backend = 'mongodb' | 'file';

let db: Database = buildSeed();
let seq: Sequences = { ...file.SEED_SEQ, ledger: db.ledger.length };
let backend: Backend = 'file';
let ready = false;

export function backendName(): Backend {
  return backend;
}

export function isReady(): boolean {
  return ready;
}

/**
 * Connects the backend and hydrates the dataset. A first run — or a bump of the
 * seed version — writes the canonical seed through.
 */
export async function initStore(): Promise<{ backend: Backend; seeded: boolean }> {
  let seeded = false;
  if (mongoConfigured()) {
    try {
      await connectMongo();
      backend = 'mongodb';
      const found = await readMongo();
      if (found) {
        db = found.db;
        seq = { ...found.seq };
      } else {
        db = buildSeed();
        seq = { ...file.SEED_SEQ, ledger: db.ledger.length };
        await writeMongo(db, seq);
        seeded = true;
      }
      ready = true;
      return { backend, seeded };
    } catch (err) {
      // An unreachable Atlas must not take the API down — fall back to the file.
      console.warn(
        `[store] MongoDB unavailable (${(err as Error).message}); using the JSON file instead.`,
      );
      await closeMongo();
    }
  }

  backend = 'file';
  const found = file.readFile_();
  if (found) {
    db = found;
    seq = file.seqFor(found);
  } else {
    db = buildSeed();
    seq = { ...file.SEED_SEQ, ledger: db.ledger.length };
    file.writeFile_(db);
    seeded = true;
  }
  ready = true;
  return { backend, seeded };
}

export async function shutdownStore(): Promise<void> {
  await closeMongo();
  ready = false;
}

export function getDb(): Database {
  return db;
}

export function commit(next: Database = db): Database {
  db = next;
  if (backend === 'mongodb') {
    // Fire-and-forget: the request is already answered from `db`, and a write
    // failure surfaces on the next boot rather than half-way through a request.
    void writeMongo(db, seq).catch((err) =>
      console.error(`[store] MongoDB write failed: ${(err as Error).message}`),
    );
  } else {
    file.writeFile_(db);
  }
  return db;
}

export function resetDb(): Database {
  db = buildSeed();
  seq = { ...file.SEED_SEQ, ledger: db.ledger.length };
  commit();
  return db;
}

/** Rebuilds the stored dataset from the canonical seed, either backend. */
export async function hardReset(): Promise<void> {
  db = buildSeed();
  seq = { ...file.SEED_SEQ, ledger: db.ledger.length };
  if (backend === 'mongodb') await writeMongo(db, seq);
  else {
    file.removeFile();
    file.writeFile_(db);
  }
}

export function nextLedgerId(): string {
  seq.ledger += 1;
  return `LG-${String(seq.ledger).padStart(4, '0')}`;
}

export function nextReceiptRef(): string {
  return `WH/IN/${String(seq.receipt++).padStart(4, '0')}`;
}

export function nextDeliveryRef(): string {
  return `WH/OUT/${String(seq.delivery++).padStart(4, '0')}`;
}

export function nextTransferRef(): string {
  return `TR-${seq.transfer++}`;
}

export function nextAdjustmentRef(): string {
  return `ADJ-${seq.adjustment++}`;
}

export function nowStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(
    d.getMinutes(),
  )}:${p(d.getSeconds())}`;
}

export { SEED_VERSION };
export { DB_PATH } from './db/file.js';
