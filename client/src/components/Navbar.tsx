import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  Store,
  Layers,
  Search,
  ShoppingCart,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Radio,
  ArrowRightLeft,
  Shield,
  Sliders,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSocket } from '../context/SocketContext';

export const Navbar: React.FC = () => {
  const { user, logout, switchDemoUser, isSeller, isAdmin } = useAuth();
  const { cart } = useCart();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoDropdownOpen, setDemoDropdownOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/', icon: Store },
    { name: 'Stores', path: '/stores', icon: Store },
    { name: 'Categories', path: '/categories', icon: Layers },
    { name: 'Compare', path: '/compare', icon: ArrowRightLeft },
    { name: 'Orders', path: '/orders', icon: ShoppingBag }
  ];

  const handleDemoSwitch = async (email: string) => {
    setDemoDropdownOpen(false);
    setMobileMenuOpen(false);
    await switchDemoUser(email);
    if (email === 'admin@vendersetu.edu.in') {
      navigate('/admin');
    } else if (email.endsWith('@vendersetu.edu.in') && email !== 'student@vendersetu.edu.in') {
      navigate('/seller');
    } else {
      navigate('/');
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Banner / Demo Switcher Bar */}
      <div className="bg-slate-900 text-slate-200 text-xs py-1.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1.5">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400 live-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="font-medium text-slate-300">
                {isConnected ? 'Live Inventory Sync Active' : 'Connecting to campus realtime...'}
              </span>
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline text-slate-400">
              Campus Stores: College Canteen, Durga, Monal, Bhandari, Devbhoomi
            </span>
          </div>

          {/* Quick Demo Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setDemoDropdownOpen(!demoDropdownOpen)}
              className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 px-2.5 py-1 rounded-md font-medium transition-colors border border-slate-700"
            >
              <span>Switch Role / Store Demo</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {demoDropdownOpen && (
              <div
                className="absolute right-0 mt-1 w-64 bg-white text-slate-800 rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 text-left"
                onMouseLeave={() => setDemoDropdownOpen(false)}
              >
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Demo Persona
                </div>
                <button
                  onClick={() => handleDemoSwitch('student@vendersetu.edu.in')}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-between"
                >
                  <span className="font-medium">🎓 Student (Rahul Sharma)</span>
                  <span className="text-[10px] text-slate-400">Buyer</span>
                </button>
                <div className="border-t border-slate-100 my-1"></div>
                <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Store Sellers (Isolated)
                </div>
                <button
                  onClick={() => handleDemoSwitch('canteen@vendersetu.edu.in')}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-between"
                >
                  <span>🏪 College Canteen</span>
                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">Seller</span>
                </button>
                <button
                  onClick={() => handleDemoSwitch('durga@vendersetu.edu.in')}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-between"
                >
                  <span>🍔 Durga Fast Food</span>
                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">Seller</span>
                </button>
                <button
                  onClick={() => handleDemoSwitch('monal@vendersetu.edu.in')}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-between"
                >
                  <span>🥟 Monal Fast Food</span>
                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">Seller</span>
                </button>
                <button
                  onClick={() => handleDemoSwitch('bhandari@vendersetu.edu.in')}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-between"
                >
                  <span>📚 Bhandari General Store</span>
                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">Seller</span>
                </button>
                <button
                  onClick={() => handleDemoSwitch('devbhoomi@vendersetu.edu.in')}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-between"
                >
                  <span>🛒 Devbhoomi General Store</span>
                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">Seller</span>
                </button>
                <div className="border-t border-slate-100 my-1"></div>
                <button
                  onClick={() => handleDemoSwitch('admin@vendersetu.edu.in')}
                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-purple-50 hover:text-purple-700 flex items-center justify-between text-purple-600 font-medium"
                >
                  <span>🛡️ Campus Administrator</span>
                  <span className="text-[10px] bg-purple-100 px-1.5 py-0.5 rounded text-purple-700">Admin</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-bold tracking-tight text-slate-900 brand-font">VenderSetu</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Campus
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block -mt-1">
                Your Campus, Your Stores, Connected.
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? 'text-emerald-700 bg-emerald-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}

            {/* Seller dashboard quick link if user is seller */}
            {isSeller && (
              <Link
                to="/seller"
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-semibold text-emerald-700 bg-emerald-100/70 hover:bg-emerald-100 ml-2 border border-emerald-200"
              >
                <Sliders className="w-4 h-4" />
                <span>Seller Dashboard</span>
              </Link>
            )}

            {/* Admin dashboard quick link if user is admin */}
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-semibold text-purple-700 bg-purple-100/70 hover:bg-purple-100 ml-2 border border-purple-200"
              >
                <Shield className="w-4 h-4" />
                <span>Admin Console</span>
              </Link>
            )}
          </nav>

          {/* Right Actions: Cart & Profile / Login */}
          <div className="flex items-center space-x-3">
            {/* Multi-Store Cart Button */}
            <Link
              to="/cart"
              className="relative p-2 text-slate-700 hover:text-emerald-600 hover:bg-slate-100 rounded-xl transition-colors"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cart.totalItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                  {cart.totalItemsCount}
                </span>
              )}
            </Link>

            {/* User Profile or Login */}
            {user ? (
              <div className="flex items-center space-x-2">
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 py-1 px-2.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden lg:block text-left text-xs">
                    <p className="font-semibold text-slate-800 leading-tight truncate max-w-[100px]">
                      {user.name}
                    </p>
                    <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
                  </div>
                </Link>

                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm shadow-emerald-600/20"
              >
                <UserIcon className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive(link.path)
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.name}</span>
              </Link>
            );
          })}

          {isSeller && (
            <Link
              to="/seller"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-emerald-700 bg-emerald-50"
            >
              <Sliders className="w-4 h-4" />
              <span>Seller Dashboard</span>
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-purple-700 bg-purple-50"
            >
              <Shield className="w-4 h-4" />
              <span>Admin Console</span>
            </Link>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            {user ? (
              <div className="flex items-center justify-between w-full">
                <div className="text-xs">
                  <p className="font-semibold text-slate-800">{user.name}</p>
                  <p className="text-slate-500">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-rose-600 font-medium px-2 py-1 rounded bg-rose-50"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium"
              >
                Sign In / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
