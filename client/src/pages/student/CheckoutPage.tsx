import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CreditCard,
  QrCode,
  Banknote,
  Store as StoreIcon,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Clock
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';

export const CheckoutPage: React.FC = () => {
  const { cart, clearCart, refreshCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState<string>(
    user?.hostelRoom || 'Aryabhatta Hostel, Room B-312'
  );
  const [notes, setNotes] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<
    'upi' | 'card' | 'cash_on_pickup' | 'pay_at_store'
  >('upi');

  // Store-specific fulfillment options
  const [storeFulfillments, setStoreFulfillments] = useState<Record<string, 'pickup' | 'delivery'>>(
    {}
  );

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [razorpayModalOpen, setRazorpayModalOpen] = useState<boolean>(false);
  const [activeOrder, setActiveOrder] = useState<any>(null);

  // Calculate totals
  let totalDelivery = 0;
  cart.storeGroups.forEach((g) => {
    const f = storeFulfillments[g.storeId] || fulfillmentType;
    if (f === 'delivery' && g.offersDelivery) {
      totalDelivery += g.deliveryFee || 0;
    }
  });

  const finalAmount = cart.grandTotal + totalDelivery;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert('Please sign in to place an order.');
      navigate('/login');
      return;
    }

    if (fulfillmentType === 'delivery' && !deliveryAddress.trim()) {
      alert('Please provide your campus delivery address or hostel room number.');
      return;
    }

    try {
      setSubmitting(true);

      const orderPayload = {
        paymentMethod,
        fulfillmentType,
        deliveryAddress: fulfillmentType === 'delivery' ? deliveryAddress.trim() : '',
        notes: notes.trim(),
        storeFulfillmentOptions: storeFulfillments
      };

      const res = await apiRequest('/orders/checkout', {
        method: 'POST',
        body: JSON.stringify(orderPayload)
      });

      if (res.success && res.order) {
        setActiveOrder(res.order);

        // If online payment, open Razorpay Sandbox Checkout Modal
        if (paymentMethod === 'upi' || paymentMethod === 'card') {
          setRazorpayModalOpen(true);
        } else {
          // Cash on pickup or pay at store
          alert(
            `Order placed successfully! Order Number: ${res.order.orderNumber}. ${res.order.subordersCount} store suborder(s) have been dispatched to vendors.`
          );
          await refreshCart();
          navigate('/orders');
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmSandboxPayment = async (status: 'success' | 'failure') => {
    if (!activeOrder) return;

    if (status === 'failure') {
      alert('Payment cancelled or failed. Order status remains unpaid.');
      setRazorpayModalOpen(false);
      navigate('/orders');
      return;
    }

    try {
      setSubmitting(true);
      const verifyRes = await apiRequest(`/orders/${activeOrder._id}/verify-payment`, {
        method: 'POST',
        body: JSON.stringify({
          razorpayPaymentId: `pay_sim_${Date.now()}`,
          razorpaySignature: 'simulated_valid_signature_campus_2026'
        })
      });

      if (verifyRes.success) {
        setRazorpayModalOpen(false);
        alert(
          `Payment verified! ₹${finalAmount} paid via Razorpay (Sandbox). Order Number: ${activeOrder.orderNumber}`
        );
        await refreshCart();
        navigate('/orders');
      }
    } catch (err: any) {
      alert(err.message || 'Payment verification failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.items.length === 0 && !activeOrder) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto my-12 space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Your Cart is Empty</h2>
        <Link
          to="/"
          className="inline-block bg-emerald-600 text-white font-semibold text-xs px-6 py-2.5 rounded-xl shadow-sm"
        >
          Return to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 brand-font">Checkout & Fulfillment</h1>
        <p className="text-xs text-slate-500">
          Independent suborders will be routed to each campus store simultaneously.
        </p>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Address, Fulfillment & Payment */}
        <div className="md:col-span-2 space-y-6">
          {/* Fulfillment Type */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <h2 className="font-bold text-slate-900 text-sm">1. Fulfillment Method</h2>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFulfillmentType('pickup')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  fulfillmentType === 'pickup'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-900">Self Pickup</span>
                  <StoreIcon className="w-4 h-4 text-emerald-700" />
                </div>
                <p className="text-[11px] text-slate-500">
                  Collect items at each store counter when prepared. No delivery fee.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFulfillmentType('delivery')}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  fulfillmentType === 'delivery'
                    ? 'border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-600'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-900">Hostel Delivery</span>
                  <MapPin className="w-4 h-4 text-emerald-700" />
                </div>
                <p className="text-[11px] text-slate-500">
                  Delivered directly to your hostel block or room by available stores.
                </p>
              </button>
            </div>

            {/* Delivery address input */}
            {fulfillmentType === 'delivery' && (
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-slate-700">
                  Hostel / Room / Campus Location <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aryabhatta Hostel, Room B-312"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            {/* Special Instructions */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Order Notes / Food Preferences (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Extra spicy Maggi, keep burger sauce on the side..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <h2 className="font-bold text-slate-900 text-sm">2. Payment Method</h2>

            <div className="space-y-2.5">
              <label
                className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'upi'
                    ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="upi"
                    checked={paymentMethod === 'upi'}
                    onChange={() => setPaymentMethod('upi')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <p className="font-bold text-xs text-slate-900">UPI Instant Payment (Razorpay)</p>
                    <p className="text-[11px] text-slate-500">Google Pay, PhonePe, Paytm, BHIM</p>
                  </div>
                </div>
                <QrCode className="w-5 h-5 text-emerald-700" />
              </label>

              <label
                className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'card'
                    ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <p className="font-bold text-xs text-slate-900">Credit / Debit Card / Net Banking</p>
                    <p className="text-[11px] text-slate-500">All major Indian banks & RuPay/Visa/MasterCard</p>
                  </div>
                </div>
                <CreditCard className="w-5 h-5 text-slate-600" />
              </label>

              <label
                className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'cash_on_pickup'
                    ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash_on_pickup"
                    checked={paymentMethod === 'cash_on_pickup'}
                    onChange={() => setPaymentMethod('cash_on_pickup')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <p className="font-bold text-xs text-slate-900">Cash on Pickup</p>
                    <p className="text-[11px] text-slate-500">Pay physically in cash when collecting from stores</p>
                  </div>
                </div>
                <Banknote className="w-5 h-5 text-slate-600" />
              </label>

              <label
                className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'pay_at_store'
                    ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="pay_at_store"
                    checked={paymentMethod === 'pay_at_store'}
                    onChange={() => setPaymentMethod('pay_at_store')}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <p className="font-bold text-xs text-slate-900">Pay at Store Counter</p>
                    <p className="text-[11px] text-slate-500">Pay via shopkeeper's QR scanner at pickup time</p>
                  </div>
                </div>
                <StoreIcon className="w-5 h-5 text-slate-600" />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Breakdown & Place Order */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <h2 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
              Store Breakdown ({cart.storeGroups.length} stores)
            </h2>

            <div className="space-y-3 divide-y divide-slate-100">
              {cart.storeGroups.map((g) => {
                const f = storeFulfillments[g.storeId] || fulfillmentType;
                const fee = f === 'delivery' && g.offersDelivery ? g.deliveryFee : 0;

                return (
                  <div key={g.storeId} className="pt-2.5 first:pt-0 space-y-1 text-xs">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{g.storeName}</span>
                      <span>₹{g.storeSubtotal + fee}</span>
                    </div>

                    <p className="text-[11px] text-slate-500">
                      {g.items.length} item{g.items.length > 1 ? 's' : ''} •{' '}
                      {f === 'delivery' ? `Delivery (+₹${fee})` : 'Pickup (₹0)'}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span>₹{cart.grandTotal}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Total Delivery Charges</span>
                <span>₹{totalDelivery}</span>
              </div>
              <div className="flex items-baseline justify-between pt-2 border-t border-slate-100">
                <span className="font-bold text-slate-900">Final Payable</span>
                <span className="text-2xl font-extrabold text-emerald-700">₹{finalAmount}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
            >
              <span>{submitting ? 'Creating Suborders...' : `Pay & Place Order (₹${finalAmount})`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-[11px] text-slate-400 space-y-1 pt-1 text-center">
              <p className="flex items-center justify-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified atomic inventory deduction</span>
              </p>
            </div>
          </div>
        </div>
      </form>

      {/* Razorpay Simulation Sandbox Modal */}
      {razorpayModalOpen && activeOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                  ₹
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Razorpay Checkout Sandbox</h3>
                  <p className="text-[10px] text-slate-500">Test Mode Payment Gateway</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                ₹{activeOrder.totalAmount}
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2">
              <p className="font-semibold text-slate-900">
                Order ID: <span className="font-mono text-emerald-700">{activeOrder.orderNumber}</span>
              </p>
              <p>Simulating Razorpay UPI / Card payment verification callback for India (₹).</p>
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-center space-y-1">
                <QrCode className="w-20 h-20 text-slate-800 mx-auto" />
                <p className="text-[11px] font-medium text-slate-600">Scan UPI QR or select test response</p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleConfirmSandboxPayment('success')}
                disabled={submitting}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center justify-center space-x-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Simulate Successful Payment (Signature Verified)</span>
              </button>

              <button
                type="button"
                onClick={() => handleConfirmSandboxPayment('failure')}
                disabled={submitting}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Simulate Payment Failure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
