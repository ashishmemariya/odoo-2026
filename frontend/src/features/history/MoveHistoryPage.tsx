import { useState } from 'react';
import { useHistory } from '../../hooks/useHistory';
import { format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  History,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  FileSpreadsheet,
} from 'lucide-react';

export const MoveHistoryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const typeFilter = searchParams.get('type') || 'all';

  const queryParams = new URLSearchParams(searchParams);
  const { data, isLoading, error } = useHistory(queryParams.toString());

  const history = data?.data || [];
  const { page, pages, total } = data || { page: 1, pages: 1, total: 0 };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const nextParams = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      nextParams.set('search', searchInput.trim());
    } else {
      nextParams.delete('search');
    }
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  const handleTypeSelect = (type: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (type === 'all') nextParams.delete('type');
    else nextParams.set('type', type);
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  const handlePageChange = (newPage: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', newPage.toString());
    setSearchParams(nextParams);
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Receipt':
        return 'badge-done';
      case 'Delivery':
        return 'badge-ready';
      case 'Transfer':
        return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25';
      case 'Adjustment':
        return 'badge-waiting';
      default:
        return 'badge-draft';
    }
  };

  const exportLedgerCSV = () => {
    if (!history || history.length === 0) {
      toast.error('No ledger entries to export');
      return;
    }
    const headers = ['Date', 'Type', 'Document Code', 'SKU', 'Product Name', 'From Location', 'To Location', 'Delta Qty', 'Balance After'];
    const rows = history.map((e: any) => [
      format(new Date(e.timestamp), 'yyyy-MM-dd HH:mm'),
      e.documentType,
      e.documentCode,
      e.productId?.sku || '',
      `"${(e.productId?.name || '').replace(/"/g, '""')}"`,
      e.fromLocationId?.name || '-',
      e.toLocationId?.name || '-',
      e.qty,
      e.balanceAfter,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `StockSense_LedgerAudit_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Audit ledger exported to CSV');
  };

  // Compute summary stats for current view
  const inboundCount = history.filter((h: any) => h.qty > 0).reduce((sum: number, h: any) => sum + h.qty, 0);
  const outboundCount = history.filter((h: any) => h.qty < 0).reduce((sum: number, h: any) => sum + Math.abs(h.qty), 0);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-10 w-64 skeleton" />
        <div className="h-64 skeleton rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-destructive font-medium">Error loading history: {(error as any).message}</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Stock Move History</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Immutable, audit-ready ledger tracking every single stock intake, dispatch, transfer, and adjustment.
          </p>
        </div>

        <button
          onClick={exportLedgerCSV}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-accent text-xs font-semibold text-foreground transition-all shadow-xs"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
          <span>Export Audit CSV</span>
        </button>
      </div>

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Total Recorded Events</div>
            <div className="text-xl font-black font-mono mt-1 text-foreground">{total} Operations</div>
          </div>
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <History className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Inbound Units Added</div>
            <div className="text-xl font-black font-mono mt-1 text-emerald-500">+{inboundCount} units</div>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
            <ArrowDownRight className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Outbound Units Dispatched</div>
            <div className="text-xl font-black font-mono mt-1 text-blue-500">-{outboundCount} units</div>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-xs">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by document code, product name, or SKU..."
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-input bg-muted/30 text-xs sm:text-sm focus:bg-background focus:ring-2 focus:ring-primary outline-none transition-all"
          />
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
          {[
            { key: 'all', label: 'All Operations' },
            { key: 'Receipt', label: 'Receipts' },
            { key: 'Delivery', label: 'Deliveries' },
            { key: 'Transfer', label: 'Transfers' },
            { key: 'Adjustment', label: 'Adjustments' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTypeSelect(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                typeFilter.toLowerCase() === tab.key.toLowerCase()
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* LEDGER TABLE */}
      <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden flex flex-col">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Document</th>
                <th className="py-3.5 px-4">Product SKU</th>
                <th className="py-3.5 px-4">From Location</th>
                <th className="py-3.5 px-4">To Location</th>
                <th className="py-3.5 px-4 text-right">Quantity Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {history?.map((entry: any) => {
                const isPositive = entry.qty > 0;
                return (
                  <tr key={entry._id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                      {format(new Date(entry.timestamp), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getTypeBadge(entry.documentType)}`}>
                        {entry.documentType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      {entry.documentCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <span className="font-mono font-semibold text-foreground">{entry.productId?.sku}</span>
                        <div className="text-[11px] text-muted-foreground truncate max-w-xs">{entry.productId?.name}</div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground text-xs">{entry.fromLocationId?.name || '-'}</td>
                    <td className="py-3.5 px-4 text-muted-foreground text-xs">{entry.toLocationId?.name || '-'}</td>
                    <td
                      className={`py-3.5 px-4 text-right font-mono font-bold text-xs ${
                        isPositive ? 'text-emerald-500' : 'text-blue-500'
                      }`}
                    >
                      {isPositive ? `+${entry.qty}` : entry.qty}
                    </td>
                  </tr>
                );
              })}

              {(!history || history.length === 0) && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <History className="w-8 h-8 text-muted-foreground/50" />
                      <p className="text-sm font-semibold">No stock movements found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20">
            <span className="text-xs text-muted-foreground font-medium">
              Showing page {page} of {pages} ({total} movements)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold bg-card hover:bg-accent disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === pages}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold bg-card hover:bg-accent disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
