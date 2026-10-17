import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Check,
  Store as StoreIcon,
  Clock,
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardMedia, CardBody, CardTitle, CardText, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Badge, VegBadge } from './ui/Badge';
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
  stock: number;
  reservedStock?: number;
  availableStock?: number;
  lowStockThreshold: number;
  image?: string;
  images?: string[];
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

export const ProductCard: React.FC<{ product: ProductItem }> = ({ product }) => {
  const { addToCart } = useCart();
  const { liveStocks } = useSocket();
  const { user } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  // Check if live stock update exists for this product
  const live = liveStocks[product._id];
  const currentStock = live ? live.stock : product.stock;
  const currentAvailable = live ? live.availableStock : (product.availableStock ?? currentStock);
  const isOutOfStock = currentStock <= 0;
  const isTemporarilyUnavailable = product.isAvailable === false;
  const isLowStock = currentStock > 0 && currentStock <= product.lowStockThreshold;

  const hasVariantsOrAddons =
    (product.variants && product.variants.length > 0) ||
    (product.addons && product.addons.length > 0);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // If item has variants or add-ons, open modal for customization
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
      setTimeout(() => setJustAdded(false), 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to add item to cart');
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
      <Card
        interactive
        onClick={() => setModalOpen(true)}
        className="flex flex-col justify-between h-full bg-white border-stone-200"
      >
        <div>
          {/* Card Media with Real Photography */}
          <CardMedia aspectRatio="aspect-[4/3]">
            <ImageWithFallback
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />

            {/* Store Pill */}
            <Link
              to={`/stores/${product.store.slug || product.store._id}`}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-2.5 left-2.5 bg-white/95 backdrop-blur-md text-stone-800 text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-sm flex items-center space-x-1 hover:bg-white hover:text-emerald-700 transition-colors"
            >
              <StoreIcon className="w-3 h-3 text-emerald-600" />
              <span className="truncate max-w-[110px]">{product.store.name}</span>
            </Link>

            {/* Availability & Stock Badges */}
            <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
              {isTemporarilyUnavailable ? (
                <Badge variant="outOfStock">Unavailable</Badge>
              ) : isOutOfStock ? (
                <Badge variant="outOfStock">Out of Stock</Badge>
              ) : isLowStock ? (
                <Badge variant="lowStock">Low Stock ({currentAvailable})</Badge>
              ) : null}
            </div>

            {/* Preparation time tag bottom right of media if provided */}
            {product.prepTime && (
              <div className="absolute bottom-2 right-2 bg-stone-950/80 backdrop-blur-sm text-stone-200 text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                <Clock className="w-2.5 h-2.5 text-amber-400" />
                <span>{product.prepTime}</span>
              </div>
            )}
          </CardMedia>

          {/* Card Body */}
          <CardBody>
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 truncate">
                {product.brand || product.category}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <VegBadge isVeg={product.isVeg !== false} />
                {product.isComparable && (
                  <Link
                    to="/compare"
                    onClick={(e) => e.stopPropagation()}
                    title="Compare prices across campus stores"
                    className="text-amber-600 hover:text-amber-700 p-0.5 rounded"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                  </Link>
                )}
              </div>
            </div>

            <CardTitle className="line-clamp-1">{product.name}</CardTitle>

            {product.description && (
              <CardText className="line-clamp-2">{product.description}</CardText>
            )}

            {/* Serving size or variant tag */}
            {(product.servingSize || product.unit) && (
              <span className="text-[11px] text-stone-400 font-medium">
                {product.servingSize || product.unit}
              </span>
            )}
          </CardBody>
        </div>

        {/* Card Footer with Price and Action Button */}
        <div className="px-4 pb-4">
          <CardFooter className="pt-2">
            <div>
              <div className="text-base font-bold text-stone-900 tracking-tight">
                ₹{product.sellingPrice}
                {hasVariantsOrAddons && (
                  <span className="text-[10px] font-normal text-stone-400 ml-1">onwards</span>
                )}
              </div>
              {product.unit && !hasVariantsOrAddons && (
                <span className="text-[10px] text-stone-400 block -mt-0.5">
                  per {product.unit}
                </span>
              )}
            </div>

            <Button
              variant={
                justAdded
                  ? 'campus'
                  : isOutOfStock || isTemporarilyUnavailable
                  ? 'soft'
                  : hasVariantsOrAddons
                  ? 'outline'
                  : 'solid'
              }
              size="sm"
              disabled={isOutOfStock || isTemporarilyUnavailable || adding}
              loading={adding}
              onClick={handleQuickAdd}
              className="text-xs shrink-0"
            >
              {justAdded ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-white" />
                  Added!
                </>
              ) : isTemporarilyUnavailable ? (
                'Unavailable'
              ) : isOutOfStock ? (
                'Sold Out'
              ) : hasVariantsOrAddons ? (
                <>
                  <Sparkles className="w-3 h-3 mr-1 text-amber-500" />
                  Customize
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3 h-3 mr-1" />
                  Add
                </>
              )}
            </Button>
          </CardFooter>
        </div>
      </Card>

      {/* Interactive Detail Modal */}
      <ProductDetailModal
        product={product}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
};
