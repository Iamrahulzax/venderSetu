import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  MapPin,
  Search,
  ShoppingCart,
  User as UserIcon,
  ChevronDown,
  ShoppingBag,
  Store,
  Layers,
  ArrowRightLeft,
  Shield,
  Sliders,
  LogOut,
  Menu,
  X,
  Phone,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Percent,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useSocket } from '../context/SocketContext';

export const Navbar: React.FC<{
  onSearchChange?: (val: string) => void;
  searchValue?: string;
  selectedCity?: string;
  onCityChange?: (city: string) => void;
}> = ({
  onSearchChange,
  searchValue = '',
  selectedCity = 'Hostel Block A (Boys)',
  onCityChange
}) => {
  const { user, logout, switchDemoUser, isSeller, isAdmin } = useAuth();
  const { cart } = useCart();
  const { isConnected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoDropdownOpen, setDemoDropdownOpen] = useState(false);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [storesDropdownOpen, setStoresDropdownOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);
  const [dealsDropdownOpen, setDealsDropdownOpen] = useState(false);
  const [internalSearch, setInternalSearch] = useState(searchValue);

  const campusDeliveryLocations = [
    'Hostel Block A (Boys)',
    'Hostel Block B (Girls)',
    'Hostel Block 4 (New Wing)',
    'Student Activity Centre (SAC)',
    'Central Library Pathway',
    'North Gate Commercial Complex',
    'Devbhoomi Sector 2',
    'Faculty & Staff Quarters'
  ];

  const handleLocationSelect = (loc: string) => {
    if (onCityChange) onCityChange(loc);
    setLocationDropdownOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchChange) {
      onSearchChange(internalSearch);
    }
  };

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
    <header className="sticky top-0 z-40 bg-white shadow-xs">
      {/* 1. Top Announcement Bar (Forest Green) - College Campus Delivery & Realtime Live Status */}
      <div className="bg-[#093d25] text-emerald-100 text-[11px] sm:text-xs py-2 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex-1 text-center sm:text-left flex items-center justify-center sm:justify-start gap-2">
            <span className="font-semibold text-white">Get 20% OFF your first order</span>
            <span className="text-emerald-400">•</span>
            <span className="hidden sm:inline text-emerald-100/90">
              Order from College Canteen, Durga, Monal, Bhandari & Devbhoomi with 15-min Hostel Delivery!
            </span>
            <span className="sm:hidden text-emerald-100/90">Hostel delivery in 15 mins</span>
          </div>

          <div className="hidden md:flex items-center space-x-4 text-[11px] text-emerald-200">
            {/* Live Socket Status */}
            <span className="flex items-center space-x-1.5 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="text-[10px] text-emerald-300">
                {isConnected ? 'Real-Time Campus Sync Active' : 'Connecting...'}
              </span>
            </span>

            {/* Quick Demo Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDemoDropdownOpen(!demoDropdownOpen)}
                className="flex items-center space-x-1 text-emerald-300 hover:text-white transition-colors"
              >
                <span>Switch Demo Persona</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {demoDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-64 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-left"
                  onMouseLeave={() => setDemoDropdownOpen(false)}
                >
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Demo Persona
                  </div>
                  <button
                    onClick={() => handleDemoSwitch('student@vendersetu.edu.in')}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-emerald-50 hover:text-emerald-800 flex items-center justify-between"
                  >
                    <span className="font-medium">🎓 Student (Rahul Sharma)</span>
                    <span className="text-[10px] text-slate-400">Buyer</span>
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    5 Campus Store Sellers
                  </div>
                  <button
                    onClick={() => handleDemoSwitch('canteen@vendersetu.edu.in')}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-emerald-50 hover:text-emerald-800 flex items-center justify-between"
                  >
                    <span>🏪 College Canteen</span>
                    <span className="text-[10px] text-slate-400">SAC</span>
                  </button>
                  <button
                    onClick={() => handleDemoSwitch('durga@vendersetu.edu.in')}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-emerald-50 hover:text-emerald-800 flex items-center justify-between"
                  >
                    <span>🍔 Durga Fast Food</span>
                    <span className="text-[10px] text-slate-400">North Gate</span>
                  </button>
                  <button
                    onClick={() => handleDemoSwitch('monal@vendersetu.edu.in')}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-emerald-50 hover:text-emerald-800 flex items-center justify-between"
                  >
                    <span>🥟 Monal Fast Food</span>
                    <span className="text-[10px] text-slate-400">Hostel 4</span>
                  </button>
                  <button
                    onClick={() => handleDemoSwitch('bhandari@vendersetu.edu.in')}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-emerald-50 hover:text-emerald-800 flex items-center justify-between"
                  >
                    <span>📚 Bhandari General Store</span>
                    <span className="text-[10px] text-slate-400">Library</span>
                  </button>
                  <button
                    onClick={() => handleDemoSwitch('devbhoomi@vendersetu.edu.in')}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-emerald-50 hover:text-emerald-800 flex items-center justify-between"
                  >
                    <span>🛒 Devbhoomi General Store</span>
                    <span className="text-[10px] text-slate-400">Sector 2</span>
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button
                    onClick={() => handleDemoSwitch('admin@vendersetu.edu.in')}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-purple-50 text-purple-700 font-medium"
                  >
                    🛡️ Campus Administrator
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Header Row - Logo: VenderSetu */}
      <div className="border-b border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 sm:gap-8">
          {/* Brand Logo: VenderSetu */}
          <Link to="/" className="flex items-center space-x-2.5 shrink-0 group">
            {/* Orange Carrot / Leaf Badge */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-700/20 group-hover:scale-105 transition-transform">
              <span className="text-lg select-none">🥕</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-none">
                Vender<span className="text-emerald-700 font-extrabold">Setu</span>
              </span>
              <span className="text-[9.5px] text-slate-400 font-medium tracking-wide">
                Your Campus, Your Stores, Connected.
              </span>
            </div>
          </Link>

          {/* College Campus Delivery Location Dropdown */}
          <div className="relative hidden lg:block shrink-0">
            <button
              type="button"
              onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
              className="flex items-center space-x-2 text-left py-1 px-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-700">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="leading-tight">
                <span className="text-[10px] text-slate-400 block font-medium">Deliver to Campus:</span>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  {selectedCity}
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </span>
              </div>
            </button>

            {locationDropdownOpen && (
              <div
                className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50"
                onMouseLeave={() => setLocationDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Campus Delivery Point
                </div>
                {campusDeliveryLocations.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => handleLocationSelect(loc)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 ${
                      selectedCity === loc ? 'text-emerald-700 font-bold bg-emerald-50/50' : 'text-slate-700'
                    }`}
                  >
                    <span>📍 {loc}</span>
                    {selectedCity === loc && <span className="text-emerald-600 text-xs">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-xl relative"
          >
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Maggi, samosas, Kurkure, burgers, chai, notebooks, snacks..."
                value={internalSearch}
                onChange={(e) => {
                  setInternalSearch(e.target.value);
                  if (onSearchChange) onSearchChange(e.target.value);
                }}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white text-slate-800 placeholder:text-slate-400 rounded-full text-xs sm:text-sm border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none transition-all"
              />
              {internalSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setInternalSearch('');
                    if (onSearchChange) onSearchChange('');
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </form>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-3 shrink-0">
            {/* Cart Button */}
            <Link
              to="/cart"
              className="relative w-10 h-10 rounded-full bg-[#0d5435] hover:bg-[#073c24] text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-sm"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-4 h-4" />
              {cart.totalItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-xs border-2 border-white">
                  {cart.totalItemsCount}
                </span>
              )}
            </Link>

            {/* User Profile Avatar */}
            {user ? (
              <div className="flex items-center space-x-2">
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 p-1 rounded-full border-2 border-emerald-500/30 hover:border-emerald-500 transition-colors"
                  title={user.name}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={logout}
                  className="hidden sm:inline-flex p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                title="Sign In"
              >
                <UserIcon className="w-4 h-4" />
              </Link>
            )}

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Sub-Navigation Bar - Detailed Campus Links */}
      <div className="hidden md:block bg-white border-b border-slate-100 text-xs font-medium text-slate-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-10">
          {/* Left Campus Links */}
          <div className="flex items-center space-x-6">
            {/* Campus Stores Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setStoresDropdownOpen(!storesDropdownOpen)}
                className="flex items-center space-x-1 font-semibold text-slate-800 hover:text-emerald-700 transition-colors"
              >
                <Store className="w-3.5 h-3.5 text-emerald-600" />
                <span>Campus Stores</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {storesDropdownOpen && (
                <div
                  className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50"
                  onMouseLeave={() => setStoresDropdownOpen(false)}
                >
                  <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Official Campus Stores
                  </div>
                  <Link
                    to="/stores/college-canteen"
                    onClick={() => setStoresDropdownOpen(false)}
                    className="block px-3.5 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                  >
                    🏪 College Canteen (SAC)
                  </Link>
                  <Link
                    to="/stores/durga-fast-food"
                    onClick={() => setStoresDropdownOpen(false)}
                    className="block px-3.5 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                  >
                    🍔 Durga Fast Food (North Gate)
                  </Link>
                  <Link
                    to="/stores/monal-fast-food"
                    onClick={() => setStoresDropdownOpen(false)}
                    className="block px-3.5 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                  >
                    🥟 Monal Fast Food (Hostel 4)
                  </Link>
                  <Link
                    to="/stores/bhandari-general-store"
                    onClick={() => setStoresDropdownOpen(false)}
                    className="block px-3.5 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                  >
                    📚 Bhandari General Store (Library)
                  </Link>
                  <Link
                    to="/stores/devbhoomi-general-store"
                    onClick={() => setStoresDropdownOpen(false)}
                    className="block px-3.5 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
                  >
                    🛒 Devbhoomi General Store (Hostel Rd)
                  </Link>
                  <div className="border-t border-slate-100 my-1"></div>
                  <Link
                    to="/stores"
                    onClick={() => setStoresDropdownOpen(false)}
                    className="block px-3.5 py-1.5 text-xs text-emerald-700 font-bold hover:bg-emerald-50"
                  >
                    View All 5 Campus Stores →
                  </Link>
                </div>
              )}
            </div>

            {/* Categories Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setCategoriesDropdownOpen(!categoriesDropdownOpen)}
                className="flex items-center space-x-1 text-slate-700 hover:text-emerald-700 transition-colors"
              >
                <span>Categories</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {categoriesDropdownOpen && (
                <div
                  className="absolute left-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50"
                  onMouseLeave={() => setCategoriesDropdownOpen(false)}
                >
                  <Link
                    to="/categories"
                    onClick={() => setCategoriesDropdownOpen(false)}
                    className="block px-3.5 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 font-bold text-emerald-700"
                  >
                    Browse All Categories →
                  </Link>
                  <div className="border-t border-slate-100 my-1"></div>
                  <Link
                    to="/"
                    onClick={() => setCategoriesDropdownOpen(false)}
                    className="block px-3.5 py-1.5 text-xs text-slate-600 hover:bg-emerald-50"
                  >
                    Maggi & Fast Food
                  </Link>
                  <Link
                    to="/"
                    onClick={() => setCategoriesDropdownOpen(false)}
                    className="block px-3.5 py-1.5 text-xs text-slate-600 hover:bg-emerald-50"
                  >
                    Chai, Coffee & Drinks
                  </Link>
                  <Link
                    to="/"
                    onClick={() => setCategoriesDropdownOpen(false)}
                    className="block px-3.5 py-1.5 text-xs text-slate-600 hover:bg-emerald-50"
                  >
                    Kurkure, Chips & Biscuits
                  </Link>
                  <Link
                    to="/"
                    onClick={() => setCategoriesDropdownOpen(false)}
                    className="block px-3.5 py-1.5 text-xs text-slate-600 hover:bg-emerald-50"
                  >
                    Stationery & Registers
                  </Link>
                  <Link
                    to="/"
                    onClick={() => setCategoriesDropdownOpen(false)}
                    className="block px-3.5 py-1.5 text-xs text-slate-600 hover:bg-emerald-50"
                  >
                    Hostel Daily Essentials
                  </Link>
                </div>
              )}
            </div>

            <Link
              to="/compare"
              className="hover:text-emerald-700 transition-colors flex items-center space-x-1"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-amber-500" />
              <span>Compare Store Prices</span>
            </Link>

            <Link
              to="/stores"
              className="hover:text-emerald-700 transition-colors"
            >
              Hostel Delivery Status
            </Link>

            {/* Deals & Combos Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDealsDropdownOpen(!dealsDropdownOpen)}
                className="flex items-center space-x-1 text-slate-600 hover:text-emerald-700 transition-colors"
              >
                <span>Student Combos & Offers</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {dealsDropdownOpen && (
                <div
                  className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50"
                  onMouseLeave={() => setDealsDropdownOpen(false)}
                >
                  <div className="px-3 py-1.5 text-xs text-emerald-800 font-bold bg-emerald-50/70">
                    🔥 20% OFF First Campus Order
                  </div>
                  <div className="px-3 py-1.5 text-xs text-amber-800 font-bold bg-amber-50/70 mt-1">
                    ⚡ Free Delivery on orders &gt; ₹200
                  </div>
                  <div className="px-3 py-1.5 text-xs text-slate-700 font-medium hover:bg-slate-50 mt-1">
                    🥪 Burger + Cold Drink ₹70 (Durga)
                  </div>
                  <div className="px-3 py-1.5 text-xs text-slate-700 font-medium hover:bg-slate-50">
                    🥟 Veg Momos + Chai ₹60 (Monal)
                  </div>
                </div>
              )}
            </div>

            {isSeller && (
              <Link
                to="/seller"
                className="text-emerald-700 font-semibold hover:underline flex items-center space-x-1"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Seller Dashboard</span>
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                className="text-purple-700 font-semibold hover:underline flex items-center space-x-1"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Console</span>
              </Link>
            )}
          </div>

          {/* Right Campus Timings & Support */}
          <div className="flex items-center space-x-5 text-slate-500">
            <Link to="/stores" className="hover:text-slate-800 flex items-center space-x-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Store Timings</span>
            </Link>
            <span className="hover:text-slate-800 cursor-pointer">Hostel FAQs</span>
            <a
              href="mailto:campus@vendersetu.edu.in"
              className="hover:text-slate-800 flex items-center space-x-1 text-emerald-700 font-semibold"
            >
              <span>Campus Support</span>
            </a>
          </div>
        </div>
      </div>

      {/* 4. Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-lg">
          {/* Location on mobile */}
          <div className="flex items-center justify-between py-2 border-b border-slate-100 text-xs">
            <span className="text-slate-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              Delivery Location:
            </span>
            <select
              value={selectedCity}
              onChange={(e) => handleLocationSelect(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none"
            >
              {campusDeliveryLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 flex items-center space-x-2"
            >
              <Store className="w-4 h-4 text-emerald-600" />
              <span>All Products</span>
            </Link>
            <Link
              to="/stores"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 flex items-center space-x-2"
            >
              <Store className="w-4 h-4 text-emerald-600" />
              <span>5 Campus Stores</span>
            </Link>
            <Link
              to="/categories"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 flex items-center space-x-2"
            >
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Categories</span>
            </Link>
            <Link
              to="/compare"
              onClick={() => setMobileMenuOpen(false)}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 flex items-center space-x-2"
            >
              <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
              <span>Compare Prices</span>
            </Link>
          </div>

          {/* User & Demo Switch in Mobile */}
          <div className="pt-2 border-t border-slate-100 flex flex-col space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Switch Persona:</span>
              <button
                onClick={() => setDemoDropdownOpen(!demoDropdownOpen)}
                className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded"
              >
                Demo Roles ▾
              </button>
            </div>

            {demoDropdownOpen && (
              <div className="bg-slate-50 rounded-xl p-2 space-y-1 text-xs">
                <button
                  onClick={() => handleDemoSwitch('student@vendersetu.edu.in')}
                  className="w-full text-left py-1 text-slate-700 font-medium"
                >
                  🎓 Rahul Sharma (Student)
                </button>
                <button
                  onClick={() => handleDemoSwitch('canteen@vendersetu.edu.in')}
                  className="w-full text-left py-1 text-slate-700"
                >
                  🏪 College Canteen
                </button>
                <button
                  onClick={() => handleDemoSwitch('durga@vendersetu.edu.in')}
                  className="w-full text-left py-1 text-slate-700"
                >
                  🍔 Durga Fast Food
                </button>
                <button
                  onClick={() => handleDemoSwitch('monal@vendersetu.edu.in')}
                  className="w-full text-left py-1 text-slate-700"
                >
                  🥟 Monal Fast Food
                </button>
                <button
                  onClick={() => handleDemoSwitch('bhandari@vendersetu.edu.in')}
                  className="w-full text-left py-1 text-slate-700"
                >
                  📚 Bhandari General Store
                </button>
                <button
                  onClick={() => handleDemoSwitch('devbhoomi@vendersetu.edu.in')}
                  className="w-full text-left py-1 text-slate-700"
                >
                  🛒 Devbhoomi General Store
                </button>
                <button
                  onClick={() => handleDemoSwitch('admin@vendersetu.edu.in')}
                  className="w-full text-left py-1 text-purple-700 font-semibold"
                >
                  🛡️ Administrator
                </button>
              </div>
            )}

            {user ? (
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs">
                  <p className="font-bold text-slate-900">{user.name}</p>
                  <p className="text-[10px] text-slate-500">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-xs text-rose-600 font-semibold px-2 py-1 rounded bg-rose-50"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center bg-[#0d5435] text-white py-2 rounded-xl text-xs font-bold"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
