import { getDb, commit, nextLedgerId, nowStamp } from './store.js';
import type {
  Adjustment,
  Delivery,
  DeliveryLine,
  LedgerEntry,
  Product,
  Receipt,
  Transfer,
} from './types.js';

/* ------------------------------------------------------------------ *
 * Core inventory primitives
 * ------------------------------------------------------------------ */

export function totalStock(p: Product): number {
  return Object.values(p.stock).reduce((a, b) => a + b, 0);
}

/** Quantity physically available at a specific location (0 when unknown). */
export function stockAt(p: Product, location: string): number {
  return p.stock[location] ?? 0;
}

/** On-hand minus soft reservations. Never negative. */
export function freeToUse(p: Product): number {
  return Math.max(0, totalStock(p) - p.reserved);
}

export function productStatus(p: Product): 'IN_STOCK' | 'LOW' | 'OUT' {
  const t = totalStock(p);
  if (t === 0) return 'OUT';
  if (t <= p.reorderPoint) return 'LOW';
  return 'IN_STOCK';
}

export function findProduct(sku: string): Product | undefined {
  return getDb().products.find((p) => p.sku === sku);
}

/** First location holding at least `qty`, preferring the requested source. */
export function pickSource(p: Product, preferred: string, qty: number): string | null {
  if (stockAt(p, preferred) >= qty) return preferred;
  const keys = Object.keys(p.stock).sort((a, b) => stockAt(p, b) - stockAt(p, a));
  for (const k of keys) if (stockAt(p, k) >= qty) return k;
  return null;
}

/* ------------------------------------------------------------------ *
 * Ledger
 * ------------------------------------------------------------------ */

export function postLedger(input: {
  type: LedgerEntry['type'];
  ref: string;
  sku: string;
  delta: number;
  from: string;
  to: string;
  user: string;
  note: string;
}): LedgerEntry {
  const db = getDb();
  const p = db.products.find((x) => x.sku === input.sku);
  const entry: LedgerEntry = {
    id: nextLedgerId(),
    timestamp: nowStamp(),
    type: input.type,
    ref: input.ref,
    sku: input.sku,
    name: p?.name ?? input.sku,
    delta: input.delta,
    from: input.from,
    to: input.to,
    balanceAfter: p ? totalStock(p) : 0,
    user: input.user,
    note: input.note,
  };
  db.ledger.unshift(entry);
  return entry;
}

/* ------------------------------------------------------------------ *
 * Delivery validation — the "zero-floor + shortage lock" rule
 * ------------------------------------------------------------------ */

export interface LineAvailability {
  sku: string;
  name: string;
  unit: string;
  demand: number;
  availableAtSource: number;
  availableTotal: number;
  bin: string;
  sufficient: boolean;
  shortfall: number;
  /** source location the stock would actually be pulled from (FIFO-ish) */
  pullFrom: string;
  reason: string;
}

export interface DeliveryCheck {
  ref: string;
  lines: LineAvailability[];
  blocked: boolean;
  blockers: string[];
  alreadyPosted: boolean;
}

export function checkDelivery(ref: string): DeliveryCheck | null {
  const db = getDb();
  const doc = db.deliveries.find((d) => d.ref === ref);
  if (!doc) return null;

  const lines: LineAvailability[] = doc.items.map((line) => {
    const p = findProduct(line.sku);
    const atSource = p ? stockAt(p, doc.from) : 0;
    const total = p ? totalStock(p) : 0;
    const pullFrom = p ? pickSource(p, doc.from, line.qty) : null;
    const sufficient = total >= line.qty;
    return {
      sku: line.sku,
      name: p?.name ?? line.sku,
      unit: p?.unit ?? 'Units',
      demand: line.qty,
      availableAtSource: atSource,
      availableTotal: total,
      bin: line.bin,
      sufficient,
      shortfall: Math.max(0, line.qty - total),
      pullFrom: pullFrom ?? doc.from,
      reason: !p
        ? 'SKU not present in catalog'
        : total < line.qty
          ? `Short ${line.qty - total} ${p.unit} against global on-hand`
          : atSource < line.qty
            ? `Insufficient at ${doc.from}; ${total} ${p.unit} available network-wide`
            : 'Fully covered at source bay',
    };
  });

  const blockers = lines
    .filter((l) => !l.sufficient)
    .map((l) => `${l.sku}: needs ${l.demand} ${l.unit}, only ${l.availableTotal} on hand`);

  return {
    ref: doc.ref,
    lines,
    blocked: blockers.length > 0,
    blockers,
    alreadyPosted: doc.status === 'Done',
  };
}

/** Validate (post) a delivery. Applies zero-floor guardrail. Throws on violation. */
export function postDelivery(ref: string, user: string): { doc: Delivery; entries: LedgerEntry[] } {
  const db = getDb();
  const doc = db.deliveries.find((d) => d.ref === ref);
  if (!doc) throw new HttpError(404, `Delivery ${ref} not found`);
  if (doc.status === 'Done') throw new HttpError(409, `${ref} has already been validated`);

  const check = checkDelivery(ref);
  if (!check) throw new HttpError(404, `Delivery ${ref} not found`);

  const zeroFloor = db.settings.preventNegativeStock;
  if (check.blocked) {
    if (zeroFloor) {
      throw new HttpError(422, `Validation blocked — ${check.blockers.join('; ')}`, {
        blockers: check.blockers,
      });
    }
    // Guardrail disabled: clamp instead of failing.
  }

  const entries: LedgerEntry[] = [];
  for (const line of doc.items) {
    const p = findProduct(line.sku);
    if (!p) continue;
    let remaining = line.qty;

    // FIFO: consume from source bay first, then the largest other holding bay.
    const plan = check.lines.find((c) => c.sku === line.sku);
    const primary = plan?.pullFrom ?? doc.from;
    const order: string[] = [primary, ...Object.keys(p.stock).filter((k) => k !== primary)];
    const taken: Record<string, number> = {};

    for (const loc of order) {
      if (remaining <= 0) break;
      const avail = stockAt(p, loc);
      if (avail <= 0) continue;
      const take = Math.min(avail, remaining);
      p.stock[loc] = zeroFloor ? avail - take : Math.max(0, avail - take);
      taken[loc] = (taken[loc] ?? 0) + take;
      remaining -= take;
    }

    p.reserved = Math.max(0, p.reserved - line.qty);
    doc.postedAt = nowStamp();
    entries.push(
      postLedger({
        type: 'DELIVERY',
        ref: doc.ref,
        sku: p.sku,
        delta: -line.qty,
        from: Object.keys(taken).join(' + ') || doc.from,
        to: `${doc.to} (${doc.contact})`,
        user,
        note: `Dispatch validated against ${doc.operationType}.`,
      }),
    );
  }

  doc.status = 'Done';
  commit();
  return { doc, entries };
}

/* ------------------------------------------------------------------ *
 * Receipt validation
 * ------------------------------------------------------------------ */

export function postReceipt(ref: string, user: string): { doc: Receipt; entries: LedgerEntry[] } {
  const db = getDb();
  const doc = db.receipts.find((r) => r.ref === ref);
  if (!doc) throw new HttpError(404, `Receipt ${ref} not found`);
  if (doc.status === 'Done') throw new HttpError(409, `${ref} has already been received`);

  const entries: LedgerEntry[] = [];
  for (const line of doc.items) {
    const p = findProduct(line.sku);
    if (!p) continue;
    const dest = line.bin || doc.destination;
    p.stock[dest] = (p.stock[dest] ?? 0) + line.received;
    doc.status = 'Done';
    doc.postedAt = nowStamp();
    entries.push(
      postLedger({
        type: 'RECEIPT',
        ref: doc.ref,
        sku: p.sku,
        delta: line.received,
        from: doc.supplier,
        to: dest,
        user,
        note: `Goods received against ${doc.poRef} / ${doc.bolRef}.`,
      }),
    );
  }
  if (doc.items.length === 0) doc.status = 'Done';
  commit();
  return { doc, entries };
}

/* ------------------------------------------------------------------ *
 * Internal transfer — source decrements, destination increments, net 0
 * ------------------------------------------------------------------ */

export function postTransfer(ref: string, user: string): { doc: Transfer; entry: LedgerEntry } {
  const db = getDb();
  const doc = db.transfers.find((t) => t.ref === ref);
  if (!doc) throw new HttpError(404, `Transfer ${ref} not found`);
  if (doc.status === 'Done') throw new HttpError(409, `${ref} already executed`);

  const p = findProduct(doc.sku);
  if (!p) throw new HttpError(404, `SKU ${doc.sku} not found`);

  if (db.settings.preventNegativeStock && stockAt(p, doc.from) < doc.qty) {
    throw new HttpError(
      422,
      `Cannot move ${doc.qty} ${p.unit} — only ${stockAt(p, doc.from)} available at ${doc.from}`,
    );
  }

  const before = totalStock(p);
  p.stock[doc.from] = Math.max(0, (p.stock[doc.from] ?? 0) - doc.qty);
  p.stock[doc.to] = (p.stock[doc.to] ?? 0) + doc.qty;
  const after = totalStock(p);

  if (after !== before) {
    throw new HttpError(500, `Transfer invariant violated: global balance drifted ${before} → ${after}`);
  }

  doc.status = 'Done';
  const entry = postLedger({
    type: 'TRANSFER',
    ref: doc.ref,
    sku: p.sku,
    delta: 0,
    from: doc.from,
    to: doc.to,
    user,
    note: `Internal relocation — net-zero effect on enterprise balance.`,
  });
  commit();
  return { doc, entry };
}

/* ------------------------------------------------------------------ *
 * Physical count reconciliation
 * ------------------------------------------------------------------ */

export function postAdjustment(
  input: {
    ref: string;
    counted: number;
    reason: Adjustment['reason'];
    memo: string;
    user: string;
  },
): { doc: Adjustment; entry: LedgerEntry } {
  const db = getDb();
  const doc = db.adjustments.find((a) => a.ref === input.ref);
  if (!doc) throw new HttpError(404, `Adjustment ${input.ref} not found`);
  if (doc.state === 'Posted') throw new HttpError(409, `${input.ref} already posted to ledger`);

  const p = findProduct(doc.sku);
  if (!p) throw new HttpError(404, `SKU ${doc.sku} not found`);

  const bookBefore = totalStock(p);
  const locQty = stockAt(p, doc.location);
  const delta = input.counted - locQty;

  if (db.settings.preventNegativeStock && input.counted < 0) {
    throw new HttpError(422, 'Physical count cannot be negative');
  }

  p.stock[doc.location] = Math.max(0, input.counted);
  doc.recorded = locQty;
  doc.counted = Math.max(0, input.counted);
  doc.delta = delta;
  doc.reason = input.reason;
  doc.memo = input.memo;
  doc.auditor = input.user;
  doc.state = 'Posted';
  doc.postedAt = nowStamp();
  doc.valuationImpact = delta * p.unitCost;

  const entry = postLedger({
    type: 'ADJUSTMENT',
    ref: doc.ref,
    sku: p.sku,
    delta,
    from: doc.location,
    to: delta < 0 ? 'Loss / Scrap' : 'Audit Reconciliation',
    user: input.user,
    note: `${input.reason} — physical count posted.`,
  });

  if (bookBefore + delta !== totalStock(p)) {
    throw new HttpError(500, 'Adjustment invariant violated');
  }
  commit();
  return { doc, entry };
}

export function requiresDualSignoff(a: Adjustment): boolean {
  const s = getDb().settings;
  const absImpact = Math.abs(a.valuationImpact);
  const pct = a.recorded === 0 ? 100 : (Math.abs(a.delta) / a.recorded) * 100;
  return absImpact >= s.dualSignoffThreshold || pct >= s.dualSignoffVariancePct;
}

/* ------------------------------------------------------------------ *
 * Dashboard rollup
 * ------------------------------------------------------------------ */

export function dashboardSummary() {
  const db = getDb();
  const onHand = db.products.reduce((a, p) => a + totalStock(p), 0);
  const free = db.products.reduce((a, p) => a + freeToUse(p), 0);
  const reserved = db.products.reduce((a, p) => a + p.reserved, 0);
  const valuation = db.products.reduce((a, p) => a + totalStock(p) * p.unitCost, 0);
  const lowStock = db.products.filter((p) => productStatus(p) !== 'IN_STOCK');

  return {
    catalogSkus: db.products.length,
    totalOnHand: onHand,
    freeToAllocate: free,
    reserved,
    valuation,
    lowStock,
    pendingReceipts: db.receipts.filter((r) => r.status !== 'Done').length,
    pendingDeliveries: db.deliveries.filter((d) => d.status !== 'Done').length,
    waitingDeliveries: db.deliveries.filter((d) => d.status === 'Waiting').length,
    readyDeliveries: db.deliveries.filter((d) => d.status === 'Ready').length,
    doneDeliveries: db.deliveries.filter((d) => d.status === 'Done').length,
    overdueDeliveries: db.deliveries.filter((d) => d.status === 'Overdue').length,
    lateReceipts: db.receipts.filter((r) => r.status === 'Overdue').length,
    scheduledTransfers: db.transfers.filter((t) => t.status !== 'Done').length,
    pendingAdjustments: db.adjustments.filter((a) => a.state === 'Pending Approval').length,
    ledgerEntries: db.ledger.length,
  };
}

/* ------------------------------------------------------------------ *
 * Errors
 * ------------------------------------------------------------------ */

export class HttpError extends Error {
  status: number;
  meta?: Record<string, unknown>;
  constructor(status: number, message: string, meta?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.meta = meta;
  }
}

export type { DeliveryLine };
