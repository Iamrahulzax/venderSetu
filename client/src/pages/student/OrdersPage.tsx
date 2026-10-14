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
  ArrowRight
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<any>(null);

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

  // Listen to real-time order status updates from sellers via Socket.IO!
  useEffect(() => {
    if (!socket) return;

    const handleOrderStatusUpdate = (updatedSubOrder: any) => {
      // console.log('[Realtime Order Update Received]', updatedSubOrder);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center space-x-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Order Placed (Pending Store Approval)</span>
          </span>
        );
      case 'accepted':
        return (
          <span className="inline-flex items-center space-x-1 bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            <span>Store Accepted</span>
          </span>
        );
      case 'preparing':
        return (
          <span className="inline-flex items-center space-x-1 bg-indigo-50 text-indigo-800 border border-indigo-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
            <ChefHat className="w-3 h-3 text-indigo-600" />
            <span>Kitchen / Store Preparing</span>
          </span>
        );
      case 'ready_for_pickup':
        return (
          <span className="inline-flex items-center space-x-1 bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
            <span>Ready for Pickup at Counter</span>
          </span>
        );
      case 'out_for_delivery':
        return (
          <span className="inline-flex items-center space-x-1 bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
            <Bike className="w-3 h-3 text-teal-600" />
            <span>Out for Hostel Delivery</span>
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center space-x-1 bg-slate-100 text-slate-800 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
            <CheckCircle2 className="w-3 h-3 text-slate-600" />
            <span>Fulfilled & Received</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center space-x-1 bg-rose-50 text-rose-800 border border-rose-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Store Rejected (Refunded)</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center space-x-1 bg-slate-100 text-slate-500 px-2.5 py-0.5 rounded-full text-[11px] font-medium">
            <XCircle className="w-3 h-3 text-slate-400" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  if (!user) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto my-12 space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Please Sign In</h2>
        <p className="text-xs text-slate-500">Sign in to track your active orders and receipts.</p>
        <Link
          to="/login"
          className="inline-block bg-emerald-600 text-white font-semibold text-xs px-6 py-2.5 rounded-xl shadow-sm"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 brand-font">Order History & Tracking</h1>
          <p className="text-xs text-slate-500">
            Real-time status tracking for all campus stores with independent fulfillment
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition-colors flex items-center space-x-1 text-xs font-semibold"
          title="Refresh orders"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading your orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-4">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">No Orders Placed Yet</h2>
          <p className="text-xs text-slate-500">
            You haven't placed any orders yet. Discover items from your favourite campus shops!
          </p>
          <Link
            to="/"
            className="inline-flex items-center space-x-1.5 bg-emerald-600 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm"
          >
            <span>Explore Campus Stores</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm space-y-4"
            >
              {/* Parent Order Banner */}
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
                      • {order.paymentMethod.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Placed on {new Date(order.createdAt).toLocaleString()} • Total Amount: ₹
                    {order.totalAmount}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedReceiptOrder(order)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>View Receipt</span>
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

              {/* Individual Store SubOrders (Independent Fulfillment) */}
              <div className="p-5 pt-0 space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Store Suborders ({order.suborders.length})
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {order.suborders.map((sub: any) => (
                    <div
                      key={sub._id}
                      className="border border-slate-200 rounded-2xl p-4 bg-white flex flex-col justify-between space-y-3 shadow-xs"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                              <StoreIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-900 text-xs">
                                {sub.storeId?.name || 'Store'}
                              </h3>
                              <span className="font-mono text-[10px] text-slate-400">
                                {sub.subOrderNumber}
                              </span>
                            </div>
                          </div>

                          {getStatusBadge(sub.status)}
                        </div>

                        {/* Items in this suborder */}
                        <div className="space-y-1.5 pt-1 border-t border-slate-100 text-xs text-slate-700">
                          {sub.items.map((i: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between">
                              <span className="truncate max-w-[180px]">
                                {i.quantity}x {i.name}
                              </span>
                              <span className="font-semibold text-slate-900">₹{i.subtotal}</span>
                            </div>
                          ))}
                        </div>

                        {/* Delivery fee & subtotal */}
                        <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span>Fulfillment:</span>
                            <span className="font-medium text-slate-800 capitalize">
                              {sub.fulfillmentType === 'delivery'
                                ? `Delivery (${sub.deliveryAddress || 'Hostel'})`
                                : 'Counter Pickup'}
                            </span>
                          </div>
                          {sub.deliveryFee > 0 && (
                            <div className="flex items-center justify-between">
                              <span>Delivery Fee:</span>
                              <span>₹{sub.deliveryFee}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between font-bold text-slate-900 pt-1">
                            <span>Suborder Total:</span>
                            <span className="text-sm font-extrabold text-emerald-700">
                              ₹{sub.totalAmount}
                            </span>
                          </div>
                        </div>

                        {sub.rejectionReason && (
                          <div className="bg-rose-50 p-2 rounded-xl text-[11px] text-rose-800 border border-rose-100">
                            <span className="font-semibold">Rejection reason: </span>
                            {sub.rejectionReason}
                          </div>
                        )}
                      </div>

                      {/* Suborder actions */}
                      {sub.status === 'pending' && (
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                          <button
                            onClick={() => handleCancelSubOrder(sub._id)}
                            className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline"
                          >
                            Cancel Suborder
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
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
                <h3 className="font-bold text-slate-900 text-base brand-font">VenderSetu Receipt</h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  Order #{selectedReceiptOrder.orderNumber}
                </p>
              </div>
              <button
                onClick={() => setSelectedReceiptOrder(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700"
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
                  {selectedReceiptOrder.paymentMethod.replace(/_/g, ' ')} ({selectedReceiptOrder.paymentStatus})
                </span>
              </div>

              {selectedReceiptOrder.suborders.map((sub: any) => (
                <div key={sub._id} className="bg-slate-50 p-3 rounded-2xl space-y-2">
                  <p className="font-bold text-slate-900">{sub.storeId?.name || 'Store'}</p>
                  {sub.items.map((i: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-[11px]">
                      <span>
                        {i.quantity}x {i.name}
                      </span>
                      <span>₹{i.subtotal}</span>
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
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
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
                <h3 className="font-bold text-slate-900 text-sm">Submit Issue to Administrator</h3>
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
              Campus administrator reviews all merchant quality, delay, and refund complaints.
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
                placeholder="Explain the problem (e.g. store rejected without reason, incorrect item received, delayed pickup)..."
                value={complaintDesc}
                onChange={(e) => setComplaintDesc(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="pt-2 flex items-center space-x-2">
              <button
                type="submit"
                disabled={submittingComplaint}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold"
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
