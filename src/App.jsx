import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/layout/Layout.jsx';

import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import POS from './pages/POS.jsx';
import Products from './pages/Products.jsx';
import Categories from './pages/Categories.jsx';
import Customers from './pages/Customers.jsx';
import Sales from './pages/Sales.jsx';
import Reports from './pages/Reports.jsx';
import Inventory from './pages/Inventory.jsx';
import Settings from './pages/Settings.jsx';
import Quotes from './pages/Quotes.jsx';
import CatalogAdmin from './pages/CatalogAdmin.jsx';
import PublicCatalog from './pages/PublicCatalog.jsx';
import Users from './pages/Users.jsx';
import CashRegister from './pages/CashRegister.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <Routes>
      {/* Rutas públicas (sin login) */}
      <Route path="/login" element={<Login />} />
      <Route path="/catalog" element={<PublicCatalog />} />

      {/* Rutas protegidas dentro del layout */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/sales" element={<Sales />} />
        <Route path="/quotes" element={<Quotes />} />
        <Route path="/cash" element={<CashRegister />} />
        <Route path="/products" element={<Products />} />
        <Route
          path="/categories"
          element={
            <ProtectedRoute role="ADMIN">
              <Categories />
            </ProtectedRoute>
          }
        />
        <Route path="/customers" element={<Customers />} />
        <Route
          path="/inventory"
          element={
            <ProtectedRoute role="ADMIN">
              <Inventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute role="ADMIN">
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute role="ADMIN">
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/catalog-qr"
          element={
            <ProtectedRoute role="ADMIN">
              <CatalogAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute role="ADMIN">
              <Users />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
