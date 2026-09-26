# StockSense ERP

Enterprise logistics & inventory system built from the StockSense wireframes.
React 18 + Vite front end, Express back end, JSON-file persistence.

The point of the build is that **every number on screen comes from the server**.
The browser never mutates stock; it asks the API to post a document and then
re-reads the snapshot.

---

## Run it

```bash
npm install
npm run dev
```

- Web  → http://localhost:5173
- API  → http://localhost:4000/api/health

Production build (API serves the built client on a single port):

```bash
npm run build
npm start        # → http://localhost:4000
```

### Other scripts

| Command | What it does |
| --- | --- |
| `npm run smoke` | 33 assertions against a running API (guardrails, FIFO, hierarchy, ledger) |
| `npm run typecheck` | `tsc --noEmit` across both workspaces |
| `npm run reset` | Delete and reseed `server/data/db.json` |

> On Windows the `node_modules/.bin` shims may not be created, so every script
> invokes its tool through `node <entry-point>` instead of a bare binary name.

---

## The 4-step guided walkthrough

Open the Dashboard and press **Run step**. Each press performs one real
mutation on the server — it is not a scripted animation.

| Step | Mutation | Stock effect |
| --- | --- | --- |
| 1 | Receive 100 kg into `WH/IN/0001` | `+100` on `STL-ROD-12` |
| 2 | Execute `TR-2001` → `WH/Production` | `±0` (relocation) |
| 3 | Validate dispatch `WH/OUT/0001` | `−20` |
| 4 | Post count variance `ADJ-4001` | `−3` |

`STL-ROD-12` starts at **0**. So before step 1 the dispatch on step 3 is
genuinely unsatisfiable, and the app says so.

**Before the walkthrough** — `/#/deliveries/WH/OUT/0001` shows a red *Stock
deficit* banner, a per-line shortfall of 20 kg, and a disabled validate button.
After step 1 the same page clears and validates.

**After the walkthrough** — 77 kg remain in `WH/Production`, and the ledger
reads newest-first:

```
ADJUSTMENT  ADJ-4001     Δ  -3   bal=77   by Rahul Sharma
DELIVERY    WH/OUT/0001  Δ -20   bal=80   by Rahul Sharma
TRANSFER    TR-2001      Δ   0   bal=100  by Rahul Sharma
RECEIPT     WH/IN/0001   Δ+100   bal=100  by Rahul Sharma
```

---

## Business rules, and where they live

| Rule | Implementation |
| --- | --- |
| Zero-floor guardrail | `server/src/engine.ts` → `postDelivery()` throws **422** and writes nothing |
| Net-zero transfers | `postTransfer()` asserts the global balance is identical before/after, refuses to commit if it drifted |
| FIFO draining | `drainFifo()` walks the source subtree in bin order, then other leaves deepest-first, never below zero |
| Hierarchical balances | `stockAt()` sums a location *and every descendant* |
| Append-only ledger | `postLedger()` only unshifts — there is no update or delete route anywhere |
| Attribution | Every row records the acting user and a verbatim note |
| Dual sign-off | `requiresDualSignoff()` fires on absolute impact **or** variance % |

### The location hierarchy

This was the one genuinely non-obvious modelling decision. `WH/Stock1` is a
*container* over `WH/Stock1/Heavy-Rack-01` and `WH/Stock1/Bay04`, but stock is
stored on the leaves. So the receipt posts 100 kg into a bin, and the transfer
that names `WH/Stock1` has to find it by roll-up. An earlier version read the
container's own key, found zero, and rejected a transfer that was fully
covered — which is what drove the hierarchy in.

```
WH/Stock1                     (container)
├── WH/Stock1/Heavy-Rack-01  (leaf)   ← receipt lands here
└── WH/Stock1/Bay04           (leaf)
```

---

## API

`GET /api/snapshot` is the single call the app makes on load; every mutation
returns and the client re-snapshots. Refs contain slashes, so documents are
addressed by query param — `/api/delivery?ref=WH/OUT/0001`, not a path segment.

```
GET    /api/snapshot
POST   /api/reset
GET    /api/products?q&category&status
GET    /api/products/:sku
GET    /api/receipts · /api/receipt?ref=
POST   /api/receipt/validate?ref=
GET    /api/deliveries · /api/delivery?ref=
POST   /api/delivery/validate?ref=
GET    /api/transfers
POST   /api/transfers
POST   /api/transfer/execute?ref=
GET    /api/adjustments
POST   /api/adjustments          open a count sheet
POST   /api/adjustment/post?ref= approve + write the ledger row
GET    /api/ledger?type&sku
GET    /api/warehouses · /api/locations
GET    /api/settings            PATCH /api/settings
GET    /api/scenario            POST /api/scenario/run
```

---

## Layout

```
server/src/
  types.ts      domain model
  seed.ts       the wireframe data, transcribed
  store.ts      JSON persistence + doc/ledger sequences
  engine.ts     all inventory invariants live here
  scenario.ts   the 4-step walkthrough
  routes.ts     REST surface
  index.ts      express app

client/src/
  api.ts        typed fetch wrapper, ApiError carries blockers
  store.tsx     snapshot + user + toasts; every mutation funnels through run()
  components/   ui.tsx (tokens, badges) · shell.tsx (nav) · chrome.tsx (toasts, scenario bar)
  pages/        one file per wireframe
```

`run()` in `store.tsx` is the single mutation path: it calls the API, re-reads
the snapshot, and toasts the server's own error text on a 422 — so the UI can
never drift from the engine.

---

## Notes / limits

- Persistence is a JSON file (`server/data/db.json`), not a database. Fine for
  a demo; swap `store.ts` for a real driver without touching `engine.ts`.
- Auth is a role switcher, not authentication. Real sign-in is out of scope.
- The dual sign-off threshold is *flagged* but a single user can still approve.
  A production rollout would capture a second approver identity on the ledger
  row.
