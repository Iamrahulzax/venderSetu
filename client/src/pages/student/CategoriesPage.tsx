import React from 'react';
import { Link } from 'react-router-dom';
import {
  Cookie,
  Coffee,
  BookOpen,
  ShoppingBag,
  Sparkles,
  Zap,
  Package,
  Layers,
  ArrowRight
} from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const categoriesList = [
    {
      id: 'kurkure',
      name: 'Kurkure & Puffs',
      desc: 'Tedha Medha, Masala Munch, Chilli Chatka snacks',
      icon: '🌶️',
      color: 'bg-amber-50 border-amber-200 text-amber-900'
    },
    {
      id: 'chips',
      name: 'Chips & Crisps',
      desc: 'Lays American Cream & Onion, Classic Salted, Wafers',
      icon: '🥔',
      color: 'bg-yellow-50 border-yellow-200 text-yellow-900'
    },
    {
      id: 'maggi',
      name: 'Maggi & Instant Meals',
      desc: '2-Minute Masala noodles, cheese & butter prepared bowls',
      icon: '🍜',
      color: 'bg-orange-50 border-orange-200 text-orange-900'
    },
    {
      id: 'fast food',
      name: 'Campus Fast Food',
      desc: 'Crispy burgers, kathi rolls, steamed momos, sandwiches',
      icon: '🍔',
      color: 'bg-rose-50 border-rose-200 text-rose-900'
    },
    {
      id: 'cold drinks',
      name: 'Cold Drinks & Beverages',
      desc: 'Chilled Coke, Sprite, Frooti, energy drinks and water',
      icon: '🥤',
      color: 'bg-sky-50 border-sky-200 text-sky-900'
    },
    {
      id: 'chocolates',
      name: 'Chocolates & Treats',
      desc: 'Cadbury Dairy Milk Silk, 5-Star, KitKat, Munch',
      icon: '🍫',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-900'
    },
    {
      id: 'biscuits',
      name: 'Biscuits & Cookies',
      desc: 'Parle-G, Bourbon, Oreo, Good Day tea-time companions',
      icon: '🍪',
      color: 'bg-amber-50 border-amber-200 text-amber-900'
    },
    {
      id: 'noodles',
      name: 'Noodles & Chowmein',
      desc: 'Desi wok-tossed Hakka chowmein and spicy ramen',
      icon: '🥢',
      color: 'bg-red-50 border-red-200 text-red-900'
    },
    {
      id: 'stationery',
      name: 'Campus Stationery',
      desc: 'Classmate A4 notebooks, gel pens, highlighters, staples',
      icon: '📚',
      color: 'bg-blue-50 border-blue-200 text-blue-900'
    },
    {
      id: 'groceries',
      name: 'Groceries & Pantry',
      desc: 'Amul toned milk, packaged bread, butter, tea bags',
      icon: '🥛',
      color: 'bg-teal-50 border-teal-200 text-teal-900'
    },
    {
      id: 'daily essentials',
      name: 'Hostel Daily Essentials',
      desc: 'Dettol soaps, toothpaste, detergents, tissues, shampoos',
      icon: '🧼',
      color: 'bg-cyan-50 border-cyan-200 text-cyan-900'
    }
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Campus Categories</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 brand-font">
            Browse Products by Category
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Find everything you need on campus—from mid-night snacks and canteen specials to exam
            stationery and hostel bathroom essentials.
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoriesList.map((cat) => (
          <Link
            key={cat.id}
            to={`/?category=${cat.id}`}
            className="bg-white p-5 rounded-3xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all flex items-start space-x-4 group"
          >
            <div className="text-3xl p-3 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform">
              {cat.icon}
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                  {cat.name}
                </h3>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{cat.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
