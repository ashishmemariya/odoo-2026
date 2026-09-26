import { useState } from 'react';
import { Outlet, NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  PackagePlus,
  Truck,
  ArrowLeftRight,
  ClipboardCheck,
  History,
  User,
  Boxes,
  LogOut,
  Bell,
  Search,
  Sun,
  Moon,
  Menu,
  X,
  Plus,
  ChevronDown,
  RotateCcw,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useDashboard } from '../../hooks/useDashboard';
import { useWarehouses } from '../../hooks/useWarehouses';
import { CommandPalette } from '../common/CommandPalette';
import { mockDb } from '../../services/mockDb';
import { useQueryClient } from '@tanstack/react-query';
import { Toaster, toast } from 'react-hot-toast';

export const AppShell = () => {
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all');

  const { data: dashboardData } = useDashboard();
  const { data: warehouses } = useWarehouses();

  const lowStockCount = (dashboardData?.kpis?.lowStockItems || 0) + (dashboardData?.kpis?.outOfStockItems || 0);
  const pendingReceipts = dashboardData?.kpis?.pendingReceipts || 0;
  const pendingDeliveries = dashboardData?.kpis?.pendingDeliveries || 0;

  const handleResetDemoData = () => {
    if (confirm('Restore demo data to default realistic warehouse state?')) {
      mockDb.resetAllData();
      queryClient.invalidateQueries();
      toast.success('System reloaded with default demo data!');
    }
  };

  const navItemClass = (path: string) => {
    const isActive = location.pathname === path || (path !== '/app/dashboard' && location.pathname.startsWith(path));
    return `group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl transition-all duration-150 ${
      isActive
        ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/25 font-semibold'
        : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
    }`;
  };

  const navIconClass = (path: string) => {
    const isActive = location.pathname === path || (path !== '/app/dashboard' && location.pathname.startsWith(path));
    return `w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-primary'}`;
  };

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground">
      <Toaster position="top-right" toastOptions={{ className: 'text-sm font-medium shadow-lg' }} />
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />

      {/* MOBILE BACKDROP */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border flex flex-col transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* BRAND HEADER */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-border bg-card shrink-0">
          <Link
            to="/app/dashboard"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-indigo-500 flex items-center justify-center text-primary-foreground shadow-md shadow-primary/30 group-hover:scale-105 transition-transform">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight gradient-text">StockSense</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  IMS
                </span>
              </div>
              <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500 inline" /> Zero-Backend Local
              </div>
            </div>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-muted-foreground hover:bg-accent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION LINKS */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-4 space-y-6 scrollbar-thin">
          {/* Main */}
          <div className="space-y-1">
            <div className="px-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Overview
            </div>
            <NavLink
              to="/app/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className={() => navItemClass('/app/dashboard')}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className={navIconClass('/app/dashboard')} />
                <span>Dashboard</span>
              </div>
            </NavLink>
            <NavLink
              to="/app/products"
              onClick={() => setIsMobileMenuOpen(false)}
              className={() => navItemClass('/app/products')}
            >
              <div className="flex items-center gap-3">
                <Package className={navIconClass('/app/products')} />
                <span>Products & Stock</span>
              </div>
              {lowStockCount > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  {lowStockCount}
                </span>
              )}
            </NavLink>
          </div>

          {/* Operations */}
          <div className="space-y-1">
            <div className="px-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Stock Operations
            </div>
            <NavLink
              to="/app/operations/receipts"
              onClick={() => setIsMobileMenuOpen(false)}
              className={() => navItemClass('/app/operations/receipts')}
            >
              <div className="flex items-center gap-3">
                <PackagePlus className={navIconClass('/app/operations/receipts')} />
                <span>Receipts (Inbound)</span>
              </div>
              {pendingReceipts > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400">
                  {pendingReceipts}
                </span>
              )}
            </NavLink>
            <NavLink
              to="/app/operations/deliveries"
              onClick={() => setIsMobileMenuOpen(false)}
              className={() => navItemClass('/app/operations/deliveries')}
            >
              <div className="flex items-center gap-3">
                <Truck className={navIconClass('/app/operations/deliveries')} />
                <span>Deliveries (Outbound)</span>
              </div>
              {pendingDeliveries > 0 && (
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400">
                  {pendingDeliveries}
                </span>
              )}
            </NavLink>
            <NavLink
              to="/app/operations/transfers"
              onClick={() => setIsMobileMenuOpen(false)}
              className={() => navItemClass('/app/operations/transfers')}
            >
              <div className="flex items-center gap-3">
                <ArrowLeftRight className={navIconClass('/app/operations/transfers')} />
                <span>Internal Transfers</span>
              </div>
            </NavLink>
            <NavLink
              to="/app/operations/adjustments"
              onClick={() => setIsMobileMenuOpen(false)}
              className={() => navItemClass('/app/operations/adjustments')}
            >
              <div className="flex items-center gap-3">
                <ClipboardCheck className={navIconClass('/app/operations/adjustments')} />
                <span>Adjustments / Audit</span>
              </div>
            </NavLink>
          </div>

          {/* Audit & Reports */}
          <div className="space-y-1">
            <div className="px-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Reports & Audit
            </div>
            <NavLink
              to="/app/operations/history"
              onClick={() => setIsMobileMenuOpen(false)}
              className={() => navItemClass('/app/operations/history')}
            >
              <div className="flex items-center gap-3">
                <History className={navIconClass('/app/operations/history')} />
                <span>Move History</span>
              </div>
            </NavLink>
          </div>

          {/* Settings */}
          <div className="space-y-1">
            <div className="px-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              System
            </div>
            <NavLink
              to="/app/settings/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className={() => navItemClass('/app/settings/profile')}
            >
              <div className="flex items-center gap-3">
                <User className={navIconClass('/app/settings/profile')} />
                <span>Settings & Profile</span>
              </div>
            </NavLink>
            <button
              onClick={handleResetDemoData}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-xl text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <RotateCcw className="w-4 h-4 text-amber-500" />
                <span>Reset Demo Data</span>
              </div>
            </button>
          </div>
        </nav>

        {/* USER PROFILE & FOOTER */}
        <div className="p-3.5 border-t border-border bg-card shrink-0">
          <div className="flex items-center justify-between p-2 rounded-xl bg-accent/40 border border-border/50">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {user?.name ? user.name.substring(0, 2).toUpperCase() : 'AH'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold truncate text-foreground">
                  {user?.name || 'Alex Harrison'}
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  {user?.email || 'demo@stocksense.app'}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* TOPBAR */}
        <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md flex items-center px-4 md:px-6 shrink-0 gap-3 z-30">
          {/* Mobile hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-xl border border-border text-foreground hover:bg-accent"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Command Search Trigger */}
          <div
            onClick={() => setIsCommandOpen(true)}
            className="flex-1 max-w-md flex items-center gap-2 h-10 px-3.5 rounded-xl border border-input bg-muted/40 hover:bg-muted/70 text-muted-foreground text-sm cursor-pointer transition-all group"
          >
            <Search className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="flex-1 text-xs md:text-sm truncate">Search SKU, products, or jump to page...</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-card border border-border text-foreground">
              <span>⌘</span>K
            </kbd>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {/* Warehouse Filter */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/40 border border-border text-xs font-medium text-foreground">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="bg-transparent outline-none cursor-pointer text-foreground pr-1"
              >
                <option value="all">All Hubs (Multi-facility)</option>
                {warehouses?.map((w: any) => (
                  <option key={w._id} value={w._id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Action Button */}
            <div className="relative">
              <button
                onClick={() => setIsQuickCreateOpen(!isQuickCreateOpen)}
                className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Operation</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {isQuickCreateOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setIsQuickCreateOpen(false)}
                >
                  <button
                    onClick={() => navigate('/app/operations/receipts?action=new')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-foreground hover:bg-accent text-left"
                  >
                    <PackagePlus className="w-4 h-4 text-emerald-500" />
                    <span>Inbound Receipt</span>
                  </button>
                  <button
                    onClick={() => navigate('/app/operations/deliveries?action=new')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-foreground hover:bg-accent text-left"
                  >
                    <Truck className="w-4 h-4 text-blue-500" />
                    <span>Outbound Delivery</span>
                  </button>
                  <button
                    onClick={() => navigate('/app/operations/transfers?action=new')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-foreground hover:bg-accent text-left"
                  >
                    <ArrowLeftRight className="w-4 h-4 text-purple-500" />
                    <span>Internal Transfer</span>
                  </button>
                  <button
                    onClick={() => navigate('/app/operations/adjustments?action=new')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-foreground hover:bg-accent text-left"
                  >
                    <ClipboardCheck className="w-4 h-4 text-amber-500" />
                    <span>Stock Adjustment</span>
                  </button>
                  <div className="my-1 border-t border-border" />
                  <button
                    onClick={() => navigate('/app/products?action=new')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-lg text-foreground hover:bg-accent text-left"
                  >
                    <Package className="w-4 h-4 text-primary" />
                    <span>New SKU / Product</span>
                  </button>
                </div>
              )}
            </div>

            {/* Notifications Popover */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {lowStockCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-pulse">
                    {lowStockCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div
                  className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setIsNotificationsOpen(false)}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <span className="font-bold text-sm">Notifications & Alerts</span>
                    <span className="text-[11px] text-muted-foreground font-medium">Real-time</span>
                  </div>
                  <div className="mt-3 space-y-2.5 max-h-64 overflow-y-auto scrollbar-thin">
                    {lowStockCount > 0 ? (
                      <Link
                        to="/app/products?filter=low-stock"
                        className="flex items-start gap-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-colors"
                      >
                        <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-amber-700 dark:text-amber-400">
                            Low Stock Alert ({lowStockCount} items)
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            Inventory levels have dropped below reorder threshold.
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div className="text-xs text-muted-foreground text-center py-4">
                        All inventory levels are healthy.
                      </div>
                    )}
                    {pendingReceipts > 0 && (
                      <Link
                        to="/app/operations/receipts"
                        className="flex items-start gap-3 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/15 transition-colors"
                      >
                        <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                        <div>
                          <div className="text-xs font-bold text-blue-700 dark:text-blue-400">
                            Pending Inbound Shipments ({pendingReceipts})
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            Receipts waiting for verification or dock validation.
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dark / Light Mode Switcher */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </header>

        {/* OUTLET VIEW */}
        <main className="flex-1 overflow-auto bg-muted/15 scrollbar-thin">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
