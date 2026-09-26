import { useState } from 'react';
import { useTransfers, useValidateTransfer } from '../../hooks/useTransfers';
import { useProducts } from '../../hooks/useProducts';
import { useWarehouses } from '../../hooks/useWarehouses';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { axiosClient } from '../../api/axiosClient';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  ArrowLeftRight,
  Plus,
  CheckCircle2,
  X,
  Trash2,
  ArrowRight,
  FileText,
} from 'lucide-react';

export const TransfersListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || 'all';
  const queryStr = statusFilter !== 'all' ? `status=${statusFilter}` : '';

  const { data: transfers, isLoading, error } = useTransfers(queryStr);
  const { data: products } = useProducts();
  const { data: warehouses } = useWarehouses();
  const validateMutation = useValidateTransfer();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(searchParams.get('action') === 'new');
  const [formData, setFormData] = useState({
    fromWarehouseLoc: '',
    toWarehouseLoc: '',
    notes: '',
    lines: [{ productId: '', qty: 10 }],
  });

  const handleValidate = async (id: string) => {
    if (confirm('Validate this transfer? Stock will immediately move between facilities.')) {
      try {
        await validateMutation.mutateAsync(id);
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
        toast.success('Internal transfer completed and stock moved!');
      } catch (err: any) {
        toast.error(`Validation Error: ${err.response?.data?.message || 'Failed to validate'}`);
      }
    }
  };

  const addLineItem = () => {
    const defaultProd = products?.[0]?._id || '';
    setFormData((prev) => ({
      ...prev,
      lines: [...prev.lines, { productId: defaultProd, qty: 5 }],
    }));
  };

  const removeLineItem = (index: number) => {
    if (formData.lines.length === 1) {
      toast.error('At least one line item is required');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fromWarehouseLoc) return toast.error('Please select source location');
    if (!formData.toWarehouseLoc) return toast.error('Please select destination location');
    if (formData.fromWarehouseLoc === formData.toWarehouseLoc) {
      return toast.error('Source and destination cannot be identical');
    }
    if (!formData.lines[0].productId) return toast.error('Please select a product');

    const [fromWhId, fromLocId] = formData.fromWarehouseLoc.split('|');
    const [toWhId, toLocId] = formData.toWarehouseLoc.split('|');

    // Verify stock at source
    for (const line of formData.lines) {
      const prod = products?.find((p: any) => p._id === line.productId);
      if (prod) {
        const available = prod.warehouseStock?.[fromWhId] ?? prod.totalStock;
        if (available < line.qty) {
          return toast.error(
            `Insufficient stock at source for "${prod.name}". Available: ${available}, Requested: ${line.qty}`
          );
        }
      }
    }

    try {
      await axiosClient.post('/transfers', {
        fromWarehouseId: fromWhId,
        fromLocationId: fromLocId,
        toWarehouseId: toWhId,
        toLocationId: toLocId,
        lines: formData.lines,
        notes: formData.notes,
      });
      setIsModalOpen(false);
      setFormData({
        fromWarehouseLoc: '',
        toWarehouseLoc: '',
        notes: '',
        lines: [{ productId: '', qty: 10 }],
      });
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Internal transfer document created!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create transfer');
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-10 w-64 skeleton" />
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-destructive font-medium">Error loading transfers: {(error as any).message}</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Internal Transfers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Balance inventory between regional hubs and warehouse storage locations.
          </p>
        </div>

        <button
          onClick={() => {
            if (warehouses && warehouses.length >= 2) {
              setFormData((prev) => ({
                ...prev,
                fromWarehouseLoc: `${warehouses[0]._id}|${warehouses[0].locations[0]?._id}`,
                toWarehouseLoc: `${warehouses[1]._id}|${warehouses[1].locations[0]?._id}`,
                lines: [{ productId: products?.[0]?._id || '', qty: 10 }],
              }));
            }
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Transfer</span>
        </button>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        {[
          { key: 'all', label: 'All Transfers' },
          { key: 'Draft', label: 'Pending Transfer' },
          { key: 'Done', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              const params = new URLSearchParams(searchParams);
              if (tab.key === 'all') params.delete('status');
              else params.set('status', tab.key);
              setSearchParams(params);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              statusFilter === tab.key
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TRANSFERS TABLE */}
      <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Document</th>
                <th className="py-3.5 px-4">Transfer Route</th>
                <th className="py-3.5 px-4">Units Moved</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transfers?.map((transfer: any) => {
                const totalUnits = transfer.lines?.reduce((s: number, l: any) => s + (l.qty || 0), 0) || 0;

                return (
                  <tr key={transfer._id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-500" />
                        <span className="font-mono font-bold text-foreground">{transfer.code}</span>
                      </div>
                    </td>

                    {/* Route visual */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-foreground">{transfer.fromWarehouseId?.name}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="font-semibold text-foreground">{transfer.toWarehouseId?.name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-xs">
                        <span className="font-bold text-foreground">{totalUnits} units</span>
                        <span className="text-muted-foreground ml-1.5">({transfer.lines?.length || 0} SKUs)</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-muted-foreground font-mono text-xs">
                      {format(new Date(transfer.createdAt), 'MMM d, yyyy')}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          transfer.status === 'Done' ? 'badge-done' : 'badge-waiting'
                        }`}
                      >
                        {transfer.status === 'Done' ? 'Completed' : 'Draft / Transit'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {transfer.status === 'Draft' ? (
                        <button
                          onClick={() => handleValidate(transfer._id)}
                          disabled={validateMutation.isPending}
                          className="px-3 py-1 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 shadow-xs transition-colors flex items-center gap-1.5 ml-auto"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Validate & Move</span>
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-500 flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Transferred
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {(!transfers || transfers.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ArrowLeftRight className="w-8 h-8 text-muted-foreground/50" />
                      <p className="text-sm font-semibold">No internal transfers found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE TRANSFER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold text-xs">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold">Initiate Inter-Facility Transfer</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto scrollbar-thin">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Source Hub & Location</label>
                  <select
                    required
                    value={formData.fromWarehouseLoc}
                    onChange={(e) => setFormData({ ...formData, fromWarehouseLoc: e.target.value })}
                    className="mt-1 w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="" disabled>Select origin</option>
                    {warehouses?.flatMap((w: any) =>
                      w.locations.map((loc: any) => (
                        <option key={`${w._id}|${loc._id}`} value={`${w._id}|${loc._id}`}>
                          {w.name} — {loc.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Destination Hub & Location</label>
                  <select
                    required
                    value={formData.toWarehouseLoc}
                    onChange={(e) => setFormData({ ...formData, toWarehouseLoc: e.target.value })}
                    className="mt-1 w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="" disabled>Select destination</option>
                    {warehouses?.flatMap((w: any) =>
                      w.locations.map((loc: any) => (
                        <option key={`${w._id}|${loc._id}`} value={`${w._id}|${loc._id}`}>
                          {w.name} — {loc.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Line Items */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Transfer Items ({formData.lines.length})
                  </label>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </button>
                </div>

                <div className="space-y-2.5">
                  {formData.lines.map((line, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-muted/30 border border-border flex items-center gap-3"
                    >
                      <div className="flex-1">
                        <select
                          required
                          value={line.productId}
                          onChange={(e) => {
                            const newLines = [...formData.lines];
                            newLines[idx].productId = e.target.value;
                            setFormData({ ...formData, lines: newLines });
                          }}
                          className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs focus:ring-2 focus:ring-primary outline-none"
                        >
                          <option value="" disabled>Select SKU</option>
                          {products?.map((p: any) => (
                            <option key={p._id} value={p._id}>
                              {p.name} ({p.sku}) — Stock: {p.totalStock} {p.uom}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-28">
                        <input
                          required
                          type="number"
                          min="1"
                          placeholder="Transfer Qty"
                          value={line.qty}
                          onChange={(e) => {
                            const newLines = [...formData.lines];
                            newLines[idx].qty = parseInt(e.target.value) || 1;
                            setFormData({ ...formData, lines: newLines });
                          }}
                          className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs font-mono focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeLineItem(idx)}
                        className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Transfer Reason / Manifest</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Seasonal replenishment, warehouse consolidation..."
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-accent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 shadow-sm"
                >
                  Create Transfer Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
