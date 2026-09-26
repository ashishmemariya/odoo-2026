import { Router } from 'express';
import { getDb, commit, resetDb } from './store.js';
import {
  HttpError,
  checkDelivery,
  dashboardSummary,
  findProduct,
  freeToUse,
  postAdjustment,
  postDelivery,
  postReceipt,
  postTransfer,
  productStatus,
  requiresDualSignoff,
  stockAt,
  totalStock,
} from './engine.js';
import { runScenarioStep, scenarioState } from './scenario.js';
import type { User } from './types.js';

export const api = Router();

/* ---------------------------- meta ---------------------------- */

api.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

api.get('/snapshot', (_req, res) => {
  const db = getDb();
  res.json({
    ...db,
    products: db.products.map((p) => ({
      ...p,
      total: totalStock(p),
      free: freeToUse(p),
      status: productStatus(p),
    })),
    dashboard: dashboardSummary(),
    scenario: scenarioState(),
  });
});

api.post('/reset', (_req, res) => {
  resetDb();
  res.json({ ok: true, message: 'Seed data restored' });
});

/* ---------------------------- users / settings ---------------------------- */

api.get('/users', (_req, res) => res.json(getDb().users));

api.get('/settings', (_req, res) => res.json(getDb().settings));

api.patch('/settings', (req, res) => {
  const db = getDb();
  db.settings = { ...db.settings, ...req.body };
  commit();
  res.json(db.settings);
});

/* ---------------------------- catalog ---------------------------- */

api.get('/products', (req, res) => {
  const q = String(req.query.q ?? '').toLowerCase();
  const category = String(req.query.category ?? 'All');
  const status = String(req.query.status ?? 'All');
  let list = getDb().products.map((p) => ({
    ...p,
    total: totalStock(p),
    free: freeToUse(p),
    status: productStatus(p),
  }));
  if (q) {
    list = list.filter(
      (p) =>
        p.sku.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }
  if (category !== 'All') list = list.filter((p) => p.category === category);
  if (status !== 'All') list = list.filter((p) => p.status === status);
  res.json(list);
});

api.get('/products/:sku', (req, res) => {
  const p = findProduct(req.params.sku);
  if (!p) throw new HttpError(404, `SKU ${req.params.sku} not found`);
  const db = getDb();
  res.json({
    ...p,
    total: totalStock(p),
    free: freeToUse(p),
    status: productStatus(p),
    byLocation: Object.entries(p.stock)
      .map(([location, qty]) => ({ location, qty, freeQty: qty }))
      .sort((a, b) => b.qty - a.qty),
    moves: db.ledger.filter((l) => l.sku === p.sku).slice(0, 60),
  });
});

api.get('/categories', (_req, res) => {
  const set = [...new Set(getDb().products.map((p) => p.category))].sort();
  res.json(['All', ...set]);
});

/* ---------------------------- receipts ---------------------------- */

api.get('/receipts', (req, res) => {
  const status = String(req.query.status ?? 'All');
  let list = getDb().receipts;
  if (status !== 'All') list = list.filter((r) => r.status === status);
  res.json(list);
});

// `ref` travels as a query param because refs contain slashes (WH/IN/0001).
api.get('/receipt', (req, res) => {
  const ref = String(req.query.ref ?? '');
  const doc = getDb().receipts.find((r) => r.ref === ref);
  if (!doc) throw new HttpError(404, `Receipt ${ref} not found`);
  res.json({
    ...doc,
    lines: doc.items.map((l) => {
      const p = findProduct(l.sku);
      return {
        ...l,
        name: p?.name ?? l.sku,
        unit: p?.unit ?? 'Units',
        unitCost: p?.unitCost ?? 0,
        lineValue: l.received * (p?.unitCost ?? 0),
        variance: l.received - l.expected,
      };
    }),
    totalValue: doc.items.reduce((a, l) => a + l.received * (findProduct(l.sku)?.unitCost ?? 0), 0),
  });
});

api.post('/receipt/validate', (req, res) => {
  const ref = String(req.query.ref ?? req.body?.ref ?? '');
  const { doc, entries } = postReceipt(ref, String(req.body?.user ?? 'System'));
  res.json({ ok: true, receipt: doc, ledger: entries });
});

/* ---------------------------- deliveries ---------------------------- */

api.get('/deliveries', (req, res) => {
  const status = String(req.query.status ?? 'All');
  let list = getDb().deliveries;
  if (status !== 'All') list = list.filter((d) => d.status === status);
  res.json(list);
});

api.get('/delivery', (req, res) => {
  const ref = String(req.query.ref ?? '');
  const doc = getDb().deliveries.find((d) => d.ref === ref);
  if (!doc) throw new HttpError(404, `Delivery ${ref} not found`);
  const check = checkDelivery(doc.ref);
  res.json({
    ...doc,
    check,
    lines: doc.items.map((l) => {
      const p = findProduct(l.sku);
      const line = check?.lines.find((c) => c.sku === l.sku);
      return {
        ...l,
        name: p?.name ?? l.sku,
        unit: p?.unit ?? 'Units',
        unitCost: p?.unitCost ?? 0,
        availableAtSource: line?.availableAtSource ?? 0,
        availableTotal: line?.availableTotal ?? 0,
        pullFrom: line?.pullFrom ?? doc.from,
        reason: line?.reason ?? '',
        sufficient: line?.sufficient ?? false,
        shortfall: line?.shortfall ?? 0,
        value: l.qty * (p?.unitCost ?? 0),
      };
    }),
    totalValue: doc.items.reduce((a, l) => a + l.qty * (findProduct(l.sku)?.unitCost ?? 0), 0),
  });
});

api.post('/delivery/validate', (req, res) => {
  const ref = String(req.query.ref ?? req.body?.ref ?? '');
  const { doc, entries } = postDelivery(ref, String(req.body?.user ?? 'System'));
  res.json({ ok: true, delivery: doc, ledger: entries });
});

/* ---------------------------- transfers ---------------------------- */

api.get('/transfers', (_req, res) => res.json(getDb().transfers));

api.post('/transfers', (req, res) => {
  const { from, to, sku, qty, requestedBy } = req.body ?? {};
  const db = getDb();
  const p = findProduct(String(sku));
  if (!p) throw new HttpError(404, `SKU ${sku} not found`);
  const amount = Number(qty);
  if (!Number.isFinite(amount) || amount <= 0) throw new HttpError(400, 'Quantity must be > 0');
  if (db.settings.preventNegativeStock && stockAt(p, from) < amount) {
    throw new HttpError(422, `Only ${stockAt(p, from)} ${p.unit} available at ${from}`);
  }
  const max = db.transfers.reduce((m, t) => Math.max(m, Number(t.ref.split('-')[1] ?? 0)), 2000);
  const doc = {
    ref: `TR-${max + 1}`,
    from,
    to,
    sku: p.sku,
    qty: amount,
    requestedBy: requestedBy ?? 'System',
    status: 'Draft' as const,
    createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
  };
  db.transfers.push(doc);
  commit();
  res.json(doc);
});

api.post('/transfers/:ref/execute', (req, res) => {
  const { doc, entry } = postTransfer(req.params.ref, String(req.body?.user ?? 'System'));
  res.json({ ok: true, transfer: doc, ledger: entry });
});

/* ---------------------------- physical counts ---------------------------- */

api.get('/adjustments', (_req, res) =>
  res.json(getDb().adjustments.map((a) => ({ ...a, dualSignoff: requiresDualSignoff(a) }))),
);

api.post('/adjustments', (req, res) => {
  const { sku, location, recorded, counted, reason, memo, auditor } = req.body ?? {};
  const db = getDb();
  const p = findProduct(String(sku));
  if (!p) throw new HttpError(404, `SKU ${sku} not found`);
  const max = db.adjustments.reduce((m, a) => Math.max(m, Number(a.ref.split('-')[1] ?? 0)), 4000);
  const doc = {
    ref: `ADJ-${max + 1}`,
    sku: p.sku,
    location,
    recorded: Number(recorded),
    counted: Number(counted),
    delta: Number(counted) - Number(recorded),
    reason: reason ?? 'Other',
    memo: memo ?? '',
    auditor: auditor ?? 'System',
    state: 'Pending Approval' as const,
    valuationImpact: (Number(counted) - Number(recorded)) * p.unitCost,
    createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
  };
  db.adjustments.push(doc);
  commit();
  res.json(doc);
});

api.post('/adjustments/:ref/post', (req, res) => {
  const { doc, entry } = postAdjustment({
    ref: req.params.ref,
    counted: Number(req.body?.counted ?? 0),
    reason: req.body?.reason,
    memo: req.body?.memo ?? '',
    user: String(req.body?.user ?? 'System'),
  });
  res.json({ ok: true, adjustment: doc, ledger: entry });
});

/* ---------------------------- ledger ---------------------------- */

api.get('/ledger', (req, res) => {
  const type = String(req.query.type ?? 'All');
  const sku = String(req.query.sku ?? '');
  let list = getDb().ledger;
  if (type !== 'All') list = list.filter((l) => l.type === type);
  if (sku) list = list.filter((l) => l.sku.toLowerCase().includes(sku.toLowerCase()));
  res.json(list);
});

/* ---------------------------- warehouse ---------------------------- */

api.get('/warehouses', (_req, res) => res.json(getDb().warehouses));

api.get('/locations', (_req, res) => res.json(getDb().locations));

/* ---------------------------- scenario ---------------------------- */

api.get('/scenario', (_req, res) => res.json(scenarioState()));

api.post('/scenario/run', (req, res) => {
  const result = runScenarioStep(String(req.body?.user ?? 'System'));
  res.json({ ...result, snapshot: { products: getDb().products.map((p) => ({ ...p, total: totalStock(p) })), ledger: getDb().ledger, dashboard: dashboardSummary() } });
});

api.post('/scenario/reset', (_req, res) => {
  resetDb();
  res.json(scenarioState());
});

export type { User };
