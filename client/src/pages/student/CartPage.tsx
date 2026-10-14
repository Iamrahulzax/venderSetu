import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Store as StoreIcon,
  AlertTriangle,
  ShoppingBag,
  ShieldCheck
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

export const CartPage: React.FC = () => {
  const { cart, updateQuantity, removeFromCart, clearCart, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto my-12 space-y-4">
        <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Please Sign In</h2>
        <p className="text-xs text-slate-500">
          Sign in to view and synchronize your persistent campus cart across devices.
        </p>
        <Link
          to="/login"
          className="inline-block bg-emerald-600 text-white font-semibold text-xs px-6 py-2.5 rounded-xl shadow-sm"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto my-12 space-y-4">
        <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500">
          Explore the College Canteen, Durga Fast Food, Monal, Bhandari, or Devbhoomi general store!
        </p>
        <Link
          to="/"
          className="inline-flex items-center space-x-1.5 bg-emerald-600 text-white font-semibold text-xs px-6 py-2.5 rounded-xl shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <span>Start Shopping</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  // Check if any item has insufficient stock
  const hasUnavailableItems = cart.items.some((i) => !i.isAvailable || i.stock < i.quantity);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 brand-font">Multi-Store Shopping Cart</h1>
          <p className="text-xs text-slate-500">
            {cart.totalItemsCount} item{cart.totalItemsCount > 1 ? 's' : ''} across{' '}
            {cart.storeGroups.length} independent store{cart.storeGroups.length > 1 ? 's' : ''}
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition-colors flex items-center space-x-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Cart</span>
        </button>
      </div>

      {/* Stock warning banner if any item exceeded stock */}
      {hasUnavailableItems && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start space-x-3 text-amber-900 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Some items have limited availability!</p>
            <p className="text-amber-800 mt-0.5">
              Another student might have bought the remaining stock. Please adjust quantities to
              match available stock before proceeding to checkout.
            </p>
          </div>
        </div>
      )}

      {/* Multi-Store Grouped Cart Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {cart.storeGroups.map((group) => (
            <div
              key={group.storeId}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm"
            >
              {/* Store header pill */}
              <div className="bg-slate-50/80 p-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    <StoreIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-sm">{group.storeName}</h2>
                    <span className="text-[10px] text-slate-500">
                      {group.offersDelivery
                        ? `Delivery ₹${group.deliveryFee} • Prep ~${group.estimatedPrepTime}`
                        : 'Store pickup only'}
                    </span>
                  </div>
                </div>

                <span className="text-xs font-bold text-slate-800">
                  Subtotal: ₹{group.storeSubtotal}
                </span>
              </div>

              {/* Items for this store */}
              <div className="divide-y divide-slate-100">
                {group.items.map((item) => {
                  const stockExceeded = item.quantity > item.availableStock;

                  return (
                    <div
                      key={item.productId}
                      className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                        stockExceeded ? 'bg-amber-50/40' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center space-x-3.5">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0 bg-slate-50"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs shrink-0 font-medium">
                            Item
                          </div>
                        )}

                        <div className="space-y-0.5">
                          <h3 className="font-semibold text-slate-900 text-xs sm:text-sm line-clamp-1">
                            {item.name}
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            ₹{item.price} • {item.unit}
                          </p>

                          {stockExceeded ? (
                            <p className="text-[11px] text-rose-600 font-medium flex items-center space-x-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Only {item.availableStock} available!</span>
                            </p>
                          ) : item.stock <= 5 ? (
                            <p className="text-[11px] text-amber-600 font-medium">
                              Low stock: {item.stock} left
                            </p>
                          ) : (
                            <p className="text-[11px] text-emerald-600 font-medium">In Stock</p>
                          )}
                        </div>
                      </div>

                      {/* Quantity & Controls */}
                      <div className="flex items-center space-x-4 shrink-0">
                        <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            disabled={item.quantity >= item.availableStock}
                            className={`p-1.5 ${
                              item.quantity >= item.availableStock
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'hover:bg-slate-100 text-slate-600'
                            }`}
                            title="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <span className="text-sm font-bold text-slate-900 w-16 text-right">
                          ₹{item.subtotal}
                        </span>

                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary & Proceed to Checkout */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm sticky top-24">
            <h2 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-3">
              Order Summary
            </h2>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-slate-900">₹{cart.grandTotal}</span>
              </div>

              {cart.storeGroups.map((g) => (
                <div key={g.storeId} className="flex items-center justify-between text-slate-500 pl-2">
                  <span className="truncate max-w-[160px]">• {g.storeName}</span>
                  <span>₹{g.storeSubtotal}</span>
                </div>
              ))}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-slate-500">
                <span>Estimated Delivery Fees</span>
                <span>Calculated at Checkout</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
              <span className="text-sm font-bold text-slate-900">Cart Total</span>
              <span className="text-2xl font-extrabold text-emerald-700">₹{cart.grandTotal}</span>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              disabled={hasUnavailableItems}
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-center space-x-2 transition-all ${
                hasUnavailableItems
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 active:scale-95'
              }`}
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-[11px] text-slate-400 space-y-1 pt-1 text-center">
              <p className="flex items-center justify-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Stores receive independent suborders instantly</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
