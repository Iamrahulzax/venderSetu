import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Store as StoreIcon,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Clock,
  Bike,
  Filter,
  CheckCircle2,
  ArrowRightLeft
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { ProductCard, ProductItem } from '../../components/ProductCard';

export const HomePage: React.FC = () => {
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'All Items' },
    { id: 'kurkure', name: 'Kurkure' },
    { id: 'chips', name: 'Chips & Crisps' },
    { id: 'maggi', name: 'Maggi' },
    { id: 'fast food', name: 'Fast Food' },
    { id: 'cold drinks', name: 'Cold Drinks' },
    { id: 'chocolates', name: 'Chocolates' },
    { id: 'biscuits', name: 'Biscuits' },
    { id: 'noodles', name: 'Noodles' },
    { id: 'stationery', name: 'Stationery' },
    { id: 'groceries', name: 'Groceries' },
    { id: 'daily essentials', name: 'Daily Essentials' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [storesData, productsData] = await Promise.all([
          apiRequest('/stores'),
          apiRequest('/products?limit=100')
        ]);

        if (storesData.success) {
          setStores(storesData.stores);
        }
        if (productsData.success) {
          setProducts(productsData.products);
        }
      } catch (err) {
        console.error('Failed to load homepage data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter products based on search, category, store, and availability
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      searchTerm === '' ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || p.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesStore =
      selectedStore === 'all' ||
      p.store._id === selectedStore ||
      p.store.slug === selectedStore;

    const matchesAvailability =
      availabilityFilter === 'all' ||
      (availabilityFilter === 'in_stock' && p.stock > 0) ||
      (availabilityFilter === 'low_stock' && p.stock > 0 && p.stock <= p.lowStockThreshold) ||
      (availabilityFilter === 'out_of_stock' && p.stock <= 0);

    return matchesSearch && matchesCategory && matchesStore && matchesAvailability;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Campus Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-6 sm:p-10 shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official Campus Marketplace</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Your Campus, Your Stores, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Connected in Real-Time.
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            Order from the College Canteen, Durga & Monal Fast Food, Bhandari and Devbhoomi
            General Stores with real-time stock sync, multi-store checkout, and hostel delivery.
          </p>

          {/* Search bar */}
          <div className="pt-2 flex flex-col sm:flex-row gap-2 max-w-xl">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search chips, Maggi, Kurkure, burgers, notebooks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-slate-900 rounded-2xl text-sm placeholder:text-slate-400 border border-white/15 focus:border-emerald-500 outline-none transition-all backdrop-blur-sm"
              />
            </div>
            <Link
              to="/compare"
              className="inline-flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-2xl text-sm font-semibold transition-colors shadow-md shadow-emerald-600/30 shrink-0"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Compare Prices</span>
            </Link>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute right-0 top-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      </section>

      {/* 5 Official Campus Stores Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 brand-font">Campus Partner Stores</h2>
            <p className="text-xs text-slate-500">Live operational status and pickup/delivery options</p>
          </div>
          <Link
            to="/stores"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {stores.map((store) => (
            <Link
              key={store._id}
              to={`/stores/${store.slug}`}
              className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all group flex flex-col justify-between overflow-hidden"
            >
              {store.bannerImage && (
                <div className="h-28 w-full relative overflow-hidden bg-slate-100">
                  <img
                    src={store.bannerImage}
                    alt={store.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
                  <span
                    className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md shadow-sm ${
                      store.isOpen
                        ? 'bg-emerald-500/90 text-white'
                        : 'bg-slate-900/80 text-rose-300'
                    }`}
                  >
                    {store.isOpen ? 'Open Now' : 'Closed'}
                  </span>
                </div>
              )}
              <div className="p-4 flex flex-col justify-between flex-1">
                <div>
                  {!store.bannerImage && (
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
                        <StoreIcon className="w-4 h-4" />
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          store.isOpen
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {store.isOpen ? 'Open Now' : 'Closed'}
                      </span>
                    </div>
                  )}

                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors line-clamp-1">
                    {store.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{store.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-[11px] text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1 text-slate-400">
                      <Clock className="w-3 h-3" />
                      <span>Prep Time</span>
                    </span>
                    <span className="font-medium text-slate-700">{store.estimatedPrepTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center space-x-1 text-slate-400">
                      <Bike className="w-3 h-3" />
                      <span>Delivery</span>
                    </span>
                    <span className="font-medium text-slate-700">
                      {store.offersDelivery ? `₹${store.deliveryFee}` : 'Pickup Only'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Category Pills & Filters */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 brand-font">Explore Catalogue</h2>
          <div className="flex items-center space-x-2">
            {/* Filter by store */}
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="text-xs font-medium bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Stores</option>
              {stores.map((s) => (
                <option key={s._id} value={s.slug}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Filter by availability */}
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="text-xs font-medium bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Availability</option>
              <option value="in_stock">In Stock Only</option>
              <option value="low_stock">Low Stock Warnings</option>
              <option value="out_of_stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Categories scroll row */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </section>

      {/* Product Grid */}
      <section>
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Loading live campus catalog...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No items match your criteria</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search keywords, category pills, or store filters.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedStore('all');
                setAvailabilityFilter('all');
              }}
              className="text-xs font-semibold text-emerald-700 hover:underline pt-2"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>Showing {filteredProducts.length} items available across stores</span>
              <span className="flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Synchronized with live store inventories</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
