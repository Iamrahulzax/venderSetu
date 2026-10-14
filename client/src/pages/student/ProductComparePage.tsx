import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ArrowRightLeft,
  CheckCircle2,
  TrendingDown,
  ShoppingCart,
  Store as StoreIcon,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

interface StoreComparisonItem {
  _id: string;
  name: string;
  brand: string;
  unit: string;
  category: string;
  image: string;
  sellingPrice: number;
  stock: number;
  isAvailable: boolean;
  store: {
    _id: string;
    name: string;
    slug: string;
    isOpen: boolean;
    deliveryFee: number;
    offersDelivery: boolean;
  };
}

interface ComparisonGroup {
  groupKey: string;
  itemName: string;
  brand: string;
  unit: string;
  category: string;
  image: string;
  minPrice: number;
  maxPrice: number;
  priceDiff: number;
  stores: StoreComparisonItem[];
}

export const ProductComparePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const highlightKey = searchParams.get('highlight');

  const { addToCart } = useCart();
  const { user } = useAuth();
  const [groups, setGroups] = useState<ComparisonGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchComparable = async () => {
      try {
        setLoading(true);
        const data = await apiRequest('/products/compare');
        if (data.success && data.groups) {
          setGroups(data.groups);
        }
      } catch (err) {
        console.error('Failed to load comparison data', err);
      } finally {
        setLoading(false);
      }
    };

    fetchComparable();
  }, []);

  const handleAddToCart = async (item: StoreComparisonItem) => {
    if (!user) {
      alert('Please sign in to add items to your cart.');
      return;
    }

    try {
      setAddingId(item._id);
      await addToCart(item._id, 1);
      alert(`Added "${item.name}" from ${item.store.name} to your cart!`);
    } catch (err: any) {
      alert(err.message || 'Failed to add item');
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full">
            <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-600" />
            <span>Smart Campus Price Comparison</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 brand-font">
            Compare Cross-Store Prices
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            See the exact price differences for identical snacks, beverages, stationery, and Maggi
            across the College Canteen, Durga Fast Food, Monal Fast Food, Bhandari, and Devbhoomi
            stores. Never overpay.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Scanning live campus catalogs for comparable products...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-500">
          No comparable products found at this moment.
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => {
            const isHighlighted = highlightKey && group.groupKey.includes(highlightKey);

            return (
              <div
                key={group.groupKey}
                className={`bg-white rounded-3xl border transition-all overflow-hidden ${
                  isHighlighted
                    ? 'border-emerald-500 ring-2 ring-emerald-100 shadow-md'
                    : 'border-slate-200 shadow-sm'
                }`}
              >
                {/* Comparison Card Header */}
                <div className="p-5 bg-slate-50/70 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3.5">
                    {group.image && (
                      <img
                        src={group.image}
                        alt={group.itemName}
                        className="w-14 h-14 rounded-2xl object-cover border border-slate-200 bg-white"
                      />
                    )}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-full">
                        {group.category} • {group.brand}
                      </span>
                      <h2 className="text-base font-bold text-slate-900 mt-0.5">{group.itemName}</h2>
                      <p className="text-xs text-slate-500">{group.unit}</p>
                    </div>
                  </div>

                  {group.priceDiff > 0 && (
                    <div className="inline-flex items-center space-x-2 bg-emerald-100 text-emerald-900 px-3 py-1.5 rounded-2xl text-xs font-semibold shrink-0">
                      <TrendingDown className="w-4 h-4 text-emerald-700" />
                      <span>Save up to ₹{group.priceDiff} across stores</span>
                    </div>
                  )}
                </div>

                {/* Stores Price Matrix Grid */}
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.stores.map((item) => {
                    const isLowest = item.sellingPrice === group.minPrice && group.priceDiff > 0;

                    return (
                      <div
                        key={item._id}
                        className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                          isLowest
                            ? 'bg-emerald-50/50 border-emerald-300'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Link
                              to={`/stores/${item.store.slug}`}
                              className="font-bold text-xs text-slate-800 hover:text-emerald-700 flex items-center space-x-1"
                            >
                              <StoreIcon className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{item.store.name}</span>
                            </Link>

                            {isLowest && (
                              <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                Best Price
                              </span>
                            )}
                          </div>

                          <div className="flex items-baseline space-x-2">
                            <span className="text-2xl font-extrabold text-slate-900">
                              ₹{item.sellingPrice}
                            </span>
                            <span className="text-[11px] text-slate-400">/ {item.unit}</span>
                          </div>

                          <div className="flex items-center space-x-2 text-[11px]">
                            <span
                              className={`font-semibold ${
                                item.stock > 0 ? 'text-emerald-700' : 'text-rose-600'
                              }`}
                            >
                              {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className={item.store.isOpen ? 'text-slate-600' : 'text-rose-600'}>
                              {item.store.isOpen ? 'Shop Open' : 'Shop Closed'}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500">
                            {item.store.offersDelivery
                              ? `Delivery ₹${item.store.deliveryFee}`
                              : 'Pickup only'}
                          </span>

                          <button
                            onClick={() => handleAddToCart(item)}
                            disabled={!item.isAvailable || item.stock <= 0 || addingId === item._id}
                            className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                              item.stock <= 0
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : isLowest
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                                : 'bg-slate-800 hover:bg-slate-700 text-white shadow-sm'
                            }`}
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>{item.stock <= 0 ? 'Out of stock' : 'Add to Cart'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
