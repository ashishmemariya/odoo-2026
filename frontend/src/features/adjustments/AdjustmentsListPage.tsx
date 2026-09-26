import { useState } from 'react';
import { useAdjustments, useValidateAdjustment } from '../../hooks/useAdjustments';
import { useProducts } from '../../hooks/useProducts';
import { useWarehouses } from '../../hooks/useWarehouses';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { axiosClient } from '../../api/axiosClient';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Plus,
  CheckCircle2,
  Building2,
  X,
  Scale,
} from 'lucide-react';

export const AdjustmentsListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || 'all';
  const queryStr = statusFilter !== 'all' ? `status=${statusFilter}` : '';

  const { data: adjustments, isLoading, error } = useAdjustments(queryStr);
  const { data: products } = useProducts();
  const { data: warehouses } = useWarehouses();
  const validateMutation = useValidateAdjustment();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(searchParams.get('action') === 'new');
  const [formData, setFormData] = useState({
    reason: 'Routine Cycle Count',
    warehouseId: '',
    notes: '',
    lines: [{ productId: '', systemQty: 0, countedQty: 0 }],
  });

  const handleProductSelect = (productId: string) => {
    const prod = products?.find((p: any) => p._id === productId);
    const systemStock = prod
      ? (formData.warehouseId ? prod.warehouseStock?.[formData.warehouseId] : prod.totalStock) || prod.totalStock
      : 0;

    setFormData((prev) => ({
      ...prev,
      lines: [{ productId, systemQty: systemStock, countedQty: systemStock }],
    }));
  };

  const handleValidate = async (id: string) => {
    if (confirm('Validate this adjustment? Inventory stock will be permanently aligned with the counted quantity.')) {
      try {
        await validateMutation.mutateAsync(id);
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
        toast.success('Inventory counts synchronized successfully!');
      } catch (err: any) {
        toast.error(`Validation Error: ${err.response?.data?.message || 'Failed to validate'}`);
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.warehouseId) return toast.error('Please select warehouse');
    if (!formData.lines[0].productId) return toast.error('Please select product to adjust');

    try {
      await axiosClient.post('/adjustments', formData);
      setIsModalOpen(false);
      setFormData({
        reason: 'Routine Cycle Count',
        warehouseId: '',
        notes: '',
        lines: [{ productId: '', systemQty: 0, countedQty: 0 }],
      });
      queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Inventory adjustment document created!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create adjustment');
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
    return <div className="p-8 text-destructive font-medium">Error loading adjustments: {(error as any).message}</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Inventory Adjustments</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Reconcile physical stock counts with digital records and record shrinkage/surplus.
          </p>
        </div>

        <button
          onClick={() => {
            if (warehouses?.[0]) {
              setFormData((prev) => ({
                ...prev,
                warehouseId: warehouses[0]._id,
                lines: [{ productId: products?.[0]?._id || '', systemQty: products?.[0]?.totalStock || 0, countedQty: products?.[0]?.totalStock || 0 }],
              }));
            }
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Adjustment</span>
        </button>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center gap-2 border-b border-border pb-3">
        {[
          { key: 'all', label: 'All Adjustments' },
          { key: 'Draft', label: 'Pending Validation' },
          { key: 'Done', label: 'Reconciled' },
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

      {/* ADJUSTMENTS TABLE */}
      <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Document</th>
                <th className="py-3.5 px-4">Warehouse</th>
                <th className="py-3.5 px-4">Audit Reason</th>
                <th className="py-3.5 px-4">Items / Discrepancy</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {adjustments?.map((adj: any) => {
                const line = adj.lines?.[0];
                const variance = line ? line.countedQty - line.systemQty : 0;
                const isSurplus = variance > 0;
                const isShortage = variance < 0;

                return (
                  <tr key={adj._id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-amber-500" />
                        <span className="font-mono font-bold text-foreground">{adj.code}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-primary" />
                        {adj.warehouseId?.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground font-medium">{adj.reason}</td>
                    <td className="py-3.5 px-4">
                      {line ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">
                            {line.productId?.name || line.productId?.sku}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold ${
                              isSurplus
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                : isShortage
                                ? 'bg-destructive/15 text-destructive'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {isSurplus ? `+${variance}` : variance} units
                          </span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground font-mono text-xs">
                      {format(new Date(adj.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          adj.status === 'Done' ? 'badge-done' : 'badge-waiting'
                        }`}
                      >
                        {adj.status === 'Done' ? 'Reconciled' : 'Draft / Count'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {adj.status === 'Draft' ? (
                        <button
                          onClick={() => handleValidate(adj._id)}
                          disabled={validateMutation.isPending}
                          className="px-3 py-1 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 shadow-xs transition-colors flex items-center gap-1.5 ml-auto"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Reconcile Stock</span>
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-500 flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Aligned
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {(!adjustments || adjustments.length === 0) && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Scale className="w-8 h-8 text-muted-foreground/50" />
                      <p className="text-sm font-semibold">No stock adjustments found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE ADJUSTMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-xs">
                  <Scale className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold">Physical Count Adjustment</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto scrollbar-thin">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Adjustment Reason</label>
                <select
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="mt-1 w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="Routine Cycle Count">Routine Cycle Count</option>
                  <option value="Damaged Inventory">Damaged Goods / Scrap</option>
                  <option value="Found Unrecorded Stock">Found Unrecorded Stock</option>
                  <option value="Discrepancy / Shrinkage">Discrepancy / Shrinkage</option>
                  <option value="Annual Physical Audit">Annual Physical Audit</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Audit Warehouse</label>
                <select
                  required
                  value={formData.warehouseId}
                  onChange={(e) => {
                    const whId = e.target.value;
                    setFormData((prev) => {
                      const prod = products?.find((p: any) => p._id === prev.lines[0].productId);
                      const currentStock = prod ? (prod.warehouseStock?.[whId] ?? prod.totalStock) : 0;
                      return {
                        ...prev,
                        warehouseId: whId,
                        lines: [{ ...prev.lines[0], systemQty: currentStock, countedQty: currentStock }],
                      };
                    });
                  }}
                  className="mt-1 w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="" disabled>Select facility</option>
                  {warehouses?.map((w: any) => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Product selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Product To Audit</label>
                <select
                  required
                  value={formData.lines[0].productId}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="mt-1 w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="" disabled>Select SKU</option>
                  {products?.map((p: any) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.sku}) — System Total: {p.totalStock} {p.uom}
                    </option>
                  ))}
                </select>
              </div>

              {/* Count inputs */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-muted/30 border border-border">
                <div>
                  <label className="text-[11px] font-bold uppercase text-muted-foreground">System Expected Qty</label>
                  <input
                    readOnly
                    value={formData.lines[0].systemQty}
                    className="mt-1 w-full h-10 rounded-lg border border-input bg-muted px-3 py-2 text-sm font-mono font-bold text-muted-foreground outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-primary">Physical Counted Qty</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={formData.lines[0].countedQty}
                    onChange={(e) => {
                      const newLines = [...formData.lines];
                      newLines[0].countedQty = parseInt(e.target.value) || 0;
                      setFormData({ ...formData, lines: newLines });
                    }}
                    className="mt-1 w-full h-10 rounded-lg border border-primary bg-background px-3 py-2 text-sm font-mono font-bold text-foreground focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div className="col-span-2 text-xs flex items-center justify-between pt-1">
                  <span className="text-muted-foreground">Calculated Variance:</span>
                  <span
                    className={`font-mono font-bold ${
                      formData.lines[0].countedQty > formData.lines[0].systemQty
                        ? 'text-emerald-500'
                        : formData.lines[0].countedQty < formData.lines[0].systemQty
                        ? 'text-destructive'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {formData.lines[0].countedQty - formData.lines[0].systemQty > 0 ? '+' : ''}
                    {formData.lines[0].countedQty - formData.lines[0].systemQty} units
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Audit Explanation</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Reason for discrepancy, shelf location inspected..."
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
                  Save Adjustment Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
