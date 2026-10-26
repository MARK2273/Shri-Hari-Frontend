import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TourProvider } from './context/TourContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { MaterialsPage } from './pages/MaterialsPage';
import { ProductsPage } from './pages/ProductsPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProductionPage } from './pages/ProductionPage';
import { FinishedGoodsPage } from './pages/FinishedGoodsPage';
import { JobWorkPage } from './pages/JobWorkPage';
import { DispatchPage } from './pages/DispatchPage';
import { TraceabilityPage } from './pages/TraceabilityPage';
import { ReportsPage } from './pages/ReportsPage';
import { ScrapPage } from './pages/ScrapPage';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <TourProvider>
            <BrowserRouter>
            <Routes>
            {/* Public route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected ERP routes */}
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/materials" element={<MaterialsPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/size-microns" element={<Navigate to="/materials" replace />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/production" element={<ProductionPage />} />
              <Route path="/job-work" element={<JobWorkPage />} />
              <Route path="/finished-goods" element={<FinishedGoodsPage />} />
              <Route path="/scrap" element={<ScrapPage />} />
              <Route path="/dispatch" element={<DispatchPage />} />
              <Route path="/traceability" element={<TraceabilityPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
          </TourProvider>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
