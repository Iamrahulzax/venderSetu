import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Layers,
  Search,
  Filter,
  Sparkles,
  ArrowUpDown,
  ShoppingBag,
  Store as StoreIcon,
  CheckCircle2,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { ProductCard, ProductItem } from '../../components/ProductCard';

interface CategoryMeta {
  id: string;
  name: string;
  desc: string;
  icon: string;
  color: string;
  bannerBg: string;
}

export const CategoriesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [vegOnly, setVegOnly] = useState<boolean>(false);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'price_asc' | 'price_desc' | 'name'>('relevance');

  const categoriesList: CategoryMeta[] = [
    {
      id: 'all',
      name: 'All Categories',
      desc: 'Browse complete inventory across all campus shops and canteens',
      icon: '🛍️',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      bannerBg: 'from-emerald-900 to-teal-950'
    },
    {
      id: 'kurkure',
      name: 'Kurkure & Puffs',
      desc: 'Tedha Medha, Masala Munch, Chilli Chatka, Puffcorn snacks',
      icon: '🌶️',
      color: 'bg-amber-50 border-amber-200 text-amber-900',
      bannerBg: 'from-amber-900 to-orange-950'
    },
    {
      id: 'chips',
      name: 'Chips & Crisps',
      desc: 'Lays American Cream & Onion, Classic Salted, Balaji Wafers',
      icon: '🥔',
      color: 'bg-yellow-50 border-yellow-200 text-yellow-900',
      bannerBg: 'from-yellow-900 to-amber-950'
    },
    {
      id: 'maggi',
      name: 'Maggi & Instant Meals',
      desc: '2-Minute Masala noodles, cheese & butter prepared canteen bowls',
      icon: '🍜',
      color: 'bg-orange-50 border-orange-200 text-orange-900',
      bannerBg: 'from-orange-900 to-red-950'
    },
    {
      id: 'fast food',
      name: 'Campus Fast Food',
      desc: 'Crispy burgers, kathi rolls, steamed momos, grilled sandwiches',
      icon: '🍔',
      color: 'bg-rose-50 border-rose-200 text-rose-900',
      bannerBg: 'from-rose-900 to-red-950'
    },
    {
      id: 'cold drinks',
      name: 'Cold Drinks & Beverages',
      desc: 'Chilled Coke, Sprite, Frooti, energy drinks, fruit juices and water',
      icon: '🥤',
      color: 'bg-sky-50 border-sky-200 text-sky-900',
      bannerBg: 'from-sky-900 to-cyan-950'
    },
    {
      id: 'chocolates',
      name: 'Chocolates & Treats',
      desc: 'Cadbury Dairy Milk Silk, 5-Star, KitKat, Munch, Perk and gems',
      icon: '🍫',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      bannerBg: 'from-teal-900 to-emerald-950'
    },
    {
      id: 'biscuits',
      name: 'Biscuits & Cookies',
      desc: 'Parle-G, Bourbon, Oreo, Good Day tea-time companions and rusks',
      icon: '🍪',
      color: 'bg-amber-50 border-amber-200 text-amber-900',
      bannerBg: 'from-amber-900 to-stone-900'
    },
    {
      id: 'noodles',
      name: 'Noodles & Chowmein',
      desc: 'Desi wok-tossed Hakka chowmein, schezwan noodles and spicy ramen',
      icon: '🥢',
      color: 'bg-red-50 border-red-200 text-red-900',
      bannerBg: 'from-red-900 to-stone-900'
    },
    {
      id: 'stationery',
      name: 'Campus Stationery',
      desc: 'Classmate A4 notebooks, gel pens, highlighters, lab manuals & files',
      icon: '📚',
      color: 'bg-blue-50 border-blue-200 text-blue-900',
      bannerBg: 'from-blue-900 to-indigo-950'
    },
    {
      id: 'groceries',
      name: 'Groceries & Pantry',
      desc: 'Amul toned milk, packaged bread, butter, tea bags, coffee powder',
      icon: '🥛',
      color: 'bg-teal-50 border-teal-200 text-teal-900',
      bannerBg: 'from-teal-900 to-slate-900'
    },
    {
      id: 'daily essentials',
      name: 'Hostel Daily Essentials',
      desc: 'Dettol soaps, toothpaste, detergents, tissues, shampoos, body wash',
      icon: '🧼',
      color: 'bg-cyan-50 border-cyan-200 text-cyan-900',
      bannerBg: 'from-cyan-900 to-slate-900'
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsRes, storesRes] = await Promise.all([
          apiRequest('/products?limit=250'),
          apiRequest('/stores')
        ]);

        if (productsRes.success && productsRes.products) {
          setProducts(productsRes.products);
        }
        if (storesRes.success && storesRes.stores) {
          setStores(storesRes.stores);
        }
      } catch (err) {
        console.error('Failed to load categories catalog', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    if (catId === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', catId);
    }
    setSearchParams(searchParams);
  };

  const activeCategoryMeta =
    categoriesList.find((c) => c.id.toLowerCase() === selectedCategory.toLowerCase()) ||
    categoriesList[0];

  // Filter and sort products
  const filteredProducts = products.filter((p) => {
    // Category match
    const matchesCat =
      selectedCategory === 'all' ||
      p.category.toLowerCase() === selectedCategory.toLowerCase() ||
      p.category.toLowerCase().includes(selectedCategory.toLowerCase());

    if (!matchesCat) return false;

    // Search query match
    const matchesSearch =
      searchTerm === '' ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // Store filter
    if (selectedStore !== 'all') {
      const pStoreId = (p.store as any)?._id || (p.store as any)?.slug || p.store;
      const pStoreSlug = (p.store as any)?.slug;
      if (pStoreId !== selectedStore && pStoreSlug !== selectedStore) {
        return false;
      }
    }

    // Veg filter
    if (vegOnly && p.isVeg === false) {
      return false;
    }

    // In-stock filter
    if (inStockOnly && p.stock <= 0) {
      return false;
    }

    return true;
  });

  // Sort
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price_asc') return a.sellingPrice - b.sellingPrice;
    if (sortBy === 'price_desc') return b.sellingPrice - a.sellingPrice;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  return (
    <div className="space-y-8 pb-20">
      {/* Category Hero Banner */}
      <div
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${activeCategoryMeta.bannerBg} text-white p-6 sm:p-10 shadow-xl border border-white/10 transition-colors duration-500`}
      >
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md">
            <span className="text-base">{activeCategoryMeta.icon}</span>
            <span>Category Explorer</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight brand-font flex items-center gap-3">
            <span>{activeCategoryMeta.name}</span>
          </h1>

          <p className="text-slate-200 text-xs sm:text-sm leading-relaxed max-w-2xl">
            {activeCategoryMeta.desc}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            <span className="bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 font-medium">
              Showing {sortedProducts.length} items
            </span>
            <span className="bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 font-medium">
              {stores.length} Campus Shops
            </span>
          </div>
        </div>

        {/* Ambient glow */}
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      </div>

      {/* Category Pills Bar (Horizontal Scrollable) */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {categoriesList.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.id.toLowerCase();
            const count =
              cat.id === 'all'
                ? products.length
                : products.filter((p) => p.category.toLowerCase().includes(cat.id.toLowerCase())).length;

            return (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-md scale-102'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                <span>{cat.name}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search in Category */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search in ${activeCategoryMeta.name}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Store Filter Dropdown */}
          <div className="flex items-center space-x-2">
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="all">All Stores</option>
              {stores.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="relevance">Sort: Recommended</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Quick Toggle Checkboxes */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-700 select-none">
            <input
              type="checkbox"
              checked={vegOnly}
              onChange={(e) => setVegOnly(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
            />
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>Veg Only</span>
            </span>
          </label>

          <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-700 select-none">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
            />
            <span>In Stock Only</span>
          </label>

          {(selectedStore !== 'all' || vegOnly || inStockOnly || searchTerm) && (
            <button
              onClick={() => {
                setSelectedStore('all');
                setVegOnly(false);
                setInStockOnly(false);
                setSearchTerm('');
              }}
              className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="py-24 text-center space-y-4">
          <div className="inline-block w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Fetching {activeCategoryMeta.name} catalogue across campus...
          </p>
        </div>
      ) : sortedProducts.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3 shadow-xs">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">No Products Found</h2>
          <p className="text-xs text-slate-500">
            No items in "{activeCategoryMeta.name}" match your current filters. Try resetting the filters or switching categories.
          </p>
          <button
            onClick={() => {
              setSelectedStore('all');
              setVegOnly(false);
              setInStockOnly(false);
              setSearchTerm('');
              handleSelectCategory('all');
            }}
            className="mt-2 inline-block px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Show All Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedProducts.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};
