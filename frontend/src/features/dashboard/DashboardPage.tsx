import { useDashboard } from '../../hooks/useDashboard';
import { useProducts } from '../../hooks/useProducts';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useCategories } from '../../hooks/useProducts';
import { useWarehouses } from '../../hooks/useWarehouses';
import { useState } from 'react';
import {
  Package,
  TrendingUp,
  AlertTriangle,
  PackagePlus,
  Truck,
  ArrowLeftRight,
  ClipboardCheck,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Layers,
  Building2,
  Filter,
  RotateCcw,
} from 'lucide-react';

export const DashboardPage = () => {
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDocType, setSelectedDocType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const { data: categories } = useCategories();
  const { data: warehouses } = useWarehouses();

  const queryParams = new URLSearchParams();
  if (selectedWarehouse !== 'all') queryParams.set('warehouseId', selectedWarehouse);
  if (selectedCategory !== 'all') queryParams.set('categoryId', selectedCategory);
  if (selectedDocType !== 'all') queryParams.set('documentType', selectedDocType);
  if (selectedStatus !== 'all') queryParams.set('status', selectedStatus);

  const { data, isLoading, error } = useDashboard(queryParams.toString());
  const { data: allProducts } = useProducts();
  const navigate = useNavigate();

  const isFiltered =
    selectedWarehouse !== 'all' ||
    selectedCategory !== 'all' ||
    selectedDocType !== 'all' ||
    selectedStatus !== 'all';

  const resetFilters = () => {
    setSelectedWarehouse('all');
    setSelectedCategory('all');
    setSelectedDocType('all');
    setSelectedStatus('all');
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 space-y-6">
        <div className="h-8 w-48 skeleton" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 skeleton rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 skeleton rounded-2xl" />
          <div className="h-80 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="p-6 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive">
          <h2 className="font-bold text-lg mb-1">Failed to load dashboard metrics</h2>
          <p className="text-sm">{(error as any).message || 'Unknown error occurred'}</p>
        </div>
      </div>
    );
  }

  const { kpis, recentActivity, trendData, categoryDistribution, warehouseBreakdown } = data || {};
  const lowStockProducts = (allProducts || []).filter((p: any) => p.totalStock <= p.minStock);

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* EXECUTIVE HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Operations Dashboard</h1>
            <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time multi-warehouse inventory status, supply movements, and audit log.
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => navigate('/app/operations/receipts?action=new')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-card border border-border hover:bg-accent text-foreground transition-all shadow-xs"
          >
            <PackagePlus className="w-3.5 h-3.5 text-emerald-500" />
            <span>Receive Stock</span>
          </button>
          <button
            onClick={() => navigate('/app/operations/deliveries?action=new')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-card border border-border hover:bg-accent text-foreground transition-all shadow-xs"
          >
            <Truck className="w-3.5 h-3.5 text-blue-500" />
            <span>Dispatch Order</span>
          </button>
          <button
            onClick={() => navigate('/app/operations/transfers?action=new')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-card border border-border hover:bg-accent text-foreground transition-all shadow-xs"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-purple-500" />
            <span>Internal Transfer</span>
          </button>
          <button
            onClick={() => navigate('/app/operations/adjustments?action=new')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-card border border-border hover:bg-accent text-foreground transition-all shadow-xs"
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>Stock Audit</span>
          </button>
        </div>
      </div>

      {/* DYNAMIC DASHBOARD FILTERS */}
      <div className="p-3.5 rounded-2xl bg-card border border-border shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wider mr-1">
          <Filter className="w-3.5 h-3.5 text-primary" />
          <span>Filters:</span>
        </div>

        {/* Document Type */}
        <div className="flex items-center gap-1.5 bg-background/80 border border-border/80 rounded-xl px-2.5 py-1.5 text-xs">
          <span className="text-muted-foreground font-medium">Doc Type:</span>
          <select
            value={selectedDocType}
            onChange={(e) => setSelectedDocType(e.target.value)}
            className="bg-transparent font-semibold text-foreground focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-popover text-popover-foreground">All Types</option>
            <option value="Receipt" className="bg-popover text-popover-foreground">Receipts</option>
            <option value="Delivery" className="bg-popover text-popover-foreground">Deliveries</option>
            <option value="Transfer" className="bg-popover text-popover-foreground">Transfers</option>
            <option value="Adjustment" className="bg-popover text-popover-foreground">Adjustments</option>
          </select>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5 bg-background/80 border border-border/80 rounded-xl px-2.5 py-1.5 text-xs">
          <span className="text-muted-foreground font-medium">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-transparent font-semibold text-foreground focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-popover text-popover-foreground">All Statuses</option>
            <option value="Draft" className="bg-popover text-popover-foreground">Draft</option>
            <option value="Waiting" className="bg-popover text-popover-foreground">Waiting</option>
            <option value="Ready" className="bg-popover text-popover-foreground">Ready</option>
            <option value="Done" className="bg-popover text-popover-foreground">Done</option>
            <option value="Canceled" className="bg-popover text-popover-foreground">Canceled</option>
          </select>
        </div>

        {/* Location / Warehouse */}
        <div className="flex items-center gap-1.5 bg-background/80 border border-border/80 rounded-xl px-2.5 py-1.5 text-xs">
          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground font-medium">Facility:</span>
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="bg-transparent font-semibold text-foreground focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-popover text-popover-foreground">All Facilities</option>
            {warehouses?.map((wh: any) => (
              <option key={wh._id} value={wh._id} className="bg-popover text-popover-foreground">
                {wh.name} ({wh.code})
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div className="flex items-center gap-1.5 bg-background/80 border border-border/80 rounded-xl px-2.5 py-1.5 text-xs">
          <Layers className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-muted-foreground font-medium">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-transparent font-semibold text-foreground focus:outline-none cursor-pointer"
          >
            <option value="all" className="bg-popover text-popover-foreground">All Categories</option>
            {categories?.map((cat: any) => (
              <option key={cat._id} value={cat._id} className="bg-popover text-popover-foreground">
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Filter Button */}
        {isFiltered && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-muted hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-all ml-auto cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* KPI METRIC CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Valuation */}
        <div className="p-5 bg-card border border-border rounded-2xl shadow-xs hover:border-primary/50 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none" />
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Inventory Value</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black tracking-tight text-foreground">
            ${(kpis?.totalInventoryValue || 0).toLocaleString()}
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-500 mt-2">
            <TrendingUp className="w-3 h-3" />
            <span>+8.4% this month</span>
          </div>
        </div>

        {/* Total Products */}
        <Link
          to="/app/products"
          className="p-5 bg-card border border-border rounded-2xl shadow-xs hover:border-primary/50 transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total SKUs</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black tracking-tight text-foreground">{kpis?.totalProducts || 0}</div>
          <div className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1 font-medium">
            <span>Across 5 categories</span>
            <ArrowUpRight className="w-3 h-3 ml-auto text-muted-foreground group-hover:text-primary" />
          </div>
        </Link>

        {/* Low Stock Alerts */}
        <Link
          to="/app/products?filter=low-stock"
          className={`p-5 bg-card border rounded-2xl shadow-xs transition-all group relative overflow-hidden ${
            (kpis?.lowStockItems || 0) > 0
              ? 'border-amber-500/30 hover:border-amber-500 bg-amber-500/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Low Stock</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black tracking-tight text-amber-600 dark:text-amber-400">
            {kpis?.lowStockItems || 0}
          </div>
          <div className="text-[11px] font-medium text-amber-600/80 dark:text-amber-400/80 mt-2 flex items-center justify-between">
            <span>Below reorder point</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </Link>

        {/* Pending Receipts */}
        <Link
          to="/app/operations/receipts"
          className="p-5 bg-card border border-border rounded-2xl shadow-xs hover:border-emerald-500/50 transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Inbound Queue</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
              <PackagePlus className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
            {kpis?.pendingReceipts || 0}
          </div>
          <div className="text-[11px] text-muted-foreground mt-2 flex items-center justify-between font-medium">
            <span>Awaiting validation</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </Link>

        {/* Pending Deliveries */}
        <Link
          to="/app/operations/deliveries"
          className="p-5 bg-card border border-border rounded-2xl shadow-xs hover:border-blue-500/50 transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Outbound Queue</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black tracking-tight text-blue-600 dark:text-blue-400">
            {kpis?.pendingDeliveries || 0}
          </div>
          <div className="text-[11px] text-muted-foreground mt-2 flex items-center justify-between font-medium">
            <span>Ready for dispatch</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </Link>

        {/* Pending Transfers */}
        <Link
          to="/app/operations/transfers"
          className="p-5 bg-card border border-border rounded-2xl shadow-xs hover:border-purple-500/50 transition-all group relative overflow-hidden"
        >
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Transfers</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black tracking-tight text-purple-600 dark:text-purple-400">
            {kpis?.pendingTransfers || 0}
          </div>
          <div className="text-[11px] text-muted-foreground mt-2 flex items-center justify-between font-medium">
            <span>Inter-hub transit</span>
            <ArrowUpRight className="w-3 h-3" />
          </div>
        </Link>
      </div>

      {/* CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 30-Day Movement Trend */}
        <div className="lg:col-span-2 p-6 bg-card border border-border rounded-2xl shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Stock Movement Trends (Last 30 Days)</span>
                <Sparkles className="w-4 h-4 text-primary" />
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Comparison of daily inbound vs outbound volume flow
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Inbound Units</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <span className="text-muted-foreground">Outbound Units</span>
              </div>
            </div>
          </div>

          <div className="h-[280px] w-full">
            {trendData && trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="inboundGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="outboundGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    interval={4}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderRadius: '12px',
                      border: '1px solid hsl(var(--border))',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
                      fontSize: '12px',
                      fontWeight: 500,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Inbound"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#inboundGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Outbound"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#outboundGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No movement history recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="p-6 bg-card border border-border rounded-2xl shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold">Category Valuation</h2>
              <p className="text-xs text-muted-foreground">Inventory distributed by segment</p>
            </div>
            <Layers className="w-4 h-4 text-muted-foreground" />
          </div>

          <div className="space-y-4 flex-1 justify-center flex flex-col">
            {categoryDistribution?.map((cat: any) => {
              const totalVal = kpis?.totalInventoryValue || 1;
              const pct = Math.round((cat.value / totalVal) * 100);
              return (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground truncate max-w-[170px]">{cat.name}</span>
                    <span className="font-mono text-muted-foreground font-medium">
                      ${cat.value.toLocaleString()} ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(5, pct)}%`,
                        backgroundColor: cat.color || '#6366f1',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* LOWER GRID: CRITICAL LOW STOCK & RECENT AUDIT LEDGER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Attention / Low Stock */}
        <div className="p-6 bg-card border border-border rounded-2xl shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                <span>Critical Stock Alerts</span>
                {lowStockProducts.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500 border border-amber-500/20">
                    {lowStockProducts.length} items
                  </span>
                )}
              </h2>
              <p className="text-xs text-muted-foreground">Items requiring immediate vendor replenishment</p>
            </div>
            <Link
              to="/app/products?filter=low-stock"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>Manage all</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-border overflow-hidden">
            {lowStockProducts.slice(0, 4).map((prod: any) => (
              <div key={prod._id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate text-foreground">{prod.name}</div>
                  <div className="text-xs font-mono text-muted-foreground mt-0.5">
                    {prod.sku} • {prod.categoryId?.name}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400">
                    {prod.totalStock} / {prod.minStock} {prod.uom}
                  </div>
                  <button
                    onClick={() => navigate(`/app/operations/receipts?action=new&sku=${encodeURIComponent(prod.sku)}`)}
                    className="text-[11px] font-semibold text-primary hover:underline mt-0.5 block"
                  >
                    + Create Receipt
                  </button>
                </div>
              </div>
            ))}
            {lowStockProducts.length === 0 && (
              <div className="py-8 text-center text-xs text-muted-foreground">
                All inventory items are currently above their reorder thresholds.
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="p-6 bg-card border border-border rounded-2xl shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold">Live Inventory Ledger</h2>
              <p className="text-xs text-muted-foreground">Recent atomic stock movements & verifications</p>
            </div>
            <Link
              to="/app/operations/history"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>Full audit log</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-border overflow-hidden">
            {recentActivity?.map((act: any) => {
              const isPositive = act.qty > 0;
              return (
                <div key={act._id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isPositive
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : 'bg-indigo-500/10 text-indigo-500'
                      }`}
                    >
                      {isPositive ? (
                        <ArrowDownRight className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate text-foreground">
                        {act.documentCode} • {act.productId?.name || act.productId?.sku}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {format(new Date(act.timestamp), 'MMM d, h:mm a')} • {act.documentType}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`font-mono text-xs font-bold shrink-0 ${
                      isPositive ? 'text-emerald-500' : 'text-indigo-500'
                    }`}
                  >
                    {isPositive ? `+${act.qty}` : act.qty}
                  </div>
                </div>
              );
            })}
            {(!recentActivity || recentActivity.length === 0) && (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No recent transactions recorded.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WAREHOUSE ALLOCATION BREAKDOWN */}
      <div className="p-6 bg-card border border-border rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <span>Multi-Warehouse Distribution Status</span>
            </h2>
            <p className="text-xs text-muted-foreground">Stock quantity and asset valuation per facility</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {warehouseBreakdown?.map((wh: any) => (
            <div key={wh.id} className="p-4 rounded-xl bg-muted/30 border border-border/70 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-primary">{wh.code}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                    Operational
                  </span>
                </div>
                <div className="font-bold text-sm mt-1 text-foreground">{wh.name}</div>
              </div>
              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs">
                <div>
                  <div className="text-muted-foreground text-[10px]">Held Units</div>
                  <div className="font-bold font-mono text-foreground">{wh.units.toLocaleString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-muted-foreground text-[10px]">Valuation</div>
                  <div className="font-bold font-mono text-emerald-500">${wh.value.toLocaleString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
