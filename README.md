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
| `npm run smoke` | 54 assertions against a running API (auth, roles, guardrails, FIFO, hierarchy, ledger) |
| `npm run browser` | 30 assertions driving real Chrome over CDP (sign-in gate, palette, every route, sign-out) |
| `npm run verify` | typecheck → smoke → browser |
| `npm run typecheck` | `tsc --noEmit` across both workspaces |
| `npm run reset` | Delete and reseed `server/data/db.json` |

> On Windows the `node_modules/.bin` shims may not be created, so every script
> invokes its tool through `node <entry-point>` instead of a bare binary name.

---

## Signing in

Authentication is real: passwords are stored as **scrypt** hashes with a
per-user salt and compared in constant time, and every mutation is attributed to
the session user rather than to anything the browser sends.

| Account | Role | Password |
| --- | --- | --- |
| `demo@stocksense.app` | Inventory Manager | `Demo@1234` |
| `priya@stocksense.app` | Warehouse Staff | `Demo@1234` |
| `arjun@stocksense.app` | Floor Supervisor | `Demo@1234` |
| `admin@stocksense.app` | Admin | `Admin@1234` |

The sign-in screen lists these accounts and signs you in with one click.

**Roles are enforced on the server**, not just hidden in the UI. `ROLE_PERMISSIONS`
in `server/src/auth.ts` maps each role to a capability list, and every mutating
route is wrapped in `requirePermission(...)`. A Warehouse Staff account calling
the adjustment-approval endpoint gets a **403** naming their role. Client-side
hiding is a convenience; the server is the boundary.

Password material lives in a separate `credentials` map, never on the `User`
record, so any code path that serialises users — the snapshot, `/api/users`, the
sign-in directory — cannot leak a hash by forgetting a projection. The smoke
suite asserts this.

`GET /api/diagnostics` is the only place backend guardrails are described in
technical terms, and it requires the Admin role.

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
| Attribution | Every row records the acting **session** user and a verbatim note |
| Dual sign-off | `requiresDualSignoff()` fires on absolute impact **or** variance % |
| Role enforcement | `requirePermission()` guards every mutating route; 403 on a capability the role lacks |

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
GET    /api/snapshot              the one call the app makes on load
POST   /api/auth/login            → { token, user, permissions }
POST   /api/auth/logout
GET    /api/auth/session          requires a token
GET    /api/auth/directory        public demo account list (no secrets)
GET    /api/diagnostics           Admin only

POST   /api/reset                 requires demo.reset
GET    /api/products?q&category&status
GET    /api/products/:sku
GET    /api/receipts · /api/receipt?ref=
POST   /api/receipt/validate?ref=      requires receipt.post
GET    /api/deliveries · /api/delivery?ref=
POST   /api/delivery/validate?ref=     requires delivery.post
GET    /api/transfers
POST   /api/transfers                   requires transfer.create
POST   /api/transfer/execute?ref=       requires transfer.post
GET    /api/adjustments
POST   /api/adjustments          open a count sheet   (adjustment.create)
POST   /api/adjustment/post?ref= approve + write the ledger row (adjustment.approve)
GET    /api/ledger?type&sku
GET    /api/warehouses · /api/locations
GET    /api/settings            PATCH /api/settings (settings.manage)
GET    /api/scenario            POST /api/scenario/run
```

---

## Layout

```
server/src/
  types.ts      domain model
  seed.ts       the wireframe data, transcribed
  store.ts      JSON persistence + doc/ledger sequences + version-gated migration
  auth.ts       scrypt hashing, sessions, role→permission matrix, Express guards
  engine.ts     all inventory invariants live here
  scenario.ts   the 4-step walkthrough
  routes.ts     REST surface
  index.ts      express app

client/src/
  api.ts        typed fetch wrapper, bearer token injection, ApiError carries blockers
  store.tsx     session + snapshot + toasts; every mutation funnels through run()
  components/   ui.tsx (tokens, badges) · shell.tsx (role-aware nav) ·
                chrome.tsx (toasts, scenario bar) · CommandPalette.tsx (Ctrl+K)
  pages/        one file per wireframe + Login.tsx

scripts/
  browser-check.mjs   dependency-free Chrome DevTools Protocol checks
```

`run()` in `store.tsx` is the single mutation path: it calls the API, re-reads
the snapshot, and toasts the server's own error text on a 422 — so the UI can
never drift from the engine.

There is deliberately **one** state model. An earlier parallel `frontend/`
workspace held a second 44 KB in-memory `mockDb` copy of the domain; its
command palette and sign-in screen were ported into `client/` and the workspace
was removed, rather than leaving two sources of truth in the repo.

---

## Notes / limits

- Persistence is a JSON file (`server/data/db.json`), not a database. Fine for
  a demo; swap `store.ts` for a real driver without touching `engine.ts`. A
  `version` bump reseeds rather than booting into a half-migrated file.
- Sessions are held **in memory**, so restarting the API signs everyone out.
  Tokens are never written to disk.
- The dual sign-off threshold is *flagged* but a single user can still approve.
  A production rollout would capture a second approver identity on the ledger
  row.
