import { useHistory } from '../../hooks/useHistory';
import { format } from 'date-fns';
import { FilterBar } from '../../components/common/FilterBar';
import { useSearchParams } from 'react-router-dom';

export const MoveHistoryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isLoading, error } = useHistory(searchParams.toString());

  if (isLoading) return <div className="p-8">Loading history...</div>;
  if (error) return <div className="p-8 text-destructive">Error loading history: {(error as any).message}</div>;

  const history = data?.data || [];
  const { page, pages, total } = data || { page: 1, pages: 1, total: 0 };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'Receipt': return 'text-green-600 bg-green-50';
      case 'Delivery': return 'text-blue-600 bg-blue-50';
      case 'Transfer': return 'text-purple-600 bg-purple-50';
      case 'Adjustment': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
  };

  return (
    <div className="p-8 space-y-6 h-full overflow-y-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Move History</h1>
      </div>

      <FilterBar 
        fields={[
          {
            key: 'type',
            label: 'Type',
            options: [
              { label: 'Receipts', value: 'Receipt' },
              { label: 'Deliveries', value: 'Delivery' },
              { label: 'Transfers', value: 'Transfer' },
              { label: 'Adjustments', value: 'Adjustment' },
            ]
          }
        ]}
      />

      <div className="bg-card border rounded-lg overflow-hidden shadow-sm flex flex-col">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-3 font-medium text-muted-foreground">Date</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Type</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Document</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Product</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">From Location</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">To Location</th>
              <th className="px-4 py-3 font-medium text-muted-foreground text-right">Qty</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {history?.map((entry: any) => (
              <tr key={entry._id} className="hover:bg-muted/20">
                <td className="px-4 py-3">{format(new Date(entry.timestamp), 'MMM d, yyyy HH:mm')}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(entry.documentType)}`}>
                    {entry.documentType}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">{entry.documentCode}</td>
                <td className="px-4 py-3">{entry.productId?.sku}</td>
                <td className="px-4 py-3">{entry.fromLocationId?.name || '-'}</td>
                <td className="px-4 py-3">{entry.toLocationId?.name || '-'}</td>
                <td className={`px-4 py-3 text-right font-medium ${entry.qty > 0 ? 'text-green-600' : entry.qty < 0 ? 'text-red-600' : ''}`}>
                  {entry.qty > 0 ? '+' : ''}{entry.qty}
                </td>
              </tr>
            ))}
            {history?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No ledger entries found.</td>
              </tr>
            )}
          </tbody>
        </table>
        
        {pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t bg-muted/20">
            <span className="text-sm text-muted-foreground">Showing page {page} of {pages} ({total} entries)</span>
            <div className="flex gap-2">
              <button 
                onClick={() => handlePageChange(page - 1)} 
                disabled={page === 1}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 bg-background hover:bg-muted"
              >
                Previous
              </button>
              <button 
                onClick={() => handlePageChange(page + 1)} 
                disabled={page === pages}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50 bg-background hover:bg-muted"
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
