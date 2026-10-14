import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Store as StoreIcon,
  MapPin,
  Clock,
  Bike,
  Phone,
  Search,
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { ProductCard, ProductItem } from '../../components/ProductCard';
import { useSocket } from '../../context/SocketContext';

export const StoreDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { joinStoreRoom, leaveStoreRoom } = useSocket();

  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchStoreAndProducts = async () => {
      try {
        setLoading(true);
        const [storeRes, productsRes] = await Promise.all([
          apiRequest(`/stores/${slug}`),
          apiRequest(`/products?storeId=${slug}&limit=100`)
        ]);

        if (storeRes.success && storeRes.store) {
          setStore(storeRes.store);
          joinStoreRoom(storeRes.store._id);
        }

        if (productsRes.success) {
          setProducts(productsRes.products);
        }
      } catch (err) {
        console.error('Error loading store details', err);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchStoreAndProducts();
    }

    return () => {
      if (store?._id) {
        leaveStoreRoom(store._id);
      }
    };
  }, [slug]);

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      searchTerm === '' ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || p.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading store profile and live catalogue...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Store Not Found</h2>
        <p className="text-xs text-slate-500">The store you requested does not exist or has been relocated.</p>
        <Link
          to="/stores"
          className="inline-flex items-center space-x-1.5 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Stores</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Back button */}
      <Link
        to="/stores"
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to All Stores</span>
      </Link>

      {/* Store Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xl shadow-sm">
                <StoreIcon className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-slate-900 brand-font">{store.name}</h1>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      store.isOpen
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {store.isOpen ? 'Open Now' : 'Closed'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{store.location}</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
              {store.description}
            </p>

            <div className="flex flex-wrap gap-4 pt-1 text-xs text-slate-600">
              <div className="flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{store.openingHours}</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Bike className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {store.offersDelivery
                    ? `Hostel Delivery (₹${store.deliveryFee}) • Prep: ${store.estimatedPrepTime}`
                    : 'Counter Pickup Only'}
                </span>
              </div>
              {store.contactPhone && (
                <div className="flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{store.contactPhone}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1.5 shrink-0 min-w-[200px]">
            <p className="font-semibold text-slate-800">Store Quick Facts</p>
            <p>• Catalogue size: {products.length} products</p>
            <p>• Min Order: ₹{store.minimumOrder || 0}</p>
            <p>• Multi-store cart ready</p>
          </div>
        </div>
      </div>

      {/* Filter and Search inside store */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search ${store.name}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Categories scroll row */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-500">
          No products found in this store matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
