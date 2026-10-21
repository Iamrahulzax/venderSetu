import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Store as StoreIcon,
  ShoppingCart,
  Check,
  AlertTriangle,
  Minus,
  Plus,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/Dialog';
import { Button } from './ui/Button';
import { Badge, VegBadge } from './ui/Badge';
import { ImageWithFallback } from './ui/ImageWithFallback';
import { useCart } from '../context/CartContext';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { ProductItem } from './ProductCard';

export interface ProductDetailModalProps {
  product: ProductItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  open,
  onOpenChange
}) => {
  const { addToCart } = useCart();
  const { liveStocks } = useSocket();
  const { user } = useAuth();

  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<{ name: string; price: number } | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<Array<{ name: string; price: number }>>([]);
  const [adding, setAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset state whenever product changes
  useEffect(() => {
    if (product) {
      setQuantity(1);
      setErrorMessage(null);
      setAddedSuccess(false);

      if (product.variants && product.variants.length > 0) {
        setSelectedVariant(product.variants[0]);
      } else {
        setSelectedVariant(null);
      }

      setSelectedAddons([]);
    }
  }, [product]);

  if (!product) return null;

  // Real-time stock status
  const live = liveStocks[product._id];
  const currentStock = live ? live.stock : product.stock;
  const currentAvailable = live ? live.availableStock : (product.availableStock ?? currentStock);
  const isOutOfStock = currentStock <= 0;
  const isTemporarilyUnavailable = product.isAvailable === false;
  const isLowStock = currentStock > 0 && currentStock <= product.lowStockThreshold;

  // Calculate live dynamic price
  const basePrice = selectedVariant ? selectedVariant.price : product.sellingPrice;
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const unitPrice = basePrice + addonsTotal;
  const totalPrice = unitPrice * quantity;

  const handleToggleAddon = (addon: { name: string; price: number }) => {
    setSelectedAddons((prev) => {
      const exists = prev.some((a) => a.name === addon.name);
      if (exists) {
        return prev.filter((a) => a.name !== addon.name);
      } else {
        return [...prev, addon];
      }
    });
  };

  const handleAddToCart = async () => {
    if (isOutOfStock || isTemporarilyUnavailable || adding) return;

    if (!user) {
      setErrorMessage('Please sign in to add products to your cart.');
      return;
    }

    try {
      setAdding(true);
      setErrorMessage(null);

      await addToCart(product._id, quantity, selectedVariant || undefined, selectedAddons);

      setAddedSuccess(true);
      setTimeout(() => {
        setAddedSuccess(false);
        onOpenChange(false);
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add item to cart');
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-xl p-0 overflow-hidden">
        {/* Product Media Banner with Badges */}
        <div className="relative aspect-[16/9] sm:aspect-[2/1] w-full bg-stone-100 overflow-hidden">
          <ImageWithFallback
            src={product.imageUrl || product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />

          {/* Genuine Image Attribution & Licensing Badge */}
          {product.imageVerified && (
            <div className="absolute bottom-3 left-3 bg-stone-950/85 backdrop-blur-md text-stone-200 text-[10px] px-2.5 py-1 rounded-lg border border-white/10 flex items-center gap-1.5 shadow-sm max-w-[85%] pointer-events-none">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">
                {product.imageAttribution || 'Authentic Product Photo'}
                {product.imageLicense ? ` • ${product.imageLicense}` : ''}
              </span>
            </div>
          )}

          {/* Store Pill */}
          <Link
            to={`/stores/${product.store.slug || product.store._id}`}
            onClick={() => onOpenChange(false)}
            className="absolute top-3.5 left-3.5 bg-white/95 backdrop-blur-md text-stone-900 text-xs font-semibold px-3 py-1 rounded-full shadow-sm flex items-center space-x-1.5 hover:bg-white hover:text-emerald-700 transition-colors"
          >
            <StoreIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>{product.store.name}</span>
          </Link>

          {/* Availability / Stock Badges */}
          <div className="absolute top-3.5 right-12 flex items-center gap-1.5">
            {isTemporarilyUnavailable ? (
              <Badge variant="outOfStock">Kitchen Unavailable</Badge>
            ) : isOutOfStock ? (
              <Badge variant="outOfStock">Out of Stock</Badge>
            ) : isLowStock ? (
              <Badge variant="lowStock">Only {currentAvailable} Left</Badge>
            ) : (
              <Badge variant="inStock">Available</Badge>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[55vh] space-y-5">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <VegBadge isVeg={product.isVeg !== false} />
                  <span className="text-xs uppercase tracking-wider font-bold text-stone-400">
                    {product.category}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight">
                  {product.name}
                </h2>
                <p className="text-xs text-stone-500 font-medium">Brand: {product.brand}</p>
              </div>

              {/* Price Display */}
              <div className="text-right shrink-0">
                <div className="text-xl font-bold text-stone-900">₹{unitPrice}</div>
                {product.unit && (
                  <span className="text-[11px] text-stone-400">per {product.unit}</span>
                )}
              </div>
            </div>

            {/* Preparation time & serving size pills */}
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-stone-100 text-xs text-stone-600">
              {product.prepTime && (
                <div className="flex items-center gap-1.5 bg-stone-100 px-2.5 py-1 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Prep time: <strong>{product.prepTime}</strong></span>
                </div>
              )}
              {product.servingSize && (
                <div className="flex items-center gap-1.5 bg-stone-100 px-2.5 py-1 rounded-lg">
                  <Info className="w-3.5 h-3.5 text-stone-500" />
                  <span>Serving: <strong>{product.servingSize}</strong></span>
                </div>
              )}
            </div>

            {product.description && (
              <p className="text-xs text-stone-600 leading-relaxed mt-3">
                {product.description}
              </p>
            )}
          </div>

          {/* Variants Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <label className="text-xs font-bold text-stone-900 flex items-center justify-between">
                <span>Select Size / Variant</span>
                <span className="text-[11px] text-stone-400 font-normal">Required</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.name === v.name;
                  return (
                    <button
                      key={v.name}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                          : 'border-stone-200 bg-stone-50/60 hover:bg-stone-100 text-stone-800'
                      }`}
                    >
                      <span className="text-xs font-semibold">{v.name}</span>
                      <span className={`text-xs font-bold mt-1 ${isSelected ? 'text-amber-300' : 'text-stone-900'}`}>
                        ₹{v.price}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add-ons Selector */}
          {product.addons && product.addons.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <label className="text-xs font-bold text-stone-900 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Customize with Add-ons</span>
                </span>
                <span className="text-[11px] text-stone-400 font-normal">Optional</span>
              </label>
              <div className="space-y-1.5">
                {product.addons.map((addon) => {
                  const isSelected = selectedAddons.some((a) => a.name === addon.name);
                  return (
                    <label
                      key={addon.name}
                      onClick={() => handleToggleAddon(addon)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/50 text-stone-900'
                          : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Controlled by label click
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className="text-xs font-medium">{addon.name}</span>
                      </div>
                      <span className="text-xs font-bold text-emerald-700">+₹{addon.price}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-4">
          {/* Quantity Stepper */}
          <div className="flex items-center bg-white border border-stone-200 rounded-xl p-1 shadow-sm shrink-0">
            <button
              type="button"
              disabled={quantity <= 1 || isOutOfStock || isTemporarilyUnavailable}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-8 text-center text-xs font-bold text-stone-900">{quantity}</span>
            <button
              type="button"
              disabled={quantity >= currentAvailable || isOutOfStock || isTemporarilyUnavailable}
              onClick={() => setQuantity((q) => Math.min(currentAvailable, q + 1))}
              className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add to Cart Action */}
          <Button
            variant={addedSuccess ? 'campus' : isOutOfStock || isTemporarilyUnavailable ? 'soft' : 'solid'}
            size="md"
            disabled={isOutOfStock || isTemporarilyUnavailable || adding}
            loading={adding}
            onClick={handleAddToCart}
            className="flex-1 justify-center py-2.5 font-bold"
          >
            {addedSuccess ? (
              <>
                <Check className="w-4 h-4 mr-1 text-white" />
                Added to Cart!
              </>
            ) : isTemporarilyUnavailable ? (
              'Currently Unavailable'
            ) : isOutOfStock ? (
              'Out of Stock'
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-1.5" />
                Add {quantity} for ₹{totalPrice}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
