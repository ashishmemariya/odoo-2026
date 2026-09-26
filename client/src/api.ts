import type { AdjustmentReason, Delivery, Product, Receipt, Snapshot, StorageLocation } from './types';

const BASE = '/api';

export class ApiError extends Error {
  status: number;
  blockers: string[];
  constructor(status: number, message: string, blockers: string[] = []) {
    super(message);
    this.status = status;
    this.blockers = blockers;
  }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'content-type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string; blockers?: string[] };
    throw new ApiError(res.status, body.error ?? `Request failed (${res.status})`, body.blockers ?? []);
  }
  return (await res.json()) as T;
}

const get = <T,>(path: string) => req<T>(path);
const post = <T,>(path: string, body?: unknown) =>
  req<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) });
const patch = <T,>(path: string, body: unknown) =>
  req<T>(path, { method: 'PATCH', body: JSON.stringify(body) });

const q = (params: Record<string, string | number | undefined>) => {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined) s.set(k, String(v));
  const out = s.toString();
  return out ? `?${out}` : '';
};

export const api = {
  snapshot: () => get<Snapshot>('/snapshot'),
  reset: () => post<{ ok: true }>('/reset'),
  users: () => get<Snapshot['users']>('/users'),

  products: (f?: { q?: string; category?: string; status?: string }) =>
    get<Product[]>(`/products${q({ ...f })}`),
  product: (sku: string) => get<Product>(`/products/${encodeURIComponent(sku)}`),
  categories: () => get<string[]>('/categories'),

  receipts: (status?: string) => get<Receipt[]>(`/receipts${q({ status })}`),
  receipt: (ref: string) => get<Receipt>(`/receipt${q({ ref })}`),
  validateReceipt: (ref: string, user: string) =>
    post<{ ok: true; receipt: Receipt }>(`/receipt/validate${q({ ref })}`, { user }),

  deliveries: (status?: string) => get<Delivery[]>(`/deliveries${q({ status })}`),
  delivery: (ref: string) => get<Delivery>(`/delivery${q({ ref })}`),
  validateDelivery: (ref: string, user: string) =>
    post<{ ok: true; delivery: Delivery }>(`/delivery/validate${q({ ref })}`, { user }),

  transfers: () => get<Snapshot['transfers']>('/transfers'),
  createTransfer: (body: {
    from: string;
    to: string;
    sku: string;
    qty: number;
    requestedBy?: string;
  }) => post<Snapshot['transfers'][number]>('/transfers', body),
  executeTransfer: (ref: string, user: string) =>
    post<{ ok: true; transfer: Snapshot['transfers'][number] }>(`/transfer/execute${q({ ref })}`, {
      user,
    }),

  adjustments: () => get<Snapshot['adjustments']>('/adjustments'),
  createCount: (body: {
    sku: string;
    location: string;
    recorded: number;
    counted: number;
    reason: string;
    memo: string;
    auditor: string;
  }) => post<Snapshot['adjustments'][number]>('/adjustments', body),
  postAdjustment: (body: {
    ref: string;
    counted: number;
    reason: AdjustmentReason;
    memo: string;
    user: string;
  }) => post<{ ok: true; adjustment: Snapshot['adjustments'][number] }>(`/adjustment/post${q({ ref: body.ref })}`, body),

  ledger: (f?: { type?: string; sku?: string }) => get<Snapshot['ledger']>(`/ledger${q({ ...f })}`),

  warehouses: () => get<Snapshot['warehouses']>('/warehouses'),
  locations: () => get<StorageLocation[]>('/locations'),

  settings: () => get<Snapshot['settings']>('/settings'),
  saveSettings: (body: Partial<Snapshot['settings']>) => patch<Snapshot['settings']>('/settings', body),

  runScenario: (user: string) =>
    post<{ action: string; message: string; ref: string }>('/scenario/run', { user }),
};
