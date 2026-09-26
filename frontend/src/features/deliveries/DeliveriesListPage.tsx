import { useState } from 'react';
import { useDeliveries, useUpdateDeliveryStatus, useValidateDelivery } from '../../hooks/useDeliveries';
import { useProducts } from '../../hooks/useProducts';
import { useWarehouses } from '../../hooks/useWarehouses';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { axiosClient } from '../../api/axiosClient';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Truck,
  Plus,
  CheckCircle2,
  Building2,
  X,
  Trash2,
  AlertCircle,
  FileText,
  UserCheck,
} from 'lucide-react';

export const DeliveriesListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || 'all';
  const queryStr = statusFilter !== 'all' ? `status=${statusFilter}` : '';

  const { data: deliveries, isLoading, error } = useDeliveries(queryStr);
  const { data: products } = useProducts();
  const { data: warehouses } = useWarehouses();
  const statusMutation = useUpdateDeliveryStatus();
  const validateMutation = useValidateDelivery();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(searchParams.get('action') === 'new');
  const [formData, setFormData] = useState({
    customer: '',
    warehouseId: '',
    notes: '',
    lines: [{ productId: '', qty: 5, unitPrice: 25 }],
  });

  const handleUpdateStatus = async (id: string, currentStatus: string) => {
    let nextStatus: any = 'Draft';
    if (currentStatus === 'Draft') nextStatus = 'Waiting';
    else if (currentStatus === 'Waiting') nextStatus = 'Ready';

    try {
      await statusMutation.mutateAsync({ id, status: nextStatus });
      toast.success(`Delivery advanced to "${nextStatus}"`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to advance status');
    }
  };

  const handleValidate = async (id: string) => {
    if (confirm('Validate and dispatch this delivery? Stock will be permanently deducted from inventory.')) {
      try {
        await validateMutation.mutateAsync(id);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        toast.success('Delivery validated and items dispatched!');
      } catch (err: any) {
        toast.error(`Validation Error: ${err.response?.data?.message || 'Failed to dispatch'}`);
      }
    }
  };

  const addLineItem = () => {
    const defaultProd = products?.[0]?._id || '';
    setFormData((prev) => ({
      ...prev,
      lines: [...prev.lines, { productId: defaultProd, qty: 5, unitPrice: 20 }],
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
    if (!formData.warehouseId) return toast.error('Please select source warehouse');
    if (!formData.lines[0].productId) return toast.error('Please select at least one product');

    // Check stock availability
    for (const line of formData.lines) {
      const prod = products?.find((p: any) => p._id === line.productId);
      if (prod) {
        const available = prod.warehouseStock?.[formData.warehouseId] ?? prod.totalStock;
        if (available < line.qty) {
          return toast.error(
            `Insufficient stock for "${prod.name}". Available: ${available}, Requested: ${line.qty}`
          );
        }
      }
    }

    try {
      await axiosClient.post('/deliveries', formData);
      setIsModalOpen(false);
      setFormData({
        customer: '',
        warehouseId: '',
        notes: '',
        lines: [{ productId: '', qty: 5, unitPrice: 25 }],
      });
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Outbound delivery order created!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create delivery');
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
    return <div className="p-8 text-destructive font-medium">Error loading deliveries: {(error as any).message}</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Delivery Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage customer outbound shipments, pick & pack verification, and automated dispatch.
          </p>
        </div>

        <button
          onClick={() => {
            if (warehouses?.[0]) {
              setFormData((prev) => ({
                ...prev,
                warehouseId: warehouses[0]._id,
                lines: [{ productId: products?.[0]?._id || '', qty: 5, unitPrice: 20 }],
              }));
            }
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Delivery Order</span>
        </button>
      </div>

      {/* PIPELINE STATUS TABS */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto scrollbar-thin">
        {[
          { key: 'all', label: 'All Orders' },
          { key: 'Draft', label: 'Draft' },
          { key: 'Waiting', label: 'Picking / Packing' },
          { key: 'Ready', label: 'Ready to Dispatch' },
          { key: 'Done', label: 'Fulfilled / Shipped' },
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

      {/* DELIVERIES TABLE */}
      <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Document</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Fulfillment Hub</th>
                <th className="py-3.5 px-4">Ordered Items</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {deliveries?.map((delivery: any) => {
                const totalUnits = delivery.lines?.reduce((s: number, l: any) => s + (l.qty || 0), 0) || 0;

                return (
                  <tr key={delivery._id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span className="font-mono font-bold text-foreground">{delivery.code}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-foreground flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-muted-foreground" />
                      <span>{delivery.customer}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-medium text-muted-foreground">
                        <Building2 className="w-3.5 h-3.5 text-primary" />
                        {delivery.warehouseId?.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs">
                        <span className="font-bold text-foreground">{totalUnits} units</span>
                        <span className="text-muted-foreground ml-1.5">({delivery.lines?.length || 0} SKUs)</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground font-mono text-xs">
                      {format(new Date(delivery.createdAt), 'MMM d, yyyy')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(delivery.status)}`}>
                        {delivery.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {delivery.status === 'Draft' && (
                        <button
                          onClick={() => handleUpdateStatus(delivery._id, 'Draft')}
                          className="px-3 py-1 rounded-lg bg-accent hover:bg-accent/80 text-foreground font-semibold text-xs transition-colors"
                        >
                          Pick Items
                        </button>
                      )}
                      {delivery.status === 'Waiting' && (
                        <button
                          onClick={() => handleUpdateStatus(delivery._id, 'Waiting')}
                          className="px-3 py-1 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold text-xs hover:bg-blue-500/25 transition-colors"
                        >
                          Pack & Ready
                        </button>
                      )}
                      {delivery.status === 'Ready' && (
                        <button
                          onClick={() => handleValidate(delivery._id)}
                          disabled={validateMutation.isPending}
                          className="px-3 py-1 rounded-lg bg-emerald-500 text-white font-semibold text-xs hover:bg-emerald-600 shadow-xs transition-colors flex items-center gap-1.5 ml-auto"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Dispatch Order</span>
                        </button>
                      )}
                      {delivery.status === 'Done' && (
                        <span className="text-xs font-semibold text-emerald-500 flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Fulfilled
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {(!deliveries || deliveries.length === 0) && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Truck className="w-8 h-8 text-muted-foreground/50" />
                      <p className="text-sm font-semibold">No delivery orders found for this filter.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE DELIVERY ORDER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs">
                  <Truck className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold">Create Outbound Delivery Order</h2>
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
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Customer / Account</label>
                  <input
                    required
                    value={formData.customer}
                    onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                    placeholder="e.g. Tesla Robotics Division"
                    className="mt-1 w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Source Fulfillment Hub</label>
                  <select
                    required
                    value={formData.warehouseId}
                    onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                    className="mt-1 w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  >
                    <option value="" disabled>Select source warehouse</option>
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
                    Order Items ({formData.lines.length})
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
                  {formData.lines.map((line, idx) => {
                    const selProd = products?.find((p: any) => p._id === line.productId);
                    const available = selProd
                      ? (formData.warehouseId ? selProd.warehouseStock?.[formData.warehouseId] : selProd.totalStock) || 0
                      : null;
                    const isShortage = available !== null && line.qty > available;

                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border flex flex-col gap-2 ${
                          isShortage ? 'bg-destructive/10 border-destructive/30' : 'bg-muted/30 border-border'
                        }`}
                      >
                        <div className="flex items-center gap-3">
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
                              <option value="" disabled>Select SKU to ship</option>
                              {products?.map((p: any) => (
                                <option key={p._id} value={p._id}>
                                  {p.name} ({p.sku}) — Total: {p.totalStock} {p.uom}
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
                              value={line.qty}
                              onChange={(e) => {
                                const newLines = [...formData.lines];
                                newLines[idx].qty = parseInt(e.target.value) || 1;
                                setFormData({ ...formData, lines: newLines });
                              }}
                              className="w-full h-9 rounded-lg border border-input bg-background px-3 text-xs font-mono focus:ring-2 focus:ring-primary outline-none"
                            />
                          </div>

                          <div className="w-24">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Price ($)"
                              value={line.unitPrice}
                              onChange={(e) => {
                                const newLines = [...formData.lines];
                                newLines[idx].unitPrice = parseFloat(e.target.value) || 0;
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

                        {/* Availability Feedback */}
                        {available !== null && (
                          <div className="flex items-center justify-between text-[11px] px-1">
                            <span className="text-muted-foreground">
                              Available at selected hub: <strong className="text-foreground">{available}</strong> units
                            </span>
                            {isShortage && (
                              <span className="text-destructive font-bold flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Exceeds available stock by {line.qty - available}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dispatch Instructions</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Shipping address, carrier service level, package handling..."
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
                  Create Delivery Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
