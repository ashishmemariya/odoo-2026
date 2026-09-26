import { getDb, commit, nextDeliveryRef } from './store.js';
import { postAdjustment, postDelivery, postReceipt, postTransfer, stockAt, totalStock, HttpError } from './engine.js';

/**
 * The 4-step audit walkthrough from the wireframe:
 *   1. Receive 100 kg Steel Rods          -> WH/IN/0001 (partial receipt line)
 *   2. Transfer WH/Stock1 -> WH/Production -> TR-2001
 *   3. Deliver 20 kg to Azure Interior    -> WH/OUT/0001
 *   4. Post -3 kg physical adjustment     -> ADJ-4001
 */

const STEPS = [
  {
    key: 'receive',
    title: 'Receive 100 kg Steel Rods',
    detail: 'Goods receipt WH/IN/0001 posted into WH/Stock1/Heavy-Rack-01.',
  },
  {
    key: 'transfer',
    title: 'Move stock to WH/Production',
    detail: 'Internal transfer TR-2001 relocates 100 kg without changing the global balance.',
  },
  {
    key: 'deliver',
    title: 'Deliver 20 kg to Azure Interior',
    detail: 'Outbound order WH/OUT/0001 validated — now fully covered by on-hand stock.',
  },
  {
    key: 'adjust',
    title: 'Post -3 kg count variance',
    detail: 'Physical count ADJ-4001 reconciled and written to the immutable ledger.',
  },
] as const;

type StepKey = (typeof STEPS)[number]['key'];

function buildScopedReceipt(user: string) {
  const db = getDb();
  const doc = db.receipts.find((r) => r.ref === 'WH/IN/0001');
  if (!doc) throw new HttpError(500, 'Seed receipt WH/IN/0001 missing');
  if (doc.status === 'Done') return doc;
  // Scope the receipt to the steel line only, 100 kg, so the demo math is exact.
  doc.items = doc.items
    .filter((l) => l.sku === 'STL-ROD-12')
    .map((l) => ({ ...l, expected: 100, received: 100, bin: 'WH/Stock1/Heavy-Rack-01' }));
  doc.notes = 'Scenario: 100 kg of 12mm high-tensile rod received for production staging.';
  doc.createdBy = user;
  commit();
  return postReceipt('WH/IN/0001', user).doc;
}

export function scenarioState() {
  const db = getDb();
  const steel = db.products.find((p) => p.sku === 'STL-ROD-12');
  const receipt = db.receipts.find((r) => r.ref === 'WH/IN/0001');
  const transfer = db.transfers.find((t) => t.ref === 'TR-2001');
  const delivery = db.deliveries.find((d) => d.ref === 'WH/OUT/0001');
  const adjustment = db.adjustments.find((a) => a.ref === 'ADJ-4001');

  const done: Record<StepKey, boolean> = {
    receive: receipt?.status === 'Done',
    transfer: transfer?.status === 'Done',
    deliver: delivery?.status === 'Done',
    adjust: adjustment?.state === 'Posted',
  };

  const current = STEPS.findIndex((s) => !done[s.key]);
  return {
    steps: STEPS.map((s, i) => ({
      key: s.key,
      index: i,
      title: s.title,
      detail: s.detail,
      completed: done[s.key],
      active: i === current,
    })),
    currentStep: current === -1 ? STEPS.length - 1 : current,
    complete: current === -1,
    steel: steel
      ? {
          sku: steel.sku,
          total: totalStock(steel),
          stock1: stockAt(steel, 'WH/Stock1'),
          production: stockAt(steel, 'WH/Production'),
          rackA: stockAt(steel, 'WH/Rack-A'),
        }
      : null,
    refs: {
      receipt: receipt?.ref ?? 'WH/IN/0001',
      transfer: transfer?.ref ?? 'TR-2001',
      delivery: delivery?.ref ?? 'WH/OUT/0001',
      adjustment: adjustment?.ref ?? 'ADJ-4001',
    },
  };
}

export function runScenarioStep(user: string) {
  const db = getDb();
  const receipt = db.receipts.find((r) => r.ref === 'WH/IN/0001');
  const transfer = db.transfers.find((t) => t.ref === 'TR-2001');
  const delivery = db.deliveries.find((d) => d.ref === 'WH/OUT/0001');
  const adjustment = db.adjustments.find((a) => a.ref === 'ADJ-4001');

  if (receipt?.status !== 'Done') {
    const doc = buildScopedReceipt(user);
    return { action: 'receive', message: `Received 100 kg into ${doc.destination}.`, ref: doc.ref };
  }

  if (transfer?.status !== 'Done') {
    const doc = postTransfer('TR-2001', user).doc;
    return {
      action: 'transfer',
      message: `Moved ${doc.qty} kg ${doc.from} → ${doc.to} (balance unchanged).`,
      ref: doc.ref,
    };
  }

  if (delivery && delivery.status !== 'Done') {
    // Ensure the delivery only asks for the steel line so step 3 is deterministic.
    if (!delivery.items.some((i) => i.sku === 'STL-ROD-12')) {
      delivery.items = [{ sku: 'STL-ROD-12', qty: 20, bin: 'Heavy-Rack-01' }];
      commit();
    }
    const doc = postDelivery('WH/OUT/0001', user).doc;
    return {
      action: 'deliver',
      message: `Dispatched 20 kg to ${doc.to}. Validation passed.`,
      ref: doc.ref,
    };
  }

  if (adjustment?.state !== 'Posted') {
    const doc = postAdjustment({
      ref: 'ADJ-4001',
      counted: 77,
      reason: 'Scrap / Wear & Tear',
      memo: 'Scenario: count variance written to ledger.',
      user,
    }).doc;
    return {
      action: 'adjust',
      message: `Posted ${doc.delta} kg variance (${doc.ref}).`,
      ref: doc.ref,
    };
  }

  return {
    action: 'complete',
    message: 'All four steps complete — audit trail is intact.',
    ref: 'ADJ-4001',
  };
}

export { nextDeliveryRef };
