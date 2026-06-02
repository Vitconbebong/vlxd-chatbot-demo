import React, { lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLayout from './components/layout/AdminLayout';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const InventoryPage = lazy(() => import('./pages/InventoryPage'));
const ProductManagementPage = lazy(() => import('./pages/ProductManagementPage'));
const DeliveriesPage = lazy(() => import('./pages/DeliveriesPage'));
const DeliveryDetailPage = lazy(() => import('./pages/DeliveryDetailPage'));
const QuotationsPage = lazy(() => import('./pages/QuotationsPage'));
const TicketsPage = lazy(() => import('./pages/TicketsPage'));
const AccountsPage = lazy(() => import('./pages/AccountsPage'));
const WarehouseManagementPage = lazy(() => import('./pages/WarehouseManagementPage'));
const CategoryManagementPage = lazy(() => import('./pages/CategoryManagementPage'));
const AiManagementPage = lazy(() => import('./pages/AiManagementPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="products" element={<ProductManagementPage />} />
          <Route path="deliveries" element={<DeliveriesPage />} />
          <Route path="deliveries/:id" element={<DeliveryDetailPage />} />
          <Route path="quotations" element={<QuotationsPage />} />
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="warehouses" element={<WarehouseManagementPage />} />
          <Route path="categories" element={<CategoryManagementPage />} />
          <Route path="ai-management" element={<AiManagementPage />} />
        </Route>
        <Route path="login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}
