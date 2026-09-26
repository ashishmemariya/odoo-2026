import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  PackagePlus,
  Truck,
  ArrowLeftRight,
  ClipboardCheck,
  History,
  User,
  Search,
  Sparkles,
  RotateCcw,
  PlusCircle,
  X,
} from 'lucide-react';
import { useProducts } from '../../hooks/useProducts';
import { mockDb } from '../../services/mockDb';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette = ({ isOpen, onClose }: CommandPaletteProps) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { data: products } = useProducts();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickNav = [
    { label: 'Dashboard Overview', path: '/app/dashboard', icon: LayoutDashboard, category: 'Navigation' },
    { label: 'Products & Inventory', path: '/app/products', icon: Package, category: 'Navigation' },
    { label: 'Inbound Receipts', path: '/app/operations/receipts', icon: PackagePlus, category: 'Operations' },
    { label: 'Delivery Orders', path: '/app/operations/deliveries', icon: Truck, category: 'Operations' },
    { label: 'Internal Transfers', path: '/app/operations/transfers', icon: ArrowLeftRight, category: 'Operations' },
    { label: 'Stock Adjustments', path: '/app/operations/adjustments', icon: ClipboardCheck, category: 'Operations' },
    { label: 'Move History & Ledger', path: '/app/operations/history', icon: History, category: 'Audit' },
    { label: 'User Profile & Settings', path: '/app/settings/profile', icon: User, category: 'Settings' },
  ];

  const filteredNav = quickNav.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const matchedProducts = (products || [])
    .filter(
      (p: any) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.sku.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 5);

  const handleSelectNav = (path: string) => {
    navigate(path);
    onClose();
  };

  const handleResetData = () => {
    if (confirm('Reset all demo data to initial realistic seed state?')) {
      mockDb.resetAllData();
      queryClient.invalidateQueries();
      toast.success('Demo data restored to initial state');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-20 p-4 animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex items-center gap-3 bg-muted/30">
          <Search className="w-5 h-5 text-primary shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, page, product name, or SKU... (Esc to exit)"
            className="flex-1 bg-transparent text-sm md:text-base outline-none text-foreground placeholder:text-muted-foreground"
            autoFocus
          />
          <span className="hidden sm:inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground border">
            ESC
          </span>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4 scrollbar-thin">
          {/* Quick Actions */}
          <div>
            <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-1">
              Quick Actions
            </div>
            <div className="space-y-1">
              <button
                onClick={() => {
                  navigate('/app/products?action=new');
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-all text-left group"
              >
                <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium">Create New Product</div>
                  <div className="text-xs text-muted-foreground">Add SKU, category, and initial inventory</div>
                </div>
              </button>
              <button
                onClick={handleResetData}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-foreground hover:bg-destructive/10 hover:text-destructive transition-all text-left group"
              >
                <div className="w-7 h-7 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-medium">Reset Demo Database</div>
                  <div className="text-xs text-muted-foreground">Restore products, receipts, and movements to default</div>
                </div>
              </button>
            </div>
          </div>

          {/* Navigation */}
          {filteredNav.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-1">
                Pages & Operations
              </div>
              <div className="space-y-1">
                {filteredNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.path}
                      onClick={() => handleSelectNav(item.path)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-foreground hover:bg-accent transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Matched Products */}
          {query.trim() && matchedProducts.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-1 flex items-center justify-between">
                <span>Matching Products</span>
                <Sparkles className="w-3 h-3 text-primary" />
              </div>
              <div className="space-y-1">
                {matchedProducts.map((p: any) => (
                  <button
                    key={p._id}
                    onClick={() => {
                      navigate(`/app/products?search=${encodeURIComponent(p.sku)}`);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-foreground hover:bg-accent transition-colors text-left"
                  >
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <span>{p.name}</span>
                        <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.2 rounded">
                          {p.sku}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.categoryId?.name} • Stock: {p.totalStock} {p.uom}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-primary">
                      ${p.sellingPrice.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Navigation shortcut:</span>
            <kbd className="px-1.5 py-0.5 bg-muted rounded border font-mono text-[10px]">Ctrl+K</kbd>
          </div>
          <span>StockSense Client Engine v2.4</span>
        </div>
      </div>
    </div>
  );
};
