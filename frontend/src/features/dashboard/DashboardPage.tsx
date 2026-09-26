import { useDashboard } from '../../hooks/useDashboard';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const DashboardPage = () => {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) return <div className="p-8">Loading dashboard metrics...</div>;
  if (error) return <div className="p-8 text-destructive">Error loading dashboard: {(error as any).message}</div>;

  const { kpis, recentActivity, trendData } = data;

  return (
    <div className="p-8 space-y-8 h-full overflow-y-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Link to="/app/products" className="p-6 bg-card border rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-muted-foreground">Total Products</p>
          <p className="text-3xl font-bold mt-2">{kpis.totalProducts}</p>
        </Link>
        <Link to="/app/products?filter=low-stock" className="p-6 bg-card border rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-muted-foreground">Low Stock</p>
          <p className="text-3xl font-bold mt-2 text-orange-500">{kpis.lowStockItems}</p>
        </Link>
        <Link to="/app/products?filter=out-of-stock" className="p-6 bg-card border rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
          <p className="text-3xl font-bold mt-2 text-destructive">{kpis.outOfStockItems}</p>
        </Link>
        <Link to="/app/operations/receipts" className="p-6 bg-card border rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-muted-foreground">Pending Receipts</p>
          <p className="text-3xl font-bold mt-2 text-amber-600">{kpis.pendingReceipts}</p>
        </Link>
        <Link to="/app/operations/deliveries" className="p-6 bg-card border rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-muted-foreground">Pending Deliveries</p>
          <p className="text-3xl font-bold mt-2 text-blue-600">{kpis.pendingDeliveries}</p>
        </Link>
        <Link to="/app/operations/transfers" className="p-6 bg-card border rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <p className="text-sm font-medium text-muted-foreground">Pending Transfers</p>
          <p className="text-3xl font-bold mt-2 text-purple-600">{kpis.pendingTransfers}</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 bg-card border rounded-lg shadow-sm">
          <h2 className="text-lg font-bold mb-4">Stock Movement Trend (30 Days)</h2>
          <div className="h-[300px] w-full flex items-center justify-center">
            {trendData?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Line type="monotone" dataKey="Inbound" stroke="#16a34a" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Outbound" stroke="#dc2626" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm">No stock movement data available for the last 30 days.</p>
            )}
          </div>
        </div>

        <div className="p-6 bg-card border rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Recent Activity</h2>
            <Link to="/app/operations/history" className="text-sm text-primary hover:underline">View All</Link>
          </div>
          <div className="space-y-4">
            {recentActivity?.map((activity: any) => (
              <div key={activity._id} className="flex items-start space-x-4 pb-4 border-b last:border-0 last:pb-0">
                <div className={`p-2 rounded-full ${activity.qty > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {activity.qty > 0 ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">{activity.documentCode} - {activity.productId?.name}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(activity.timestamp), 'MMM d, h:mm a')} • {activity.documentType}</p>
                </div>
                <div className="ml-auto text-sm font-bold">
                  {activity.qty > 0 ? '+' : ''}{activity.qty}
                </div>
              </div>
            ))}
            {recentActivity?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
