import { useState } from 'react';
import { useReceipts, useUpdateReceiptStatus, useValidateReceipt } from '../../hooks/useReceipts';
import { useProducts } from '../../hooks/useProducts';
import { useWarehouses } from '../../hooks/useWarehouses';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { axiosClient } from '../../api/axiosClient';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  PackagePlus,
  Plus,
  CheckCircle2,
  Building2,
  X,
  Trash2,
  FileText,
} from 'lucide-react';

export const ReceiptsListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || 'all';
  const queryStr = statusFilter !== 'all' ? `status=${statusFilter}` : '';

  const { data: receipts, isLoading, error } = useReceipts(queryStr);
  const { data: products } = useProducts();
  const { data: warehouses } = useWarehouses();
  const validateMutation = useValidateReceipt();
  const statusMutation = useUpdateReceiptStatus();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(searchParams.get('action') === 'new');
  const [formData, setFormData] = useState({
    supplier: '',
    warehouseId: '',
    notes: '',
    lines: [{ productId: '', expectedQty: 10, unitCost: 15 }],
  });

  const handleUpdateStatus = async (id: string, currentStatus: string) => {
    let nextStatus: any = 'Draft';
    if (currentStatus === 'Draft') nextStatus = 'Waiting';
    else if (currentStatus === 'Waiting') nextStatus = 'Ready';

    try {
      await statusMutation.mutateAsync({ id, status: nextStatus });
      toast.success(`Shipment advanced to "${nextStatus}"`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to advance status');
    }
  };

  const handleValidate = async (id: string) => {
    if (confirm('Validate this inbound shipment? All items will be permanently credited to inventory.')) {
      try {
        await validateMutation.mutateAsync(id);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        toast.success('Inbound stock validated & credited to warehouse inventory!');
      } catch (err: any) {
        toast.error(`Validation Error: ${err.response?.data?.message || 'Failed to validate'}`);
      }
    }
  };

  const addLineItem = () => {
    const defaultProd = products?.[0]?._id || '';
    setFormData((prev) => ({
      ...prev,
      lines: [...prev.lines, { productId: defaultProd, expectedQty: 10, unitCost: 10 }],
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
    if (!formData.warehouseId) return toast.error('Please select destination warehouse');
    if (!formData.lines[0].productId) return toast.error('Please select at least one product');

    try {
      await axiosClient.post('/receipts', formData);
      setIsModalOpen(false);
      setFormData({
        supplier: '',
        warehouseId: '',
        notes: '',
        lines: [{ productId: '', expectedQty: 10, unitCost: 15 }],
      });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Inbound receipt document created!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create receipt');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'badge-draft';
      case 'Waiting':
        return 'badge-waiting';
      case 'Ready':
        return 'badge-ready';
      case 'Done':
        return 'badge-done';
      default:
        return 'badge-draft';
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
    return <div className="p-8 text-destructive font-medium">Error loading receipts: {(error as any).message}</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Inbound Receipts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Process supplier deliveries, dock inspection, and automated stock intake.
          </p>
        </div>

        <button
          onClick={() => {
            if (warehouses?.[0]) {
              setFormData((prev) => ({
                ...prev,
                warehouseId: warehouses[0]._id,
                lines: [{ productId: products?.[0]?._id || '', expectedQty: 25, unitCost: 12 }],
              }));
            }
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Inbound Receipt</span>
        </button>
      </div>

      {/* PIPELINE STATUS TABS */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto scrollbar-thin">
        {[
          { key: 'all', label: 'All Receipts' },
          { key: 'Draft', label: 'Draft' },
          { key: 'Waiting', label: 'In-Transit / Waiting' },
          { key: 'Ready', label: 'Ready for Intake' },
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
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              statusFilter === tab.key
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* RECEIPTS TABLE */}
      <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Document</th>
                <th className="py-3.5 px-4">Vendor / Supplier</th>
                <th className="py-3.5 px-4">Destination Hub</th>
                <th className="py-3.5 px-4">Line Items</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4">Workflow Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {receipts?.map((receipt: any) => {
                const totalUnits = receipt.lines?.reduce((s: number, l: any) => s + (l.expectedQty || 0), 0) || 0;

                return (
                  <tr key={receipt._id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="font-mono font-bold text-foreground">{receipt.code}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-foreground">{receipt.supplier}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-medium text-muted-foreground">
                        <Building2 className="w-3.5 h-3.5 text-primary" />
                        {receipt.warehouseId?.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs">
                        <span className="font-bold text-foreground">{totalUnits} units</span>
                        <span className="text-muted-foreground ml-1.5">({receipt.lines?.length || 0} SKUs)</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground font-mono text-xs">
                      {format(new Date(receipt.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(receipt.status)}`}>
                        {receipt.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {receipt.status === 'Draft' && (
                        <button
                          onClick={() => handleUpdateStatus(receipt._id, 'Draft')}
                          className="px-3 py-1 rounded-lg bg-accent hover:bg-accent/80 text-foreground font-semibold text-xs transition-colors"
                        >
                          Mark In-Transit
                        </button>
                      )}
                      {receipt.status === 'Waiting' && (
                        <button
                          onClick={() => handleUpdateStatus(receipt._id, 'Waiting')}
                          className="px-3 py-1 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold text-xs hover:bg-blue-500/25 transition-colors"
                        >
                          Dock Intake
                        </button>
                      )}
                      {receipt.status === 'Ready' && (
                        <button
                          onClick={() => handleValidate(receipt._id)}
                          disabled={validateMutation.isPending}
                          className="px-3 py-1 rounded-lg bg-emerald-500 text-white font-semibold text-xs hover:bg-emerald-600 shadow-xs transition-colors flex items-center gap-1.5 ml-auto"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Validate Stock</span>
                        </button>
                      )}
                      {receipt.status === 'Done' && (
                        <span className="text-xs font-semibold text-emerald-500 flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Credited
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {(!receipts || receipts.length === 0) && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <PackagePlus className="w-8 h-8 text-muted-foreground/50" />
                      <p className="text-sm font-semibold">No receipts found for this filter.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE RECEIPT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs">
                  <PackagePlus className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold">Create Inbound Stock Receipt</h2>
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
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Supplier Name</label>
                  <input
                    required
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="e.g. Apex Microelectronics Ltd"
                    className="mt-1 w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Destination Facility</label>
                  <select
                    required
                    value={formData.warehouseId}
                    onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                    className="mt-1 w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="" disabled>Select destination</option>
                    {warehouses?.map((w: any) => (
                      <option key={w._id} value={w._id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Line Items */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Shipment Line Items ({formData.lines.length})
                  </label>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Product Row
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
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-24">
                        <input
                          required
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={line.expectedQty}
                          onChange={(e) => {
                            const newLines = [...formData.lines];
                            newLines[idx].expectedQty = parseInt(e.target.value) || 1;
                            setFormData({ ...formData, lines: newLines });
                          }}
                          className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs font-mono focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>

                      <div className="w-24">
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Cost ($)"
                          value={line.unitCost}
                          onChange={(e) => {
                            const newLines = [...formData.lines];
                            newLines[idx].unitCost = parseFloat(e.target.value) || 0;
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

              {/* Notes */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notes & PO Number</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Carrier tracking, bill of lading, inspection instructions..."
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
                  Create Receipt Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
