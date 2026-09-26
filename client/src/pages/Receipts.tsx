import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useApp, useUser } from '../store';
import { Modal } from '../components/overlays';
import {
  Badge,
  Card,
  Empty,
  Field,
  Icon,
  PageHeader,
  Ref,
  SectionTitle,
  Segmented,
  StatusBadge,
} from '../components/ui';
import type { DocColumn, Receipt } from '../types';
import { docMatchesColumn } from '../types';

const COLUMN_META: Record<string, { label: string; icon: string }> = {
  Draft: { label: 'Draft', icon: 'edit_note' },
  Waiting: { label: 'Waiting', icon: 'hourglass_top' },
  Ready: { label: 'Ready to receive', icon: 'move_to_inbox' },
  Done: { label: 'Received', icon: 'task_alt' },
};

const TIER_TONE = {
  'Tier 1 Vendor': 'success',
  'Tier 2 Vendor': 'warn',
  Unverified: 'error',
} as const;

export default function Receipts() {
  const { snap, metadata, can } = useApp();
  const [params, setParams] = useSearchParams();
  const [newOpen, setNewOpen] = useState(params.get('new') === '1');
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [status, setStatus] = useState('All');

  const closeNew = () => {
    setNewOpen(false);
    if (params.get('new')) {
      params.delete('new');
      setParams(params, { replace: true });
    }
  };

  if (!snap) return null;
  const columns: DocColumn[] = (metadata?.statusFlows.receipt ?? []).map((key) => ({
    key,
    ...(COLUMN_META[key] ?? { label: key, icon: 'task_alt' }),
  }));
  const chips = ['All', ...columns.map((c) => c.key), 'Overdue'];
  const rows = status === 'All' ? snap.receipts : snap.receipts.filter((r) => r.status === status);

  return (
    <>
      <PageHeader
        eyebrow="Inbound operations"
        title="Receipts"
        subtitle="Expected goods arriving against a purchase order. Validating a receipt posts every received line to the ledger and its bin."
        actions={
          <div className="flex items-center gap-2">
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: 'list', label: 'List', icon: 'view_list' },
                { value: 'kanban', label: 'Kanban', icon: 'view_kanban' },
              ]}
            />
            {can('receipt.create') && (
              <button className="btn btn-primary" onClick={() => setNewOpen(true)}>
                <Icon name="add" size={16} /> New receipt
              </button>
            )}
          </div>
        }
      />

      <div className="card mb-4 flex flex-wrap items-end gap-3 p-3">
        <label className="block min-w-44">
          <span className="mb-1 block text-[11px] font-bold tracking-wide text-on-surface/60 uppercase">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="field">
            {chips.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap gap-4 border-l border-outline-variant pl-4 text-[11.5px]">
          {columns.map((c) => {
            const n = snap.receipts.filter((r) => docMatchesColumn(r, c.key)).length;
            return (
              <span key={c.key} className="text-on-surface/55">
                <b className="tnum block text-[15px] text-on-surface">{n}</b>
                {c.label}
              </span>
            );
          })}
        </div>
        <Link to="/deliveries" className="btn btn-outline ml-auto">
          <Icon name="local_shipping" size={16} /> Outbound deliveries
        </Link>
      </div>

      {rows.length === 0 ? (
        <Card>
          <Empty icon="move_to_inbox" title="No receipts with this status" />
        </Card>
      ) : view === 'list' ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="border-b border-outline-variant bg-surface-low">
                <tr>
                  <th className="th">Reference</th>
                  <th className="th">Supplier</th>
                  <th className="th">PO / BOL</th>
                  <th className="th">Destination</th>
                  <th className="th text-right">Lines</th>
                  <th className="th text-right">Expected</th>
                  <th className="th">Dock</th>
                  <th className="th">Scheduled</th>
                  <th className="th">Status</th>
                  <th className="th" />
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {rows.map((r) => {
                  const expected = r.items.reduce((a, i) => a + i.expected, 0);
                  return (
                    <tr key={r.ref} className="row">
                      <td className="td">
                        <Link to={`/receipts/${encodeURIComponent(r.ref)}`} className="ref text-[11.5px] hover:text-primary hover:underline">
                          {r.ref}
                        </Link>
                      </td>
                      <td className="td max-w-52">
                        <span className="block truncate text-[12px] font-semibold">{r.supplier}</span>
                        <Badge tone={TIER_TONE[r.supplierTier]} className="mt-0.5">
                          {r.supplierTier}
                        </Badge>
                      </td>
                      <td className="td font-mono text-[11px] whitespace-nowrap">
                        {r.poRef}
                        <span className="mt-0.5 block text-[10px] text-on-surface/45">{r.bolRef}</span>
                      </td>
                      <td className="td">
                        <Ref className="text-[11px]">{r.destination}</Ref>
                      </td>
                      <td className="td tnum text-right font-mono text-[11.5px]">{r.items.length}</td>
                      <td className="td tnum text-right font-mono text-[11.5px]">{expected}</td>
                      <td className="td font-mono text-[10.5px] whitespace-nowrap">{r.dockBay}</td>
                      <td className="td font-mono text-[11px] whitespace-nowrap">{r.scheduledDate}</td>
                      <td className="td">
                        <StatusBadge value={r.status} dot />
                      </td>
                      <td className="td text-right">
                        <Link to={`/receipts/${encodeURIComponent(r.ref)}`} className="btn btn-outline !px-2 !py-1">
                          <Icon name="chevron_right" size={15} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {columns.map((col) => {
            const items = rows.filter((r) => docMatchesColumn(r, col.key));
            return (
              <div key={col.key} className="flex min-h-40 flex-col rounded-xl border border-outline-variant bg-surface-low p-2">
                <div className="mb-2 flex items-center gap-1.5 px-1">
                  <Icon name={col.icon} size={15} className="text-primary" />
                  <span className="text-[11.5px] font-bold">{col.label}</span>
                  <span className="tnum ml-auto rounded-full bg-surface-lowest px-1.5 text-[10.5px] font-bold text-outline">
                    {items.length}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  {items.map((r) => (
                    <Link
                      key={r.ref}
                      to={`/receipts/${encodeURIComponent(r.ref)}`}
                      className="card p-2.5 transition hover:border-primary/40"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Ref className="text-[11px]">{r.ref}</Ref>
                        <StatusBadge value={r.status} />
                      </div>
                      <p className="mt-1.5 truncate text-[12px] font-semibold">{r.supplier}</p>
                      <div className="mt-1 flex items-center gap-1">
                        <Badge tone={TIER_TONE[r.supplierTier]}>{r.supplierTier}</Badge>
                      </div>
                      <div className="mt-2 flex items-center justify-between border-t border-outline-variant pt-1.5 text-[10px]">
                        <span className="tnum text-on-surface/55">{r.items.length} lines</span>
                        <span className="font-mono text-on-surface/45">{r.dockBay}</span>
                      </div>
                    </Link>
                  ))}
                  {items.length === 0 && (
                    <p className="rounded-lg border border-dashed border-outline-variant px-2 py-4 text-center text-[10.5px] text-on-surface/40">
                      empty
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <NewReceiptModal open={newOpen} onClose={closeNew} />
    </>
  );
}

function NewReceiptModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { snap, run, busy } = useApp();
  const [supplier, setSupplier] = useState('');
  const [supplierTier, setSupplierTier] = useState<'Tier 1 Vendor' | 'Tier 2 Vendor' | 'Unverified'>('Tier 1 Vendor');
  const [poRef, setPoRef] = useState('');
  const [destination, setDestination] = useState('');
  const [carrier, setCarrier] = useState('Standard Freight');
  const [dockBay, setDockBay] = useState('Dock-01');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<{ sku: string; expected: number; bin: string }[]>([]);

  useEffect(() => {
    if (open && snap?.locations && snap.locations.length > 0) {
      if (!destination) {
        const dest = snap.locations.find((l) => l.code === 'WH/Input' || l.code.includes('Dock')) ?? snap.locations[0];
        setDestination(dest.code);
      }
      if (lines.length === 0 && snap.products.length > 0) {
        setLines([{ sku: snap.products[0].sku, expected: 50, bin: snap.locations[0].code }]);
      }
    }
  }, [open, snap, destination, lines.length]);

  if (!open) return null;

  const addLine = () => {
    if (snap?.products && snap.products.length > 0) {
      setLines((prev) => [...prev, { sku: snap.products[0].sku, expected: 10, bin: destination || snap.locations[0].code }]);
    }
  };

  const removeLine = (idx: number) => {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateLine = (idx: number, patch: Partial<{ sku: string; expected: number; bin: string }>) => {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier.trim() || lines.length === 0) return;
    const res = await run(
      `Create receipt from ${supplier}`,
      () =>
        api.createReceipt({
          supplier: supplier.trim(),
          supplierTier,
          poRef: poRef.trim() || undefined,
          destination,
          carrier,
          dockBay,
          notes: notes.trim() || undefined,
          items: lines.map((l) => ({
            sku: l.sku,
            expected: Number(l.expected) || 1,
            bin: l.bin || destination,
          })),
        }),
      { success: 'Goods receipt created in database' },
    );
    if (res) {
      onClose();
      setSupplier('');
      setPoRef('');
      setNotes('');
    }
  };

  return (
    <Modal title="Create Inbound Goods Receipt" onClose={onClose} width="max-w-2xl">
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Supplier / Vendor *">
            <input
              required
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="e.g. Apex Industrial Supplies"
              className="field"
            />
          </Field>
          <Field label="Supplier Tier">
            <select
              value={supplierTier}
              onChange={(e) => setSupplierTier(e.target.value as any)}
              className="field"
            >
              <option value="Tier 1 Vendor">Tier 1 Vendor</option>
              <option value="Tier 2 Vendor">Tier 2 Vendor</option>
              <option value="Unverified">Unverified</option>
            </select>
          </Field>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Purchase Order # (PO)">
            <input
              value={poRef}
              onChange={(e) => setPoRef(e.target.value)}
              placeholder="e.g. PO-8921"
              className="field font-mono"
            />
          </Field>
          <Field label="Destination Location">
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="field font-mono"
            >
              {(snap?.locations ?? []).map((l) => (
                <option key={l.code} value={l.code}>
                  {l.code} ({l.name})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Dock Bay">
            <input
              value={dockBay}
              onChange={(e) => setDockBay(e.target.value)}
              placeholder="e.g. Inward Dock A"
              className="field"
            />
          </Field>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11.5px] font-bold tracking-wide uppercase text-on-surface/65">
              Line Items ({lines.length})
            </span>
            <button type="button" onClick={addLine} className="btn btn-outline !py-1 !text-xs">
              <Icon name="add" size={14} /> Add Line
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto rounded-card border border-outline-variant p-2 bg-surface-low">
            {lines.map((line, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={line.sku}
                  onChange={(e) => updateLine(idx, { sku: e.target.value })}
                  className="field flex-1 !py-1 text-xs font-mono"
                >
                  {(snap?.products ?? []).map((p) => (
                    <option key={p.sku} value={p.sku}>
                      {p.sku} - {p.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  value={line.expected}
                  onChange={(e) => updateLine(idx, { expected: Number(e.target.value) })}
                  className="field w-24 !py-1 text-xs font-mono"
                  placeholder="Expected"
                />
                <select
                  value={line.bin}
                  onChange={(e) => updateLine(idx, { bin: e.target.value })}
                  className="field w-40 !py-1 text-xs font-mono"
                >
                  {(snap?.locations ?? []).map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.code}
                    </option>
                  ))}
                </select>
                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLine(idx)}
                    className="text-error hover:opacity-80 p-1"
                    title="Remove line"
                  >
                    <Icon name="delete" size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <Field label="Notes / Instructions">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Special receiving or inspection notes..."
            className="field !h-16 resize-none"
          />
        </Field>

        <div className="mt-5 flex justify-end gap-2 border-t border-outline-variant pt-3">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy || !supplier.trim() || lines.length === 0}>
            <Icon name="save" size={16} /> Save Receipt to Database
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function ReceiptDetail() {
  const { ref = '' } = useParams();
  const decoded = decodeURIComponent(ref);
  const { snap, run, busy } = useApp();
  const user = useUser();
  const [doc, setDoc] = useState<Receipt | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    try {
      setDoc(await api.receipt(decoded));
      setErr(null);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Could not load the receipt');
    }
  };

  useEffect(() => {
    void load();
  }, [decoded, snap?.ledger.length, snap?.receipts]);

  const back = (
    <Link to="/receipts" className="mb-3 inline-flex items-center gap-1 text-[12px] font-semibold text-on-surface/60 hover:text-primary">
      <Icon name="arrow_back" size={15} /> Receipts
    </Link>
  );

  if (err) {
    return (
      <>
        {back}
        <Card>
          <Empty icon="error" title={err} />
        </Card>
      </>
    );
  }
  if (!doc) {
    return (
      <>
        {back}
        <Card>
          <Empty icon="hourglass_top" title="Loading receipt…" />
        </Card>
      </>
    );
  }

  const lines = doc.lines ?? [];
  const posted = doc.status === 'Done';
  const totalExpected = lines.reduce((a, l) => a + l.expected, 0);
  const totalReceived = lines.reduce((a, l) => a + l.received, 0);

  return (
    <>
      {back}
      <PageHeader
        eyebrow={`Goods receipt · raised by ${doc.createdBy}`}
        title={doc.ref}
        subtitle={`${doc.supplier} · ${doc.items.length} line(s) · expected into ${doc.destination}`}
        actions={
          <>
            <Badge tone={TIER_TONE[doc.supplierTier]}>{doc.supplierTier}</Badge>
            <StatusBadge value={doc.status} dot />
            <button
              className="btn btn-teal"
              disabled={busy || posted || totalReceived === 0}
              onClick={() =>
                void run(
                  `Receipt ${doc.ref}`,
                  () => api.validateReceipt(doc.ref, user.name),
                  { success: `${doc.ref} received into stock` },
                ).then(() => load())
              }
            >
              <Icon name={posted ? 'task_alt' : 'move_to_inbox'} size={16} fill />
              {posted ? 'Received' : 'Receive into stock'}
            </button>
          </>
        }
      />

      {posted && (
        <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-success/30 bg-success-container px-4 py-3 text-on-success-container">
          <Icon name="verified" size={20} fill />
          <div>
            <p className="text-[12.5px] font-extrabold">Goods received and posted</p>
            <p className="text-[11.5px] opacity-85">
              {totalReceived} unit(s) landed in their bins at {doc.postedAt}. Ledger rows written
              under {user.name}.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="border-b border-outline-variant px-4 py-2.5">
              <SectionTitle icon="format_list_bulleted">Expected vs received</SectionTitle>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px]">
                <thead className="border-b border-outline-variant bg-surface-low">
                  <tr>
                    <th className="th">SKU</th>
                    <th className="th">Bin</th>
                    <th className="th">Lot / Barcode</th>
                    <th className="th text-right">Expected</th>
                    <th className="th text-right">Received</th>
                    <th className="th text-right">Variance</th>
                    <th className="th text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {lines.map((l) => (
                    <tr key={l.sku} className={`row ${l.variance < 0 ? 'bg-warning-container/25' : ''}`}>
                      <td className="td max-w-64">
                        <Link to={`/products/${l.sku}`} className="block">
                          <span className="block truncate text-[12px] font-semibold hover:text-primary hover:underline">
                            {l.name}
                          </span>
                          <Ref className="text-[10.5px] text-on-surface/50">{l.sku}</Ref>
                        </Link>
                      </td>
                      <td className="td">
                        <Ref className="text-[11px]">{l.bin}</Ref>
                      </td>
                      <td className="td font-mono text-[10.5px] whitespace-nowrap text-on-surface/65">
                        {l.lot}
                        <span className="mt-0.5 block">{l.barcode}</span>
                      </td>
                      <td className="td tnum text-right font-mono">{l.expected}</td>
                      <td className="td tnum text-right font-mono font-bold">{l.received}</td>
                      <td
                        className={`td tnum text-right font-mono font-bold ${
                          l.variance === 0 ? 'text-on-surface/40' : l.variance < 0 ? 'text-error' : 'text-success'
                        }`}
                      >
                        {l.variance > 0 ? '+' : ''}
                        {l.variance}
                      </td>
                      <td className="td tnum text-right font-mono text-[11.5px]">
                        {snap?.settings.currency}
                        {l.lineValue.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-outline-variant bg-surface-low">
                  <tr>
                    <td className="td font-bold" colSpan={3}>
                      Totals
                    </td>
                    <td className="td tnum text-right font-mono font-bold">{totalExpected}</td>
                    <td className="td tnum text-right font-mono font-bold">{totalReceived}</td>
                    <td className="td tnum text-right font-mono font-bold">
                      {totalReceived - totalExpected > 0 ? '+' : ''}
                      {totalReceived - totalExpected}
                    </td>
                    <td className="td tnum text-right font-mono font-extrabold">
                      {snap?.settings.currency}
                      {(doc.totalValue ?? 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>

          <Card className="p-4">
            <SectionTitle icon="sticky_note_2">Dock notes</SectionTitle>
            <p className="text-[12.5px] leading-relaxed text-on-surface/75">{doc.notes}</p>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <SectionTitle icon="storefront">Supplier</SectionTitle>
            <dl className="space-y-2.5 text-[12px]">
              <Row label="Name" value={doc.supplier} />
              <Row label="Contact" value={doc.contact} />
              <Row label="PO ref" value={doc.poRef} mono />
              <Row label="BOL ref" value={doc.bolRef} mono />
              <Row label="Tier" value={doc.supplierTier} />
            </dl>
          </Card>

          <Card className="p-4">
            <SectionTitle icon="move_to_inbox">Logistics</SectionTitle>
            <dl className="space-y-2.5 text-[12px]">
              <Row label="Destination" value={doc.destination} mono />
              <Row label="Dock bay" value={doc.dockBay} mono />
              <Row label="Carrier" value={doc.carrier} />
              <Row label="Scheduled" value={doc.scheduledDate} mono />
              <Row label="Raised" value={doc.createdAt} mono />
              {doc.postedAt && <Row label="Posted" value={doc.postedAt} mono />}
            </dl>
          </Card>

          <Card className="p-4">
            <SectionTitle icon="fact_check">Receiving checklist</SectionTitle>
            <ul className="space-y-2 text-[12px]">
              {[
                { ok: doc.bolRef !== '—', label: 'Bill of lading present' },
                { ok: doc.dockBay !== 'Unassigned', label: 'Dock bay assigned' },
                { ok: totalReceived > 0, label: 'At least one line physically counted' },
                { ok: lines.every((l) => l.lot !== 'PENDING'), label: 'Lot numbers captured' },
                { ok: doc.supplierTier !== 'Unverified', label: 'Supplier verified' },
              ].map((c) => (
                <li key={c.label} className="flex items-start gap-2">
                  <Icon
                    name={c.ok ? 'check_circle' : 'radio_button_unchecked'}
                    size={16}
                    fill={c.ok}
                    className={`mt-px shrink-0 ${c.ok ? 'text-success' : 'text-warning'}`}
                  />
                  <span className={c.ok ? '' : 'text-warning'}>{c.label}</span>
                </li>
              ))}
            </ul>
            {doc.supplierTier === 'Unverified' && (
              <p className="mt-3 rounded-lg bg-error-container px-2.5 py-2 text-[11px] text-on-error-container">
                Unverified supplier — quarantine the received stock until onboarding is complete.
              </p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-on-surface/50">{label}</dt>
      <dd className={`text-right font-semibold ${mono ? 'font-mono text-[11.5px]' : ''}`}>{value}</dd>
    </div>
  );
}
