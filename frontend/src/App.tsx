import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, Spin } from 'antd';
import viVN from 'antd/locale/vi_VN';

import AppLayout from './components/AppLayout';
import ProtectedRoute from './components/ProtectedRoute';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const ImportPage = lazy(() => import('./pages/ImportPage'));
const ReportPage = lazy(() => import('./pages/ReportPage'));
const SavedProductsPage = lazy(() => import('./pages/SavedProductsPage'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spin size="large" />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={viVN}>
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/import" element={<ImportPage />} />
                <Route path="/report" element={<ReportPage />} />
                <Route path="/saved-products" element={<SavedProductsPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/import" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
