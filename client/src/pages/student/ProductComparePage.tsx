import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ArrowRightLeft,
  CheckCircle2,
  TrendingDown,
  ShoppingCart,
  Store as StoreIcon,
  Sparkles,
  Search,
  Filter,
  Check,
  LayoutGrid,
  Table as TableIcon,
  Tag,
  ShieldCheck,
  ChevronRight,
  Info
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
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  // Filters & Controls
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'savings' | 'price_low' | 'name'>('savings');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);

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
      setJustAddedId(item._id);
      setTimeout(() => setJustAddedId(null), 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to add item to cart');
    } finally {
      setAddingId(null);
    }
  };

  // Categories extracted from available groups
  const availableCategories = ['all', ...Array.from(new Set(groups.map((g) => g.category.toLowerCase())))];

  // Total possible savings across all monitored items
  const totalPotentialSavings = groups.reduce((acc, curr) => acc + curr.priceDiff, 0);
  const maxSingleSaving = Math.max(...groups.map((g) => g.priceDiff), 0);

  // Filter groups
  const filteredGroups = groups.filter((g) => {
    const matchesSearch =
      searchTerm === '' ||
      g.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || g.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesStock = !inStockOnly || g.stores.some((s) => s.stock > 0);

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Sort groups
  const sortedGroups = [...filteredGroups].sort((a, b) => {
    if (sortBy === 'savings') return b.priceDiff - a.priceDiff;
    if (sortBy === 'price_low') return a.minPrice - b.minPrice;
    if (sortBy === 'name') return a.itemName.localeCompare(b.itemName);
    return 0;
  });

  // Extract all distinct store names for table view
  const storeNames = Array.from(
    new Set(groups.flatMap((g) => g.stores.map((s) => s.store?.name || 'Unknown Store')))
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-10 shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Smart Campus Price Intelligence</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight brand-font">
            Cross-Store Price Comparison
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
            Never overpay again on campus. Compare real-time prices for identical snacks, noodles,
            beverages, stationery, and daily essentials across all 5 campus vendors.
          </p>

          {/* Savings Metric Highlights */}
          <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <span className="text-2xl font-extrabold text-white">{groups.length}</span>
              <p className="text-[11px] text-slate-300">Comparable Product Groups</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
              <span className="text-2xl font-extrabold text-emerald-400">
                ₹{maxSingleSaving}
              </span>
              <p className="text-[11px] text-slate-300">Highest Single Item Saving</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 col-span-2 sm:col-span-1">
              <span className="text-2xl font-extrabold text-amber-300">
                ₹{totalPotentialSavings}
              </span>
              <p className="text-[11px] text-slate-300">Total Price Spread Tracked</p>
            </div>
          </div>
        </div>

        {/* Decorative blur */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Filter and View Controls Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search comparable items (e.g. Maggi, Kurkure, Lays, Classmate)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
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

          {/* Sort & View Mode Controls */}
          <div className="flex items-center space-x-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="savings">Sort: Highest Savings First</option>
              <option value="price_low">Sort: Lowest Price First</option>
              <option value="name">Sort: Product Name (A-Z)</option>
            </select>

            {/* Layout Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 ${
                  viewMode === 'cards'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Cards Matrix View"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1 ${
                  viewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Spreadsheet Table View"
              >
                <TableIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills & Checkbox */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none max-w-full">
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors capitalize ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            ))}
          </div>

          <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-700 select-none shrink-0">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
            />
            <span>In-Stock Only</span>
          </label>
        </div>
      </div>

      {/* Comparison Content Display */}
      {loading ? (
        <div className="py-24 text-center space-y-4">
          <div className="inline-block w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Cross-referencing live pricing data from College Canteen, Durga, Monal, Bhandari, and Devbhoomi...
          </p>
        </div>
      ) : sortedGroups.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3 shadow-xs">
          <ArrowRightLeft className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">No Comparable Items Found</h2>
          <p className="text-xs text-slate-500">
            No products match your current search or category filter. Try clearing your search.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setInStockOnly(false);
            }}
            className="mt-2 inline-block px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* CARDS MATRIX VIEW */
        <div className="space-y-6">
          {sortedGroups.map((group) => {
            const isHighlighted = highlightKey && group.groupKey.includes(highlightKey);

            return (
              <div
                key={group.groupKey}
                className={`bg-white rounded-3xl border transition-all overflow-hidden ${
                  isHighlighted
                    ? 'border-indigo-500 ring-4 ring-indigo-100 shadow-lg'
                    : 'border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                {/* Comparison Card Header */}
                <div className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    {group.image ? (
                      <img
                        src={group.image}
                        alt={group.itemName}
                        className="w-16 h-16 rounded-2xl object-cover border border-slate-200 bg-white shadow-2xs"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                        <Tag className="w-6 h-6" />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full">
                          {group.category}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">{group.brand}</span>
                      </div>
                      <h2 className="text-lg font-bold text-slate-900 mt-1">{group.itemName}</h2>
                      <p className="text-xs text-slate-500">Unit: {group.unit}</p>
                    </div>
                  </div>

                  {/* Savings Badge */}
                  {group.priceDiff > 0 ? (
                    <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-2 rounded-2xl text-xs font-bold shadow-2xs self-start sm:self-auto">
                      <TrendingDown className="w-4 h-4 text-emerald-600" />
                      <span>Save ₹{group.priceDiff} with lowest store</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center space-x-1.5 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-2xl text-xs font-semibold self-start sm:self-auto">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Identical price across stores</span>
                    </div>
                  )}
                </div>

                {/* Store comparison items grid */}
                <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.stores.map((item) => {
                    const isLowest = item.sellingPrice === group.minPrice && group.priceDiff > 0;
                    const diffFromMin = item.sellingPrice - group.minPrice;
                    const isJustAdded = justAddedId === item._id;

                    return (
                      <div
                        key={item._id}
                        className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
                          isLowest
                            ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-200'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Store Name and Lowest Price Badge */}
                          <div className="flex items-center justify-between">
                            <Link
                              to={`/stores/${item.store.slug}`}
                              className="font-bold text-xs text-slate-800 hover:text-indigo-600 flex items-center space-x-1.5 truncate max-w-[180px]"
                            >
                              <StoreIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">{item.store.name}</span>
                            </Link>

                            {isLowest && (
                              <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-2xs">
                                Best Price
                              </span>
                            )}
                          </div>

                          {/* Price Tag */}
                          <div className="flex items-baseline space-x-2">
                            <span className="text-2xl font-extrabold text-slate-900">
                              ₹{item.sellingPrice}
                            </span>
                            <span className="text-xs text-slate-400">/ {item.unit}</span>

                            {diffFromMin > 0 && (
                              <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-100">
                                +₹{diffFromMin}
                              </span>
                            )}
                          </div>

                          {/* Inventory & Open Status */}
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
                              {item.store.isOpen ? 'Store Open' : 'Store Closed'}
                            </span>
                          </div>
                        </div>

                        {/* Card bottom footer */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] text-slate-500">
                            {item.store.offersDelivery
                              ? `Delivery ₹${item.store.deliveryFee}`
                              : 'Pickup only'}
                          </span>

                          <button
                            onClick={() => handleAddToCart(item)}
                            disabled={!item.isAvailable || item.stock <= 0 || addingId === item._id}
                            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                              isJustAdded
                                ? 'bg-emerald-600 text-white'
                                : item.stock <= 0
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : isLowest
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                                : 'bg-slate-800 hover:bg-slate-900 text-white shadow-sm'
                            }`}
                          >
                            {isJustAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Added!</span>
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span>{item.stock <= 0 ? 'Sold Out' : 'Add to Cart'}</span>
                              </>
                            )}
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
      ) : (
        /* SPREADSHEET TABLE VIEW */
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="py-4 px-5">Product & Category</th>
                  <th className="py-4 px-3">Unit</th>
                  <th className="py-4 px-3">Lowest Price</th>
                  <th className="py-4 px-3">Highest Price</th>
                  <th className="py-4 px-3">Potential Savings</th>
                  <th className="py-4 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedGroups.map((group) => {
                  const lowestItem = group.stores.find((s) => s.sellingPrice === group.minPrice);

                  return (
                    <tr key={group.groupKey} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center space-x-3">
                          {group.image && (
                            <img
                              src={group.image}
                              alt={group.itemName}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-white shrink-0"
                            />
                          )}
                          <div>
                            <p className="font-bold text-slate-900">{group.itemName}</p>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                              {group.category} • {group.brand}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-slate-600 font-medium">{group.unit}</td>

                      <td className="py-3.5 px-3">
                        <div className="space-y-0.5">
                          <span className="font-extrabold text-emerald-700 text-sm">
                            ₹{group.minPrice}
                          </span>
                          {lowestItem && (
                            <p className="text-[10px] text-slate-500 truncate max-w-[120px]">
                              at {lowestItem.store.name}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 font-semibold text-slate-700">₹{group.maxPrice}</td>

                      <td className="py-3.5 px-3">
                        {group.priceDiff > 0 ? (
                          <span className="inline-flex items-center space-x-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            <TrendingDown className="w-3 h-3" />
                            <span>Save ₹{group.priceDiff}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">Same price</span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        {lowestItem && (
                          <button
                            onClick={() => handleAddToCart(lowestItem)}
                            disabled={!lowestItem.isAvailable || lowestItem.stock <= 0}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Add Lowest (₹{lowestItem.sellingPrice})</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Information Banner */}
      <div className="bg-slate-900 text-slate-200 p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-3">
        <div className="flex items-center space-x-2 text-white">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-base brand-font">Campus Price Transparency Guarantee</h3>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
          All prices shown are fetched directly from merchant cash-registers and live kitchen
          inventories. Merchants may set differing prices according to prepared portion size, bulk
          institutional sourcing, or specific supplier discounts. You always get the live guaranteed
          rate at checkout.
        </p>
      </div>
    </div>
  );
};
