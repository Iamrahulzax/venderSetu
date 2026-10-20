import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Store as StoreIcon,
  Clock,
  Bike,
  MapPin,
  Phone,
  ArrowRight,
  CheckCircle2,
  Search,
  Sparkles,
  ShoppingBag,
  Star,
  Coffee,
  BookOpen,
  ShoppingBasket,
  Zap,
  Info
} from 'lucide-react';
import { apiRequest } from '../../services/api';

export const StoresPage: React.FC = () => {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'food' | 'general' | 'delivery'>('all');

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        const data = await apiRequest('/stores');
        if (data.success) {
          setStores(data.stores);
        }
      } catch (err) {
        console.error('Failed to load stores', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  // Filter stores based on search and selected filter tab
  const filteredStores = stores.filter((store) => {
    const matchesSearch =
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.location.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeFilter === 'open') return store.isOpen;
    if (activeFilter === 'delivery') return store.offersDelivery;
    if (activeFilter === 'food') {
      const foodSlugs = ['college-canteen', 'durga-fast-food', 'monal-fast-food'];
      return foodSlugs.includes(store.slug) || store.storeType === 'food';
    }
    if (activeFilter === 'general') {
      const generalSlugs = ['bhandari-general-store', 'devbhoomi-general-store'];
      return generalSlugs.includes(store.slug) || store.storeType === 'general';
    }

    return true;
  });

  const getStoreTheme = (slug: string) => {
    switch (slug) {
      case 'college-canteen':
        return {
          icon: Coffee,
          tag: 'Central Food Hub',
          badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
          gradient: 'from-amber-500 to-orange-600',
          popular: ['Samosas & Tea', 'Chole Bhature', 'Cold Coffee', 'Thali Meals']
        };
      case 'durga-fast-food':
        return {
          icon: Sparkles,
          tag: 'Fast Food & Grills',
          badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
          gradient: 'from-rose-500 to-red-600',
          popular: ['Veg Burgers', 'Paneer Kathi Roll', 'Crispy Fries', 'Sandwiches']
        };
      case 'monal-fast-food':
        return {
          icon: Zap,
          tag: 'Momos & Chinese',
          badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          gradient: 'from-indigo-500 to-purple-600',
          popular: ['Steamed Momos', 'Hakka Noodles', 'Fried Momos', 'Chilli Paneer']
        };
      case 'bhandari-general-store':
        return {
          icon: BookOpen,
          tag: 'Stationery & Academics',
          badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
          gradient: 'from-blue-600 to-sky-700',
          popular: ['Classmate Notebooks', 'Gel Pens & Files', 'Scientific Calc', 'Snacks']
        };
      case 'devbhoomi-general-store':
        return {
          icon: ShoppingBasket,
          tag: 'Hostel Daily Essentials',
          badgeBg: 'bg-teal-100 text-teal-800 border-teal-200',
          gradient: 'from-teal-600 to-emerald-700',
          popular: ['Detergent & Soaps', 'Biscuits & Milk', 'Shampoo & Paste', 'Midnight Munchies']
        };
      default:
        return {
          icon: StoreIcon,
          tag: 'Campus Merchant',
          badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          gradient: 'from-emerald-600 to-teal-700',
          popular: ['Snacks', 'Beverages', 'Essentials']
        };
    }
  };

  const openStoresCount = stores.filter((s) => s.isOpen).length;

  return (
    <div className="space-y-8 pb-20">
      {/* Hero Banner Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 text-white p-6 sm:p-10 shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Campus Merchant Network</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight brand-font">
            Campus Stores & Canteens
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
            Explore all 5 authorized campus shops operating with live synchronized inventory,
            counter pickup, and fast hostel room delivery. Each vendor runs an independent fulfillment queue.
          </p>

          {/* Quick Metrics Bar */}
          <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <span className="text-xl sm:text-2xl font-extrabold text-white">
                {stores.length || 5}
              </span>
              <p className="text-[11px] text-slate-300">Partner Merchants</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-400">
                {openStoresCount} / {stores.length || 5}
              </span>
              <p className="text-[11px] text-slate-300">Open Right Now</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <span className="text-xl sm:text-2xl font-extrabold text-teal-300">10-20m</span>
              <p className="text-[11px] text-slate-300">Avg. Preparation</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <span className="text-xl sm:text-2xl font-extrabold text-amber-300">1 Cart</span>
              <p className="text-[11px] text-slate-300">Multi-Store Checkout</p>
            </div>
          </div>
        </div>

        {/* Decorative blur elements */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute left-1/2 bottom-0 -mb-10 w-60 h-60 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />
      </div>

      {/* Search and Category Filter Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search stores by name, location, or food special..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Stores ({stores.length})
          </button>
          <button
            onClick={() => setActiveFilter('open')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center space-x-1 ${
              activeFilter === 'open'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Open Now ({openStoresCount})</span>
          </button>
          <button
            onClick={() => setActiveFilter('food')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              activeFilter === 'food'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🍔 Food & Canteens
          </button>
          <button
            onClick={() => setActiveFilter('general')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              activeFilter === 'general'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            📚 Stationery & Essentials
          </button>
          <button
            onClick={() => setActiveFilter('delivery')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              activeFilter === 'delivery'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            🚀 Hostel Delivery
          </button>
        </div>
      </div>

      {/* Stores Content Area */}
      {loading ? (
        <div className="py-24 text-center space-y-4">
          <div className="inline-block w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Contacting campus store servers and fetching live catalogs...
          </p>
        </div>
      ) : filteredStores.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3 shadow-xs">
          <StoreIcon className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">No Stores Found</h2>
          <p className="text-xs text-slate-500">
            No campus stores match your search criteria. Try removing filters or changing your search.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setActiveFilter('all');
            }}
            className="mt-2 inline-block px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store) => {
            const theme = getStoreTheme(store.slug);
            const ThemeIcon = theme.icon;

            return (
              <div
                key={store._id}
                className="bg-white rounded-3xl border border-slate-200 hover:border-emerald-300 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
              >
                {/* Store Top Graphic Banner */}
                <div className={`p-6 bg-gradient-to-r ${theme.gradient} text-white relative`}>
                  <div className="flex items-start justify-between relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner group-hover:scale-105 transition-transform">
                      <ThemeIcon className="w-6 h-6" />
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center space-x-1.5 text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md ${
                          store.isOpen
                            ? 'bg-emerald-500/90 text-white shadow-sm'
                            : 'bg-slate-900/80 text-rose-300'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            store.isOpen ? 'bg-white animate-pulse' : 'bg-rose-400'
                          }`}
                        />
                        <span>{store.isOpen ? 'Open Now' : 'Closed'}</span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 relative z-10">
                    <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-black/20 text-white/90">
                      {theme.tag}
                    </span>
                    <h2 className="text-xl font-bold tracking-tight text-white mt-1">
                      {store.name}
                    </h2>
                  </div>

                  {/* Visual decoration circle */}
                  <div className="absolute right-0 bottom-0 -mb-6 -mr-6 w-28 h-28 rounded-full bg-white/10 blur-xl pointer-events-none" />
                </div>

                {/* Store Body Details */}
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {store.description}
                    </p>

                    {/* Operational Highlights Box */}
                    <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs text-slate-600">
                      <div className="flex items-center space-x-2.5">
                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-medium text-slate-800 truncate">
                          {store.location}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2.5">
                        <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{store.openingHours}</span>
                      </div>
                      <div className="flex items-center space-x-2.5">
                        <Bike className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>
                          {store.offersDelivery
                            ? `Hostel delivery (₹${store.deliveryFee}) • Min order ₹${store.minimumOrder}`
                            : 'Counter pickup only'}
                        </span>
                      </div>
                      {store.contactPhone && (
                        <div className="flex items-center space-x-2.5">
                          <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{store.contactPhone}</span>
                        </div>
                      )}
                    </div>

                    {/* Popular Items Badges */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Popular Specialties
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {theme.popular.map((item, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-lg transition-colors"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-xs">
                      <span className="font-bold text-emerald-700">
                        {store.productCount || 0}+
                      </span>
                      <span className="text-slate-400 ml-1">Live Items</span>
                    </div>

                    <Link
                      to={`/stores/${store.slug}`}
                      className="inline-flex items-center space-x-1.5 bg-slate-900 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm hover:shadow-emerald-600/20 group-hover:translate-x-0.5"
                    >
                      <span>Explore Menu & Shop</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Campus Store Location Guide & Policies */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 rounded-3xl border border-emerald-100 p-6 sm:p-8 space-y-4">
        <div className="flex items-center space-x-2 text-emerald-900">
          <Info className="w-5 h-5 text-emerald-700" />
          <h3 className="font-bold text-base brand-font">Campus Order & Pickup Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="bg-white/80 p-4 rounded-2xl border border-emerald-100/60 shadow-2xs">
            <h4 className="font-bold text-slate-900 mb-1">Self-Pickup Token</h4>
            <p>
              Present your Digital Order ID at the designated counter of the canteen or shop.
              Real-time SMS/web ping informs you when your packaging is ready.
            </p>
          </div>
          <div className="bg-white/80 p-4 rounded-2xl border border-emerald-100/60 shadow-2xs">
            <h4 className="font-bold text-slate-900 mb-1">Hostel Room Delivery</h4>
            <p>
              Participating stores deliver directly to Boys and Girls hostel common gates and
              designated security counters between 8:00 AM and 10:00 PM daily.
            </p>
          </div>
          <div className="bg-white/80 p-4 rounded-2xl border border-emerald-100/60 shadow-2xs">
            <h4 className="font-bold text-slate-900 mb-1">Unified Multi-Store Cart</h4>
            <p>
              You can put snacks from Durga Fast Food and notebooks from Bhandari in the same
              checkout. Each shop automatically receives its distinct suborder.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
