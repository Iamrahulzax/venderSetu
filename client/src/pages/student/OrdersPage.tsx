import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChefHat,
  Bike,
  Store as StoreIcon,
  Printer,
  MessageSquareWarning,
  RefreshCw,
  ArrowRight,
  Search,
  Package,
  Sparkles,
  MapPin,
  Check,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useCart } from '../../context/CartContext';

export const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const { addToCart } = useCart();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<any>(null);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [reorderingSubOrderId, setReorderingSubOrderId] = useState<string | null>(null);

  // Complaint modal state
  const [complaintModalOpen, setComplaintModalOpen] = useState<boolean>(false);
  const [complaintTarget, setComplaintTarget] = useState<{
    orderId: string;
    subOrderId?: string;
    storeName?: string;
  } | null>(null);
  const [complaintSubject, setComplaintSubject] = useState<string>('');
  const [complaintDesc, setComplaintDesc] = useState<string>('');
  const [submittingComplaint, setSubmittingComplaint] = useState<boolean>(false);

  const fetchOrders = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await apiRequest('/orders/my-orders');
      if (data.success && data.orders) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  // Real-time order status updates via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleOrderStatusUpdate = (updatedSubOrder: any) => {
      setOrders((prevOrders) =>
        prevOrders.map((order) => {
          if (order._id === updatedSubOrder.orderId) {
            return {
              ...order,
              suborders: order.suborders.map((sub: any) =>
                sub._id === updatedSubOrder._id ? { ...sub, ...updatedSubOrder } : sub
              )
            };
          }
          return order;
        })
      );
    };

    socket.on('order:status_update', handleOrderStatusUpdate);

    return () => {
      socket.off('order:status_update', handleOrderStatusUpdate);
    };
  }, [socket]);

  const handleCancelSubOrder = async (subOrderId: string) => {
    const reason = prompt('Please enter a cancellation reason:');
    if (!reason) return;

    try {
      const res = await apiRequest(`/orders/suborder/${subOrderId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });

      if (res.success) {
        alert('SubOrder cancelled and inventory released back to shop.');
        await fetchOrders();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to cancel suborder');
    }
  };

  const handleReorderSuborder = async (sub: any) => {
    try {
      setReorderingSubOrderId(sub._id);
      for (const item of sub.items) {
        const prodId = item.productId?._id || item.productId || item._id;
        if (prodId) {
          await addToCart(prodId, item.quantity || 1);
        }
      }
      alert(`Items from "${sub.storeId?.name || 'Store'}" added to your cart!`);
    } catch (err: any) {
      alert(err.message || 'Failed to reorder items');
    } finally {
      setReorderingSubOrderId(null);
    }
  };

  const handleOpenComplaint = (orderId: string, subOrderId?: string, storeName?: string) => {
    setComplaintTarget({ orderId, subOrderId, storeName });
    setComplaintSubject(storeName ? `Issue with order from ${storeName}` : 'Order Issue');
    setComplaintDesc('');
    setComplaintModalOpen(true);
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintTarget) return;

    try {
      setSubmittingComplaint(true);
      const res = await apiRequest('/admin/complaints', {
        method: 'POST',
        body: JSON.stringify({
          orderId: complaintTarget.orderId,
          subOrderId: complaintTarget.subOrderId,
          storeName: complaintTarget.storeName,
          subject: complaintSubject,
          description: complaintDesc
        })
      });

      if (res.success) {
        alert('Your complaint has been submitted directly to the campus administrator desk.');
        setComplaintModalOpen(false);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit complaint');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  // Stepper helper
  const getTimelineSteps = (status: string, fulfillmentType: string) => {
    const isPickup = fulfillmentType !== 'delivery';
    const fourthStepLabel = isPickup ? 'Ready for Pickup' : 'Out for Delivery';

    const steps = [
      { key: 'pending', label: 'Placed' },
      { key: 'accepted', label: 'Accepted' },
      { key: 'preparing', label: 'Preparing' },
      { key: isPickup ? 'ready_for_pickup' : 'out_for_delivery', label: fourthStepLabel },
      { key: 'completed', label: isPickup ? 'Picked Up' : 'Delivered' }
    ];

    const statusOrder = [
      'pending',
      'accepted',
      'preparing',
      isPickup ? 'ready_for_pickup' : 'out_for_delivery',
      'completed'
    ];

    const currentIndex = statusOrder.indexOf(status);

    return { steps, currentIndex };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center space-x-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
            <span>Pending Store Acceptance</span>
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center space-x-1.5 bg-blue-50 text-blue-800 border border-blue-200 px-3 py-1 rounded-full text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Store Confirmed</span>
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center space-x-1.5 bg-indigo-50 text-indigo-800 border border-indigo-200 px-3 py-1 rounded-full text-xs font-bold">
            <ChefHat className="w-3.5 h-3.5 text-indigo-600" />
            <span>Kitchen / Store Packing</span>
          </span>
        );
      case 'ready_for_pickup':
        return (
          <span className="inline-flex items-center space-x-1.5 bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Ready at Counter</span>
          </span>
        );
      case 'out_for_delivery':
        return (
          <span className="inline-flex items-center space-x-1.5 bg-teal-100 text-teal-900 border border-teal-300 px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
            <Bike className="w-3.5 h-3.5 text-teal-700" />
            <span>Out for Hostel Delivery</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center space-x-1.5 bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" />
            <span>Fulfilled</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center space-x-1.5 bg-rose-50 text-rose-800 border border-rose-200 px-3 py-1 rounded-full text-xs font-bold">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Rejected (Auto-Refunded)</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center space-x-1.5 bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-medium">
            <XCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  // Calculate order metrics
  const totalOrders = orders.length;
  const activeOrdersCount = orders.filter((o) =>
    o.suborders.some((s: any) =>
      ['pending', 'accepted', 'preparing', 'ready_for_pickup', 'out_for_delivery'].includes(s.status)
    )
  ).length;
  const completedOrdersCount = orders.filter((o) =>
    o.suborders.every((s: any) => s.status === 'completed')
  ).length;
  const totalSpent = orders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    // Search query
    const matchesSearch =
      searchTerm === '' ||
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.suborders.some(
        (s: any) =>
          (s.storeId?.name && s.storeId.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          s.items.some((i: any) => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );

    if (!matchesSearch) return false;

    // Tab filter
    if (activeTab === 'active') {
      return order.suborders.some((s: any) =>
        ['pending', 'accepted', 'preparing', 'ready_for_pickup', 'out_for_delivery'].includes(s.status)
      );
    }
    if (activeTab === 'completed') {
      return order.suborders.every((s: any) => s.status === 'completed');
    }
    if (activeTab === 'cancelled') {
      return order.suborders.some((s: any) => ['cancelled', 'rejected'].includes(s.status));
    }

    return true;
  });

  if (!user) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto my-16 space-y-4 shadow-sm">
        <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Sign In to Track Orders</h2>
        <p className="text-xs text-slate-500">
          Sign in with your student credentials to view live kitchen order progress and digital receipts.
        </p>
        <Link
          to="/login"
          className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-6 py-2.5 rounded-xl shadow-sm transition-colors"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-6 sm:p-10 shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span>{isConnected ? 'Real-time Live Sync Connected' : 'Connecting to campus sync...'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight brand-font">
            Campus Orders & Live Tracking
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
            Track preparation progress in real-time from the College Canteen, Durga, Monal, Bhandari,
            and Devbhoomi stores. Access digital receipts and lodge complaints directly with administrators.
          </p>

          {/* Metrics bar */}
          <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <span className="text-xl sm:text-2xl font-extrabold text-white">{totalOrders}</span>
              <p className="text-[11px] text-slate-300">Total Campus Orders</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-400">
                {activeOrdersCount}
              </span>
              <p className="text-[11px] text-slate-300">Active Live Orders</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <span className="text-xl sm:text-2xl font-extrabold text-teal-300">
                {completedOrdersCount}
              </span>
              <p className="text-[11px] text-slate-300">Fulfilled Orders</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              <span className="text-xl sm:text-2xl font-extrabold text-amber-300">
                ₹{totalSpent}
              </span>
              <p className="text-[11px] text-slate-300">Total Spent</p>
            </div>
          </div>
        </div>

        {/* Ambient glow */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Tabs and Search Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order ID (ORD-...), store name, or item..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
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

        {/* Filter Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Orders ({totalOrders})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center space-x-1 ${
              activeTab === 'active'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Active ({activeOrdersCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'completed'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Completed ({completedOrdersCount})
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'cancelled'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Cancelled / Rejected
          </button>

          <button
            onClick={fetchOrders}
            className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition-colors shrink-0"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-24 text-center space-y-4">
          <div className="inline-block w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Loading your campus orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4 shadow-xs">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-base font-bold text-slate-800">No Orders Found</h2>
          <p className="text-xs text-slate-500">
            {searchTerm || activeTab !== 'all'
              ? 'No orders match your filter criteria.'
              : 'You have not placed any orders yet. Check out the campus canteens and stores!'}
          </p>
          <Link
            to="/stores"
            className="inline-flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-colors"
          >
            <span>Browse Campus Stores</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all space-y-4"
            >
              {/* Order Master Header Bar */}
              <div className="bg-slate-50/80 p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {order.orderNumber}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        order.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.paymentStatus === 'paid' ? 'Paid Online' : 'Payment Pending'}
                    </span>
                    <span className="text-xs text-slate-400 capitalize">
                      • {order.paymentMethod?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Placed on {new Date(order.createdAt).toLocaleString()} • {order.suborders.length}{' '}
                    Store Suborders • Total: ₹{order.totalAmount}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedReceiptOrder(order)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Receipt</span>
                  </button>

                  <button
                    onClick={() => handleOpenComplaint(order._id)}
                    className="inline-flex items-center space-x-1 px-2.5 py-1.5 text-xs text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Report Issue to Campus Admin"
                  >
                    <MessageSquareWarning className="w-3.5 h-3.5" />
                    <span>Report Issue</span>
                  </button>
                </div>
              </div>

              {/* Suborders List with Visual Stepper Progress Bar */}
              <div className="p-5 pt-0 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  {order.suborders.map((sub: any) => {
                    const isCancelled = sub.status === 'cancelled' || sub.status === 'rejected';
                    const { steps, currentIndex } = getTimelineSteps(sub.status, sub.fulfillmentType);

                    return (
                      <div
                        key={sub._id}
                        className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4 shadow-2xs hover:border-slate-300 transition-colors"
                      >
                        {/* Suborder Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                              <StoreIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h3 className="font-bold text-slate-900 text-sm">
                                  {sub.storeId?.name || 'Store'}
                                </h3>
                                <span className="font-mono text-[10px] text-slate-400">
                                  #{sub.subOrderNumber}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500">
                                {sub.fulfillmentType === 'delivery'
                                  ? `Hostel Delivery (${sub.deliveryAddress || 'Hostel Room'})`
                                  : 'Self Counter Pickup'}
                              </p>
                            </div>
                          </div>

                          <div>{getStatusBadge(sub.status)}</div>
                        </div>

                        {/* Interactive Visual Progress Stepper (if not cancelled/rejected) */}
                        {!isCancelled && (
                          <div className="py-2 px-1">
                            <div className="relative flex items-center justify-between">
                              {/* Background track line */}
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 w-full z-0" />
                              {/* Active filled line */}
                              <div
                                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 transition-all duration-500 z-0"
                                style={{
                                  width: `${
                                    currentIndex >= 0
                                      ? (currentIndex / (steps.length - 1)) * 100
                                      : 0
                                  }%`
                                }}
                              />

                              {steps.map((st, sIdx) => {
                                const isPassed = sIdx < currentIndex;
                                const isCurrent = sIdx === currentIndex;

                                return (
                                  <div
                                    key={st.key}
                                    className="relative z-10 flex flex-col items-center"
                                  >
                                    <div
                                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                                        isCurrent
                                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 animate-pulse'
                                          : isPassed
                                          ? 'bg-emerald-500 text-white'
                                          : 'bg-white border-2 border-slate-200 text-slate-400'
                                      }`}
                                    >
                                      {isPassed ? <Check className="w-3.5 h-3.5" /> : sIdx + 1}
                                    </div>
                                    <span
                                      className={`text-[10px] mt-1 font-semibold whitespace-nowrap ${
                                        isCurrent
                                          ? 'text-emerald-700'
                                          : isPassed
                                          ? 'text-slate-700'
                                          : 'text-slate-400'
                                      }`}
                                    >
                                      {st.label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Items in this suborder */}
                        <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                          {sub.items.map((i: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between py-1 border-b border-slate-50 last:border-none"
                            >
                              <div>
                                <span className="font-semibold text-slate-800">
                                  {i.quantity}x {i.name}
                                </span>
                                {(i.selectedVariant ||
                                  (i.selectedAddons && i.selectedAddons.length > 0)) && (
                                  <div className="text-[10px] text-slate-500 flex flex-wrap gap-1 mt-0.5">
                                    {i.selectedVariant && (
                                      <span className="bg-amber-50 text-amber-800 px-1.5 py-0.2 rounded border border-amber-200">
                                        {i.selectedVariant.name}
                                      </span>
                                    )}
                                    {i.selectedAddons && i.selectedAddons.length > 0 && (
                                      <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                                        +{i.selectedAddons.map((a: any) => a.name).join(', ')}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <span className="font-bold text-slate-900">₹{i.subtotal}</span>
                            </div>
                          ))}
                        </div>

                        {/* Financial Suborder Breakdown & Action Buttons */}
                        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex items-center space-x-3 text-slate-500">
                            {sub.deliveryFee > 0 && (
                              <span>Delivery Fee: ₹{sub.deliveryFee}</span>
                            )}
                            <div className="font-bold text-slate-900">
                              <span>Total: </span>
                              <span className="text-emerald-700 font-extrabold text-sm">
                                ₹{sub.totalAmount}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {/* Reorder Button */}
                            <button
                              onClick={() => handleReorderSuborder(sub)}
                              disabled={reorderingSubOrderId === sub._id}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>
                                {reorderingSubOrderId === sub._id ? 'Adding...' : 'Reorder'}
                              </span>
                            </button>

                            {/* Cancel Button if still in pending */}
                            {sub.status === 'pending' && (
                              <button
                                onClick={() => handleCancelSubOrder(sub._id)}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors"
                              >
                                Cancel Suborder
                              </button>
                            )}

                            {/* Report Specific Store Issue */}
                            <button
                              onClick={() =>
                                handleOpenComplaint(order._id, sub._id, sub.storeId?.name)
                              }
                              className="px-2 py-1.5 text-slate-400 hover:text-rose-600 text-xs transition-colors"
                              title="Report Store Issue"
                            >
                              <MessageSquareWarning className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Rejection / Cancellation explanation */}
                        {sub.rejectionReason && (
                          <div className="bg-rose-50 p-3 rounded-2xl text-xs text-rose-800 border border-rose-100">
                            <span className="font-semibold">Reason provided: </span>
                            {sub.rejectionReason}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Printable Receipt Modal */}
      {selectedReceiptOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base brand-font">
                  VenderSetu Campus Receipt
                </h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Order #{selectedReceiptOrder.orderNumber}
                </p>
              </div>
              <button
                onClick={() => setSelectedReceiptOrder(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span>Customer:</span>
                <span className="font-semibold">{selectedReceiptOrder.studentName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span>Date & Time:</span>
                <span>{new Date(selectedReceiptOrder.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span>Payment Mode:</span>
                <span className="font-semibold capitalize">
                  {selectedReceiptOrder.paymentMethod?.replace(/_/g, ' ')} (
                  {selectedReceiptOrder.paymentStatus})
                </span>
              </div>

              {selectedReceiptOrder.suborders.map((sub: any) => (
                <div key={sub._id} className="bg-slate-50 p-3 rounded-2xl space-y-2">
                  <p className="font-bold text-slate-900">{sub.storeId?.name || 'Store'}</p>
                  {sub.items.map((i: any, idx: number) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex justify-between text-[11px]">
                        <span>
                          {i.quantity}x {i.name}
                        </span>
                        <span>₹{i.subtotal}</span>
                      </div>
                      {(i.selectedVariant || (i.selectedAddons && i.selectedAddons.length > 0)) && (
                        <div className="text-[10px] text-slate-500 pl-2">
                          {i.selectedVariant && <span>[{i.selectedVariant.name}] </span>}
                          {i.selectedAddons && i.selectedAddons.length > 0 && (
                            <span>(+{i.selectedAddons.map((a: any) => a.name).join(', ')})</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {sub.deliveryFee > 0 && (
                    <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                      <span>Delivery Fee</span>
                      <span>₹{sub.deliveryFee}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-xs pt-1 border-t border-slate-200 text-slate-900">
                    <span>Store Subtotal</span>
                    <span>₹{sub.totalAmount}</span>
                  </div>
                </div>
              ))}

              <div className="pt-2 border-t-2 border-slate-900 flex justify-between font-bold text-base text-slate-900">
                <span>Total Paid:</span>
                <span className="text-emerald-700">₹{selectedReceiptOrder.totalAmount}</span>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Campus Receipt</span>
            </button>
          </div>
        </div>
      )}

      {/* Complaint Filing Modal */}
      {complaintModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitComplaint}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <MessageSquareWarning className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-sm">Report to Campus Administrator</h3>
              </div>
              <button
                type="button"
                onClick={() => setComplaintModalOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Campus administration investigates store delays, hygiene, incorrect items, or payment grievances.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Subject</label>
              <input
                type="text"
                required
                value={complaintSubject}
                onChange={(e) => setComplaintSubject(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Description of Issue</label>
              <textarea
                required
                rows={3}
                placeholder="Explain the problem (e.g. food was cold, merchant refused pickup, missing item)..."
                value={complaintDesc}
                onChange={(e) => setComplaintDesc(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="pt-2 flex items-center space-x-2">
              <button
                type="submit"
                disabled={submittingComplaint}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-2xs"
              >
                {submittingComplaint ? 'Submitting...' : 'Register Complaint'}
              </button>
              <button
                type="button"
                onClick={() => setComplaintModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
