import { mkdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Database } from '../types.js';
import { SEED_VERSION } from '../seed.js';

/**
 * JSON-file persistence, used when `MONGO_URI` is not set. Same contract as the
 * MongoDB driver: hydrate the whole dataset on boot, rewrite it on `commit()`.
 */

const here = dirname(fileURLToPath(import.meta.url));
export const DB_PATH = resolve(here, '../../data/db.json');

export interface Sequences {
  ledger: number;
  receipt: number;
  delivery: number;
  transfer: number;
  adjustment: number;
}

export const SEED_SEQ: Sequences = { ledger: 0, receipt: 7, delivery: 7, transfer: 4, adjustment: 4 };

export function maxRef(refs: string[], fallback = 0): number {
  const nums = refs
    .map((r) => Number(r.split('/').pop() ?? NaN))
    .filter((n) => Number.isFinite(n));
  return nums.length ? Math.max(...nums) : fallback;
}

/** Returns the stored dataset, or null when the file is absent/stale/corrupt. */
export function readFile_(): Database | null {
  if (!existsSync(DB_PATH)) return null;
  try {
    const parsed = JSON.parse(readFileSync(DB_PATH, 'utf8')) as Database;
    if (parsed.version !== SEED_VERSION) return null;
    if (!Array.isArray(parsed.credentials) || parsed.credentials.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeFile_(target: Database): void {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  writeFileSync(DB_PATH, JSON.stringify(target, null, 2), 'utf8');
}

export function removeFile(): void {
  if (existsSync(DB_PATH)) unlinkSync(DB_PATH);
}

/** Continues each id sequence past the highest ref already stored. */
export function seqFor(db: Database): Sequences {
  return {
    ledger: db.ledger.length,
    receipt: maxRef(db.receipts.map((r) => r.ref)) + 1,
    delivery: maxRef(db.deliveries.map((d) => d.ref)) + 1,
    transfer: maxRef(db.transfers.map((t) => t.ref), 2000) + 1,
    adjustment: maxRef(db.adjustments.map((a) => a.ref), 4000) + 1,
  };
}
