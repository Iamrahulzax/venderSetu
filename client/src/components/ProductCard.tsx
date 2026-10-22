import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  Plus,
  Star,
  Sparkles,
  Store as StoreIcon,
  Clock,
  ArrowRightLeft
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { ImageWithFallback } from './ui/ImageWithFallback';
import { ProductDetailModal } from './ProductDetailModal';

export interface ProductVariantItem {
  name: string;
  price: number;
  inStock?: boolean;
}

export interface ProductAddonItem {
  name: string;
  price: number;
}

export interface ProductItem {
  _id: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  variant?: string;
  variants?: ProductVariantItem[];
  addons?: ProductAddonItem[];
  isVeg?: boolean;
  servingSize?: string;
  prepTime?: string;
  isAvailable?: boolean;
  sellingPrice: number;
  originalPrice?: number;
  discountPercent?: number;
  badge?: string;
  secondaryBadge?: string;
  rating?: number;
  ratingCount?: number;
  stock: number;
  reservedStock?: number;
  availableStock?: number;
  lowStockThreshold: number;
  image?: string;
  imageUrl?: string;
  images?: string[];
  imageSource?: string;
  imageAttribution?: string;
  imageLicense?: string;
  imageVerified?: boolean;
  barcode?: string;
  description?: string;
  isComparable?: boolean;
  comparableGroupKey?: string;
  sku?: string;
  expiryDate?: string | Date;
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

export const ProductCard: React.FC<{
  product: ProductItem;
  currencySymbol?: string;
}> = ({ product, currencySymbol = '₹' }) => {
  const { addToCart } = useCart();
  const { liveStocks } = useSocket();
  const { user } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // Live stock from socket if available
  const live = liveStocks[product._id];
  const currentStock = live ? live.stock : product.stock;
  const isOutOfStock = currentStock <= 0;
  const isTemporarilyUnavailable = product.isAvailable === false;

  const hasVariantsOrAddons =
    (product.variants && product.variants.length > 0) ||
    (product.addons && product.addons.length > 0);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (hasVariantsOrAddons) {
      setModalOpen(true);
      return;
    }

    if (isOutOfStock || isTemporarilyUnavailable || adding) return;

    if (!user) {
      alert('Please sign in to add products to your cart.');
      return;
    }

    try {
      setAdding(true);
      await addToCart(product._id, 1);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1200);
    } catch (err: any) {
      alert(err.message || 'Failed to add item to cart');
    } finally {
      setAdding(false);
    }
  };

  // Determine badge styles matching reference design
  const primaryBadge = product.badge;
  const secondaryBadge = product.secondaryBadge;

  const getBadgeStyle = (badgeName: string) => {
    const lower = badgeName.toLowerCase();
    if (lower.includes('best sale') || lower.includes('sale') || lower.includes('hot')) {
      return 'bg-[#991b1b] text-white'; // Deep red / burgundy
    }
    if (lower.includes('frozen') || lower.includes('ice')) {
      return 'bg-[#d97706] text-white'; // Golden amber
    }
    if (lower.includes('off') || lower.includes('discount') || lower.includes('%')) {
      return 'bg-[#ea580c] text-white'; // Orange
    }
    if (lower.includes('organic') || lower.includes('fresh')) {
      return 'bg-[#059669] text-white'; // Emerald green
    }
    return 'bg-slate-800 text-white';
  };

  const displayRating = product.rating ? product.rating.toFixed(1) : '4.8';

  return (
    <>
      <div
        onClick={() => setModalOpen(true)}
        className="group relative flex flex-col justify-between bg-white rounded-2xl border border-slate-100 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 p-3.5 cursor-pointer overflow-hidden"
      >
        {/* Top Badges Row */}
        <div className="flex items-center justify-between w-full min-h-[22px] mb-2 pointer-events-none z-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            {primaryBadge && (
              <span
                className={`text-[9.5px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-xs ${getBadgeStyle(
                  primaryBadge
                )}`}
              >
                {primaryBadge}
              </span>
            )}
            {isOutOfStock && !primaryBadge && (
              <span className="text-[9.5px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-slate-200 text-slate-700">
                Sold Out
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {secondaryBadge && (
              <span
                className={`text-[9.5px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-xs ${getBadgeStyle(
                  secondaryBadge
                )}`}
              >
                {secondaryBadge}
              </span>
            )}
          </div>
        </div>

        {/* Product Image Area */}
        <div className="relative w-full h-36 sm:h-44 flex items-center justify-center p-2 mb-2 bg-[#fafafa] rounded-xl overflow-hidden group-hover:bg-slate-50/80 transition-colors">
          <ImageWithFallback
            src={product.imageUrl || product.image}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-108 transition-transform duration-300 drop-shadow-sm"
          />

          {/* Quick store tag */}
          {product.store && (
            <span className="absolute bottom-1.5 left-1.5 text-[9px] font-medium text-slate-400 bg-white/80 backdrop-blur-xs px-1.5 py-0.5 rounded">
              {product.store.name}
            </span>
          )}
        </div>

        {/* Product Metadata & Title */}
        <div className="flex-1 flex flex-col justify-between space-y-1">
          <div>
            <h3 className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
              {product.name}
            </h3>

            {/* Pack / Weight & Rating Row */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400 font-medium">
                {product.unit || '1000gm'}
              </span>

              <div className="flex items-center space-x-1 text-[11px] text-slate-600 font-medium">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span>({displayRating}/5)</span>
              </div>
            </div>
          </div>

          {/* Price & Add to Cart Circle Button */}
          <div className="pt-2.5 flex items-center justify-between border-t border-slate-50 mt-1">
            <div className="flex items-baseline space-x-1.5">
              <span className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                {currencySymbol}
                {product.sellingPrice % 1 === 0 ? product.sellingPrice : product.sellingPrice.toFixed(2)}
              </span>
              {product.originalPrice && product.originalPrice > product.sellingPrice && (
                <span className="text-[11px] text-slate-400 line-through">
                  {currencySymbol}
                  {product.originalPrice % 1 === 0 ? product.originalPrice : product.originalPrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* Circular Green Plus Button */}
            <button
              type="button"
              onClick={handleQuickAdd}
              disabled={isOutOfStock || isTemporarilyUnavailable || adding}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 shadow-xs ${
                justAdded
                  ? 'bg-emerald-600 text-white scale-105'
                  : isOutOfStock || isTemporarilyUnavailable
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-[#0d5435] hover:bg-[#073c24] text-white hover:scale-105'
              }`}
              title={
                hasVariantsOrAddons
                  ? 'Customize item'
                  : isOutOfStock
                  ? 'Sold out'
                  : 'Add to cart'
              }
            >
              {justAdded ? (
                <Check className="w-4 h-4 stroke-[3]" />
              ) : hasVariantsOrAddons ? (
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              ) : (
                <Plus className="w-4 h-4 stroke-[3]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Detail Modal */}
      <ProductDetailModal
        product={product}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
};
