import { useState } from 'react';
import { useAdjustments, useValidateAdjustment } from '../../hooks/useAdjustments';
import { useProducts } from '../../hooks/useProducts';
import { useWarehouses } from '../../hooks/useWarehouses';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { axiosClient } from '../../api/axiosClient';
import { useQueryClient } from '@tanstack/react-query';

import { useSearchParams } from 'react-router-dom';
import { FilterBar } from '../../components/common/FilterBar';

export const AdjustmentsListPage = () => {
  const [searchParams] = useSearchParams();
  const { data: adjustments, isLoading, error } = useAdjustments(searchParams.toString());
  const { data: products } = useProducts();
  const { data: warehouses } = useWarehouses();
  const validateMutation = useValidateAdjustment();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ reason: 'Cycle Count', warehouseId: '', lines: [{ productId: '', systemQty: 0, countedQty: 0 }] });

  if (isLoading) return <div className="p-8">Loading adjustments...</div>;
  if (error) return <div className="p-8 text-destructive">Error loading adjustments: {(error as any).message}</div>;

  const handleValidate = async (id: string) => {
    if (confirm('Validate this adjustment? This will permanently align stock levels.')) {
      try {
        await validateMutation.mutateAsync(id);
        toast.success('Adjustment validated successfully!');
      } catch (err: any) {
        toast.error(`Validation Error: ${err.response?.data?.message || 'Failed to validate'}`);
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.warehouseId) return toast.error('Please select a warehouse');
    if (!formData.lines[0].productId) return toast.error('Please select a product');

    try {
      await axiosClient.post('/adjustments', {
        reason: formData.reason,
        warehouseId: formData.warehouseId,
        lines: formData.lines,
      });
      setIsModalOpen(false);
      setFormData({ reason: 'Cycle Count', warehouseId: '', lines: [{ productId: '', systemQty: 0, countedQty: 0 }] });
      queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      toast.success('Adjustment created successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create adjustment');
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Done': return 'bg-green-100 text-green-800';
      case 'Canceled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Inventory Adjustments</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors">
          New Adjustment
        </button>
      </div>

      <FilterBar 
        fields={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { label: 'Draft', value: 'Draft' },
              { label: 'Done', value: 'Done' },
              { label: 'Canceled', value: 'Canceled' }
            ]
          }
        ]}
      />

      <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-foreground">Document</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Warehouse</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Reason</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {adjustments?.map((adj: any) => (
              <tr key={adj._id} className="hover:bg-muted/20">
                <td className="px-4 py-3 font-medium">{adj.code}</td>
                <td className="px-4 py-3">{adj.warehouseId?.name}</td>
                <td className="px-4 py-3">{adj.reason}</td>
                <td className="px-4 py-3">{format(new Date(adj.createdAt), 'MMM d, yyyy')}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(adj.status)}`}>
                    {adj.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {adj.status === 'Draft' && (
                    <button 
                      onClick={() => handleValidate(adj._id)}
                      disabled={validateMutation.isPending}
                      className="text-primary hover:underline font-medium text-sm disabled:opacity-50"
                    >
                      Validate
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {adjustments?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No adjustments found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/20">
              <h2 className="text-lg font-bold">Create Adjustment</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium">Reason</label>
                <input required value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all" />
              </div>
              <div>
                <label className="text-sm font-medium">Warehouse</label>
                <select required value={formData.warehouseId} onChange={e => setFormData({...formData, warehouseId: e.target.value})} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all">
                  <option value="" disabled>Select a warehouse</option>
                  {warehouses?.map((w: any) => (
                    <option key={w._id} value={w._id}>{w.name}</option>
                  ))}
                </select>
              </div>
              <div className="border p-4 rounded-md space-y-3 bg-muted/10">
                <p className="text-sm font-bold">Line Item</p>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Product</label>
                  <select required value={formData.lines[0].productId} onChange={e => {
                    const newLines = [...formData.lines];
                    newLines[0].productId = e.target.value;
                    setFormData({...formData, lines: newLines});
                  }} className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:ring-2 focus:ring-primary outline-none transition-all">
                    <option value="" disabled>Select a product</option>
                    {products?.map((p: any) => (
                      <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-muted-foreground">System/Expected Qty</label>
                    <input required type="number" min="0" value={formData.lines[0].systemQty} onChange={e => {
                      const newLines = [...formData.lines];
                      newLines[0].systemQty = parseInt(e.target.value);
                      setFormData({...formData, lines: newLines});
                    }} className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:ring-2 focus:ring-primary outline-none transition-all" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-muted-foreground">Counted Qty</label>
                    <input required type="number" min="0" value={formData.lines[0].countedQty} onChange={e => {
                      const newLines = [...formData.lines];
                      newLines[0].countedQty = parseInt(e.target.value);
                      setFormData({...formData, lines: newLines});
                    }} className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:ring-2 focus:ring-primary outline-none transition-all" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-4 gap-2 border-t mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-md font-medium text-sm hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors">Create Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
