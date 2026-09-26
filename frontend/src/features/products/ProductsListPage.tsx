import { useState } from 'react';
import { useProducts } from '../../hooks/useProducts';
import { axiosClient } from '../../api/axiosClient';
import { useQueryClient } from '@tanstack/react-query';

import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FilterBar } from '../../components/common/FilterBar';

export const ProductsListPage = () => {
  const [searchParams] = useSearchParams();
  const { data: products, isLoading, error } = useProducts(searchParams.toString());
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', sku: '', uom: 'pcs' });

  if (isLoading) return <div className="p-8">Loading products...</div>;
  if (error) return <div className="p-8 text-destructive">Error loading products: {(error as any).message}</div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosClient.post('/products', formData);
      setIsModalOpen(false);
      setFormData({ name: '', sku: '', uom: 'pcs' });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create product');
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Products</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors"
        >
          New Product
        </button>
      </div>

      <FilterBar 
        fields={[
          {
            key: 'filter',
            label: 'Stock Status',
            options: [
              { label: 'Low Stock', value: 'low-stock' },
              { label: 'Out of Stock', value: 'out-of-stock' }
            ]
          }
        ]}
      />

      <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-foreground">SKU</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Category</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">UoM</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products?.map((product: any) => (
              <tr key={product._id} className="hover:bg-muted/20">
                <td className="px-4 py-3 font-medium">{product.sku}</td>
                <td className="px-4 py-3">{product.name}</td>
                <td className="px-4 py-3">{product.categoryId?.name}</td>
                <td className="px-4 py-3">{product.uom}</td>
              </tr>
            ))}
            {products?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/20">
              <h2 className="text-lg font-bold">Create New Product</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium">SKU</label>
                <input required value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all" />
              </div>
              <div>
                <label className="text-sm font-medium">Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all" />
              </div>
              <div>
                <label className="text-sm font-medium">Unit of Measure</label>
                <input required value={formData.uom} onChange={e => setFormData({...formData, uom: e.target.value})} className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all" />
              </div>
              <div className="flex justify-end pt-4 gap-2 border-t mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-md font-medium text-sm hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-primary/90 transition-colors">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
