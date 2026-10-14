import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Check, Store as StoreIcon, AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export interface ProductItem {
  _id: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  variant?: string;
  sellingPrice: number;
  stock: number;
  reservedStock?: number;
  availableStock?: number;
  lowStockThreshold: number;
  image?: string;
  description?: string;
  isComparable?: boolean;
  comparableGroupKey?: string;
  store: {
    _id: string;
    name: string;
    slug: string;
    isOpen?: boolean;
    offersDelivery?: boolean;
    deliveryFee?: number;
    estimatedPrepTime?: string;
  };
}

export const ProductCard: React.FC<{ product: ProductItem }> = ({ product }) => {
  const { addToCart } = useCart();
  const { liveStocks } = useSocket();
  const { user } = useAuth();
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // Check if live stock update exists for this product
  const live = liveStocks[product._id];
  const currentStock = live ? live.stock : product.stock;
  const currentAvailable = live ? live.availableStock : (product.availableStock ?? currentStock);
  const isOutOfStock = currentStock <= 0;
  const isLowStock = currentStock > 0 && currentStock <= product.lowStockThreshold;

  const handleAddToCart = async () => {
    if (isOutOfStock || adding) return;

    if (!user) {
      alert('Please sign in to add products to your cart.');
      return;
    }

    try {
      setAdding(true);
      await addToCart(product._id, 1);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to add item to cart');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Product Image & Badges */}
        <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50">
              <span className="text-xs font-medium">No Image</span>
            </div>
          )}

          {/* Store Pill */}
          <Link
            to={`/stores/${product.store.slug || product.store._id}`}
            className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-sm text-slate-800 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm flex items-center space-x-1 hover:bg-white hover:text-emerald-700 transition-colors"
          >
            <StoreIcon className="w-3 h-3 text-emerald-600" />
            <span className="truncate max-w-[120px]">{product.store.name}</span>
          </Link>

          {/* Stock Badges */}
          <div className="absolute top-2.5 right-2.5">
            {isOutOfStock ? (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center space-x-1">
                <AlertTriangle className="w-2.5 h-2.5" />
                <span>Only {currentStock} left</span>
              </span>
            ) : (
              <span className="bg-emerald-600/90 text-white text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm">
                {currentStock} in stock
              </span>
            )}
          </div>

          {/* Cross-store comparison pill if comparable */}
          {product.isComparable && (
            <Link
              to={`/compare?highlight=${product.comparableGroupKey || product.name}`}
              className="absolute bottom-2 left-2.5 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 rounded-full hover:bg-slate-900 flex items-center space-x-1"
              title="Compare price across other campus stores"
            >
              <ArrowRightLeft className="w-2.5 h-2.5 text-emerald-400" />
              <span>Compare Price</span>
            </Link>
          )}
        </div>

        {/* Content details */}
        <div className="p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md capitalize">
              {product.category}
            </span>
            <span className="truncate max-w-[100px]">{product.brand}</span>
          </div>

          <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors">
            {product.name}
          </h3>

          <p className="text-xs text-slate-500 mt-1">
            {product.unit} {product.variant && `• ${product.variant}`}
          </p>

          {product.description && (
            <p className="text-xs text-slate-400 line-clamp-1 mt-1">{product.description}</p>
          )}
        </div>
      </div>

      {/* Footer Price & Add to Cart */}
      <div className="p-4 pt-0 border-t border-slate-100 mt-2 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400">Price</span>
          <p className="text-lg font-bold text-slate-900 leading-none">
            ₹{product.sellingPrice}
          </p>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || adding}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm ${
            isOutOfStock
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              : justAdded
              ? 'bg-emerald-700 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-95'
          }`}
        >
          {justAdded ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Added!</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
