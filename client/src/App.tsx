import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';

import { HomePage } from './pages/student/HomePage';
import { StoresPage } from './pages/student/StoresPage';
import { StoreDetailPage } from './pages/student/StoreDetailPage';
import { CategoriesPage } from './pages/student/CategoriesPage';
import { ProductComparePage } from './pages/student/ProductComparePage';
import { CartPage } from './pages/student/CartPage';
import { CheckoutPage } from './pages/student/CheckoutPage';
import { OrdersPage } from './pages/student/OrdersPage';
import { ProfilePage } from './pages/student/ProfilePage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { SellerDashboard } from './pages/seller/SellerDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';

export function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <CartProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
              <Navbar />

              <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6">
                <Routes>
                  {/* Student Marketplace Routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/stores" element={<StoresPage />} />
                  <Route path="/stores/:slug" element={<StoreDetailPage />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/compare" element={<ProductComparePage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/orders" element={<OrdersPage />} />
                  <Route path="/profile" element={<ProfilePage />} />

                  {/* Auth Routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  {/* Isolated Seller Dashboard */}
                  <Route path="/seller" element={<SellerDashboard />} />

                  {/* Administrator Console */}
                  <Route path="/admin" element={<AdminDashboard />} />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>

              {/* Campus Footer */}
              <footer className="bg-white border-t border-slate-200 py-8 px-4 sm:px-6 mt-16 text-xs text-slate-500">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 brand-font">VenderSetu</span>
                    <span>— Your Campus, Your Stores, Connected.</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span>College Canteen</span>
                    <span>•</span>
                    <span>Durga Fast Food</span>
                    <span>•</span>
                    <span>Monal Fast Food</span>
                    <span>•</span>
                    <span>Bhandari General Store</span>
                    <span>•</span>
                    <span>Devbhoomi General Store</span>
                  </div>
                </div>
              </footer>
            </div>
          </BrowserRouter>
        </CartProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
