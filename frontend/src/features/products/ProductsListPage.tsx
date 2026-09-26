import { useState, useMemo } from 'react';
import { useProducts, useCategories } from '../../hooks/useProducts';
import { useWarehouses } from '../../hooks/useWarehouses';
import { axiosClient } from '../../api/axiosClient';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Package,
  Plus,
  Search,
  Filter,
  Download,
  X,
  Edit2,
  Trash2,
  Boxes,
  Sparkles,
  Info,
} from 'lucide-react';

export const ProductsListPage = () => {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { data: products, isLoading, error } = useProducts();
  const { data: categories } = useCategories();
  const { data: warehouses } = useWarehouses();

  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<string>(searchParams.get('filter') || 'all');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(searchParams.get('action') === 'new');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [viewingProduct, setViewingProduct] = useState<any>(null);

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    categoryId: '',
    uom: 'pcs',
    costPrice: 10,
    sellingPrice: 20,
    minStock: 15,
    totalStock: 0,
  });

  // Filtered Products computation
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p: any) => {
      // Search
      const matchSearch =
        !searchTerm.trim() ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.categoryId?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      // Category
      const matchCategory =
        selectedCategory === 'all' || p.categoryId?._id === selectedCategory;

      // Stock Filter
      let matchStock = true;
      if (stockFilter === 'low-stock') {
        matchStock = p.totalStock > 0 && p.totalStock <= p.minStock;
      } else if (stockFilter === 'out-of-stock') {
        matchStock = p.totalStock === 0;
      } else if (stockFilter === 'in-stock') {
        matchStock = p.totalStock > p.minStock;
      }

      return matchSearch && matchCategory && matchStock;
    });
  }, [products, searchTerm, selectedCategory, stockFilter]);

  // SKU Generator
  const generateSku = () => {
    const prefix = 'SKU';
    const rand = Math.floor(1000 + Math.random() * 9000);
    setFormData((prev) => ({ ...prev, sku: `${prefix}-${rand}` }));
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      description: '',
      categoryId: categories?.[0]?._id || '',
      uom: 'pcs',
      costPrice: 10,
      sellingPrice: 20,
      minStock: 15,
      totalStock: 0,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (prod: any) => {
    setEditingProduct(prod);
    setFormData({
      sku: prod.sku,
      name: prod.name,
      description: prod.description || '',
      categoryId: prod.categoryId?._id || '',
      uom: prod.uom || 'pcs',
      costPrice: prod.costPrice || 10,
      sellingPrice: prod.sellingPrice || 20,
      minStock: prod.minStock || 15,
      totalStock: prod.totalStock || 0,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await axiosClient.put(`/products/${editingProduct._id}`, formData);
        toast.success('Product updated successfully');
      } else {
        await axiosClient.post('/products', formData);
        toast.success('New product cataloged successfully');
      }
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await axiosClient.delete(`/products/${id}`);
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });
        toast.success('Product deleted');
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to delete');
      }
    }
  };

  const exportToCSV = () => {
    if (!filteredProducts || filteredProducts.length === 0) {
      toast.error('No products to export');
      return;
    }
    const headers = ['SKU', 'Name', 'Category', 'Stock', 'UoM', 'Cost Price', 'Selling Price', 'Total Valuation'];
    const rows = filteredProducts.map((p: any) => [
      p.sku,
      `"${p.name.replace(/"/g, '""')}"`,
      p.categoryId?.name || '',
      p.totalStock,
      p.uom,
      p.costPrice,
      p.sellingPrice,
      (p.totalStock * p.costPrice).toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `StockSense_Inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Inventory exported to CSV');
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
    return <div className="p-8 text-destructive font-medium">Error loading products: {(error as any).message}</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Products & Stock</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your SKU catalog, live warehouse levels, and reorder triggers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-accent text-xs font-semibold text-foreground transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Product</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by SKU, product name, or category..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-input bg-muted/30 text-xs sm:text-sm focus:bg-background focus:ring-2 focus:ring-primary outline-none transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted/40 border border-border text-xs font-medium text-foreground">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent outline-none cursor-pointer pr-1"
            >
              <option value="all">All Categories</option>
              {categories?.map((c: any) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Level Selector */}
          <div className="flex items-center rounded-xl bg-muted/40 border border-border p-1 text-xs">
            <button
              onClick={() => setStockFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                stockFilter === 'all' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({products?.length || 0})
            </button>
            <button
              onClick={() => setStockFilter('low-stock')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                stockFilter === 'low-stock'
                  ? 'bg-amber-500 text-white shadow-xs font-bold'
                  : 'text-amber-600 dark:text-amber-400 hover:text-foreground'
              }`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setStockFilter('out-of-stock')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                stockFilter === 'out-of-stock'
                  ? 'bg-destructive text-destructive-foreground shadow-xs font-bold'
                  : 'text-destructive hover:text-foreground'
              }`}
            >
              Out of Stock
            </button>
          </div>
        </div>
      </div>

      {/* PRODUCTS TABLE */}
      <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Product Info</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Stock Level</th>
                <th className="py-3.5 px-4 text-right">Cost</th>
                <th className="py-3.5 px-4 text-right">Price</th>
                <th className="py-3.5 px-4 text-right">Inventory Value</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.map((product: any) => {
                const isOutOfStock = product.totalStock === 0;
                const isLowStock = !isOutOfStock && product.totalStock <= product.minStock;
                const valuation = product.totalStock * product.costPrice;

                return (
                  <tr key={product._id} className="hover:bg-muted/20 transition-colors group">
                    {/* Name & SKU */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
                          <Package className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground truncate max-w-xs">{product.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="font-mono text-[11px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded font-medium">
                              {product.sku}
                            </span>
                            {product.barcode && (
                              <span className="text-[10px] text-muted-foreground hidden sm:inline">
                                #{product.barcode}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: `${product.categoryId?.color || '#6366f1'}15`,
                          color: product.categoryId?.color || '#6366f1',
                          border: `1px solid ${product.categoryId?.color || '#6366f1'}30`,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: product.categoryId?.color || '#6366f1' }}
                        />
                        {product.categoryId?.name || 'General'}
                      </span>
                    </td>

                    {/* Stock Level with Progress Bar */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1 max-w-[140px]">
                        <div className="flex items-center justify-between text-xs">
                          <span
                            className={`font-bold font-mono ${
                              isOutOfStock
                                ? 'text-destructive'
                                : isLowStock
                                ? 'text-amber-500'
                                : 'text-emerald-500'
                            }`}
                          >
                            {product.totalStock} {product.uom}
                          </span>
                          <span className="text-[11px] text-muted-foreground">Min {product.minStock}</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isOutOfStock
                                ? 'bg-destructive'
                                : isLowStock
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{
                              width: `${Math.min(100, (product.totalStock / (product.minStock * 2 || 1)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Unit Cost */}
                    <td className="py-3.5 px-4 text-right font-mono text-muted-foreground">
                      ${product.costPrice?.toFixed(2)}
                    </td>

                    {/* Selling Price */}
                    <td className="py-3.5 px-4 text-right font-mono font-medium text-foreground">
                      ${product.sellingPrice?.toFixed(2)}
                    </td>

                    {/* Valuation */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-foreground">
                      ${valuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => setViewingProduct(product)}
                        title="View Facility Stock"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(product)}
                        title="Edit Product"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product._id, product.name)}
                        title="Delete Product"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Boxes className="w-8 h-8 text-muted-foreground/50" />
                      <p className="text-sm font-semibold">No products matched the filter.</p>
                      <p className="text-xs text-muted-foreground">Try clearing your search query or reset filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                  <Package className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold">
                  {editingProduct ? 'Edit Catalog Product' : 'Catalog New Product'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto scrollbar-thin">
              {/* SKU & Generator */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">SKU Code</label>
                  <button
                    type="button"
                    onClick={generateSku}
                    className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Auto Generate
                  </button>
                </div>
                <input
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="e.g. EL-MCU-001"
                  className="mt-1 w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Product Title</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Precision Sensor Module"
                  className="mt-1 w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Specifications, dimensions, or manufacturer part notes..."
                  className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                />
              </div>

              {/* Category & UoM */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="mt-1 w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  >
                    <option value="" disabled>Select category</option>
                    {categories?.map((c: any) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Unit of Measure</label>
                  <select
                    value={formData.uom}
                    onChange={(e) => setFormData({ ...formData, uom: e.target.value })}
                    className="mt-1 w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="box">Box (box)</option>
                    <option value="m">Meters (m)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="pack">Pack (pack)</option>
                  </select>
                </div>
              </div>

              {/* Cost & Selling Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Unit Cost ($)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Selling Price ($)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="mt-1 w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
              </div>

              {/* Min Stock & Initial Qty */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reorder Point (Min)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })}
                    className="mt-1 w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
                {!editingProduct && (
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Initial Stock Qty</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.totalStock}
                      onChange={(e) => setFormData({ ...formData, totalStock: parseInt(e.target.value) || 0 })}
                      className="mt-1 w-full h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-primary outline-none transition-all"
                    />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-2 pt-4 border-t border-border mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRODUCT DETAILS DRAWER / MODAL */}
      {viewingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
              <div>
                <h3 className="text-base font-bold text-foreground">{viewingProduct.name}</h3>
                <span className="font-mono text-xs text-primary font-semibold">{viewingProduct.sku}</span>
              </div>
              <button
                onClick={() => setViewingProduct(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="p-4 rounded-xl bg-muted/30 border border-border flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground font-semibold">Total Stock</div>
                  <div className="text-2xl font-black font-mono mt-0.5 text-foreground">
                    {viewingProduct.totalStock} {viewingProduct.uom}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground font-semibold">Asset Valuation</div>
                  <div className="text-xl font-bold font-mono text-emerald-500 mt-0.5">
                    ${(viewingProduct.totalStock * viewingProduct.costPrice).toFixed(2)}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5">
                  Stock Level by Facility
                </h4>
                <div className="space-y-2">
                  {warehouses?.map((wh: any) => {
                    const held = viewingProduct.warehouseStock?.[wh._id] || 0;
                    return (
                      <div
                        key={wh._id}
                        className="flex items-center justify-between p-3 rounded-xl bg-card border border-border"
                      >
                        <div>
                          <div className="text-xs font-bold text-foreground">{wh.name}</div>
                          <div className="text-[11px] font-mono text-muted-foreground">{wh.code}</div>
                        </div>
                        <div className="text-right font-mono text-xs font-bold">
                          {held} {viewingProduct.uom}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-border">
                <button
                  onClick={() => setViewingProduct(null)}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
