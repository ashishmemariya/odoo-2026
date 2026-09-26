import { Outlet, NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import { LayoutDashboard, Package, PackagePlus, Truck, ArrowLeftRight, ClipboardCheck, History, User, Boxes, LogOut, Bell, Search } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Toaster } from 'react-hot-toast';
import { useDashboard } from '../../hooks/useDashboard';
import { useState } from 'react';

export const AppShell = () => {
  const { logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const { data } = useDashboard();
  
  const lowStockCount = (data?.kpis?.lowStockItems || 0) + (data?.kpis?.outOfStockItems || 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/app/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const getNavLinkClass = (path: string) => {
    const isActive = location.pathname.startsWith(path);
    return `flex items-center px-3 py-2 text-sm font-medium transition-colors ${
      isActive 
        ? 'bg-primary/10 text-primary border-l-[3px] border-primary rounded-r-md -ml-[3px]' 
        : 'text-muted-foreground hover:bg-accent hover:text-foreground rounded-md'
    }`;
  };

  return (
    <div className="flex h-screen w-full bg-background">
      <aside className="w-64 border-r bg-card h-full flex flex-col hidden md:flex">
        <div className="h-14 flex items-center px-4 border-b shrink-0 mb-4">
          <Boxes className="w-6 h-6 text-primary mr-2" />
          <div className="font-bold text-lg tracking-tight">StockSense</div>
        </div>
        
        <nav className="flex-1 overflow-y-auto px-3 space-y-1 pb-4">
          <NavLink to="/app/dashboard" className={() => getNavLinkClass('/app/dashboard')}>
            <LayoutDashboard className="w-4 h-4 mr-3" /> Dashboard
          </NavLink>
          <NavLink to="/app/products" className={() => getNavLinkClass('/app/products')}>
            <Package className="w-4 h-4 mr-3" /> Products
          </NavLink>

          <div className="mt-8 mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Operations</div>
          <NavLink to="/app/operations/receipts" className={() => getNavLinkClass('/app/operations/receipts')}>
            <PackagePlus className="w-4 h-4 mr-3" /> Receipts
          </NavLink>
          <NavLink to="/app/operations/deliveries" className={() => getNavLinkClass('/app/operations/deliveries')}>
            <Truck className="w-4 h-4 mr-3" /> Deliveries
          </NavLink>
          <NavLink to="/app/operations/transfers" className={() => getNavLinkClass('/app/operations/transfers')}>
            <ArrowLeftRight className="w-4 h-4 mr-3" /> Transfers
          </NavLink>
          <NavLink to="/app/operations/adjustments" className={() => getNavLinkClass('/app/operations/adjustments')}>
            <ClipboardCheck className="w-4 h-4 mr-3" /> Adjustments
          </NavLink>

          <div className="mt-8 mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reports</div>
          <NavLink to="/app/operations/history" className={() => getNavLinkClass('/app/operations/history')}>
            <History className="w-4 h-4 mr-3" /> Move History
          </NavLink>
        </nav>

        <div className="mt-auto p-4 border-t space-y-1 shrink-0 flex flex-col">
          <div className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Settings</div>
          <NavLink to="/app/settings/profile" className={() => getNavLinkClass('/app/settings/profile')}>
            <User className="w-4 h-4 mr-3" /> Profile
          </NavLink>
          <button onClick={logout} className="w-full flex items-center px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors mt-1">
            <LogOut className="w-4 h-4 mr-3" /> Log Out
          </button>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Toaster position="top-right" />
        {/* Topbar placeholder */}
        <header className="h-14 border-b flex items-center px-6 bg-card shrink-0 gap-4">
          <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by SKU or name..." 
              className="w-full h-9 pl-9 pr-4 rounded-md border border-input bg-muted/50 text-sm focus:bg-background focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </form>
          
          <div className="ml-auto flex items-center space-x-6">
            <Link to="/app/products?filter=low-stock" className="relative text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="w-5 h-5" />
              {lowStockCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {lowStockCount}
                </span>
              )}
            </Link>
            <div className="flex items-center space-x-2 border-l pl-6">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                DU
              </div>
              <span className="font-medium text-sm hidden sm:block">Demo User</span>
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto bg-muted/20">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
