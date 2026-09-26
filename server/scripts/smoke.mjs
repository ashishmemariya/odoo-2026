/* End-to-end check of the inventory engine guardrails. Run: node server/scripts/smoke.mjs */
const BASE = process.env.BASE ?? 'http://localhost:4000/api';

let pass = 0;
let fail = 0;

function ok(label, cond, extra = '') {
  if (cond) {
    pass += 1;
    console.log(`  PASS  ${label}${extra ? `  (${extra})` : ''}`);
  } else {
    fail += 1;
    console.log(`  FAIL  ${label}${extra ? `  (${extra})` : ''}`);
  }
}

async function call(path, init) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

const steel = async () => (await call('/products/STL-ROD-12')).body;
const post = (path, body) => call(path, { method: 'POST', body: JSON.stringify(body ?? {}) });

console.log('\n== 0. Reset to seed ==');
await post('/reset');
const s0 = await steel();
ok('STL-ROD-12 starts at zero on hand', s0.total === 0, `total=${s0.total}`);

console.log('\n== 1. Zero-floor guardrail blocks an unstocked delivery ==');
const blocked = await post('/delivery/validate?ref=WH/OUT/0001', { user: 'Rahul Sharma' });
ok('returns HTTP 422', blocked.status === 422, `status=${blocked.status}`);
ok('names the shortage', /only 0 on hand/.test(blocked.body.error ?? ''), blocked.body.error);

console.log('\n== 2. Deliveries show per-line reasons in the preview ==');
const detail0 = (await call('/delivery?ref=WH/OUT/0001')).body;
ok('WH/OUT/0001 is blocked pre-receipt', detail0.check.blocked === true);
ok(
  'steel line reports a 20 kg shortfall',
  detail0.check.lines.find((l) => l.sku === 'STL-ROD-12')?.shortfall === 20,
);

console.log('\n== 3. Run the 4-step scenario ==');
const r1 = await post('/scenario/run', { user: 'Rahul Sharma' });
ok('step 1 = receive 100 kg', r1.body.action === 'receive', r1.body.message);
const s1 = await steel();
ok('steel total is now 100 kg', s1.total === 100, `total=${s1.total}`);
ok('stock landed in WH/Stock1/Heavy-Rack-01', s1.stock['WH/Stock1/Heavy-Rack-01'] === 100);

const r2 = await post('/scenario/run', { user: 'Rahul Sharma' });
ok('step 2 = transfer to WH/Production', r2.body.action === 'transfer', r2.body.message);
const s2 = await steel();
ok('transfer is net-zero on global balance', s2.total === 100, `total=${s2.total}`);
ok('WH/Stock1 drained to 0', s2.stock['WH/Stock1'] === 0, `WH/Stock1=${s2.stock['WH/Stock1']}`);
ok('WH/Production holds 100', s2.stock['WH/Production'] === 100);

const r3 = await post('/scenario/run', { user: 'Rahul Sharma' });
ok('step 3 = deliver 20 kg', r3.body.action === 'deliver', r3.body.message);
const s3 = await steel();
ok('steel total now 80 kg', s3.total === 80, `total=${s3.total}`);

const r4 = await post('/scenario/run', { user: 'Rahul Sharma' });
ok('step 4 = post -3 kg variance', r4.body.action === 'adjust', r4.body.message);
const s4 = await steel();
ok('steel total now 77 kg', s4.total === 77, `total=${s4.total}`);

console.log('\n== 4. Deliveries validate after inbound stock ==');
const detail1 = (await call('/delivery?ref=WH/OUT/0001')).body;
ok('WH/OUT/0001 no longer blocked', detail1.check.blocked === false);
const revalidate = await post('/delivery/validate?ref=WH/OUT/0001');
ok('re-validation rejected as already posted', revalidate.status === 409, `status=${revalidate.status}`);

console.log('\n== 5. Ledger is append-only and attributed ==');
const ledger = (await call('/ledger?sku=STL-ROD-12')).body;
ok('4 steel moves recorded', ledger.length === 4, `entries=${ledger.length}`);
ok(
  'newest-first deltas are -3, -20, 0, +100',
  JSON.stringify(ledger.map((l) => l.delta)) === JSON.stringify([-3, -20, 0, 100]),
  JSON.stringify(ledger.map((l) => l.delta)),
);
ok('transfer row carries delta 0', ledger.filter((l) => l.type === 'TRANSFER').every((l) => l.delta === 0));
ok('every row is attributed to a user', ledger.every((l) => l.user && l.user.length > 0));
ok(
  'balanceAfter never goes negative',
  ledger.every((l) => l.balanceAfter >= 0),
);

console.log('\n== 5b. Location hierarchy rolls up correctly ==');
const after = await steel();
ok('WH/Stock1 subtree reads 0 after transfer', after.stock['WH/Stock1'] === 0);
const prod = (await call('/products/STL-ROD-12')).body;
const wh1 = prod.byLocation.find((l) => l.code === 'WH/Stock1');
const prd = prod.byLocation.find((l) => l.code === 'WH/Production');
ok('WH/Stock1 rolled up to 0 (drained by transfer)', wh1?.qty === 0, `qty=${wh1?.qty}`);
ok('WH/Production rolled up to 77 (80 delivered, -3 scrapped)', prd?.qty === 77, `qty=${prd?.qty}`);
const leaves = (await call('/products/STL-ROD-12')).body;
ok('leaf Heavy-Rack-01 drained to 0', leaves.byLocation.find((l) => l.code === 'WH/Stock1/Heavy-Rack-01')?.qty === 0);

console.log('\n== 6. Over-draw is refused ==');
const huge = await call('/transfers', {
  method: 'POST',
  body: JSON.stringify({ from: 'WH/Rack-A', to: 'WH/Stock1', sku: 'COP-WIR-50', qty: 9999, requestedBy: 'Adele Vance' }),
});
ok('creating a 9999-spool transfer is rejected', huge.status === 422, `status=${huge.status} ${huge.body.error ?? ''}`);

console.log('\n== 7. Negative-stock toggle relaxes the block ==');
await post('/reset');
await call('/settings', { method: 'PATCH', body: JSON.stringify({ preventNegativeStock: false }) });
const relaxed = await post('/delivery/validate?ref=WH/OUT/0001', { user: 'Rahul Sharma' });
ok('validation now proceeds (clamped, not failed)', relaxed.status === 200, `status=${relaxed.status} ${relaxed.body.error ?? ''}`);
const clamped = await steel();
ok('balance clamped at 0, never negative', clamped.total === 0, `total=${clamped.total}`);
await call('/settings', { method: 'PATCH', body: JSON.stringify({ preventNegativeStock: true }) });

console.log('\n== 8. 404s are clean ==');
ok('unknown delivery -> 404', (await call('/delivery?ref=WH/OUT/9999')).status === 404);
ok('unknown SKU -> 404', (await call('/products/NOPE')).status === 404);
ok('unknown endpoint -> 404', (await call('/nope')).status === 404);

await post('/reset');
console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
