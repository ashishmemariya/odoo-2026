import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LoginPage } from './features/auth/LoginPage';
import { SignupPage } from './features/auth/SignupPage';
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './features/auth/ResetPasswordPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { ProductsListPage } from './features/products/ProductsListPage';
import { ReceiptsListPage } from './features/receipts/ReceiptsListPage';
import { DeliveriesListPage } from './features/deliveries/DeliveriesListPage';
import { TransfersListPage } from './features/transfers/TransfersListPage';
import { AdjustmentsListPage } from './features/adjustments/AdjustmentsListPage';
import { MoveHistoryPage } from './features/history/MoveHistoryPage';
import { ProfilePage } from './features/profile/ProfilePage';
import { AppShell } from './components/layout/AppShell';
import { useAuthStore } from './store/authStore';

const queryClient = new QueryClient();

const AuthGuard = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={isAuthenticated ? <Navigate to="/app/dashboard" replace /> : <Navigate to="/login" replace />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/app/dashboard" replace /> : <LoginPage />} />
          <Route path="/signup" element={isAuthenticated ? <Navigate to="/app/dashboard" replace /> : <SignupPage />} />
          <Route path="/forgot-password" element={isAuthenticated ? <Navigate to="/app/dashboard" replace /> : <ForgotPasswordPage />} />
          <Route path="/reset-password" element={isAuthenticated ? <Navigate to="/app/dashboard" replace /> : <ResetPasswordPage />} />
          
          {/* Protected App Routes */}
          <Route path="/app" element={<AuthGuard />}>
            <Route element={<AppShell />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="products" element={<ProductsListPage />} />
              <Route path="operations/receipts" element={<ReceiptsListPage />} />
              <Route path="operations/deliveries" element={<DeliveriesListPage />} />
              <Route path="operations/transfers" element={<TransfersListPage />} />
              <Route path="operations/adjustments" element={<AdjustmentsListPage />} />
              <Route path="operations/history" element={<MoveHistoryPage />} />
              <Route path="settings/profile" element={<ProfilePage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
