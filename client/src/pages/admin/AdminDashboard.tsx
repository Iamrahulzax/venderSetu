import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Store as StoreIcon,
  Users,
  ShoppingBag,
  AlertTriangle,
  FileSpreadsheet,
  MessageSquareWarning,
  History,
  CheckCircle2,
  XCircle,
  UserCheck,
  UserX,
  Search,
  Download,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'sellers' | 'stores' | 'orders' | 'stock' | 'complaints' | 'audit'
  >('overview');

  const [loading, setLoading] = useState<boolean>(true);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [sellers, setSellers] = useState<any[]>([]);
  const [platformOrders, setPlatformOrders] = useState<any[]>([]);
  const [stockAlerts, setStockAlerts] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [overviewRes, sellersRes, ordersRes, alertsRes, complaintsRes, auditRes] =
        await Promise.all([
          apiRequest('/admin/overview'),
          apiRequest('/admin/sellers'),
          apiRequest('/admin/orders?limit=50'),
          apiRequest('/admin/stock-alerts'),
          apiRequest('/admin/complaints'),
          apiRequest('/admin/audit-logs?limit=50')
        ]);

      if (overviewRes.success) setOverviewData(overviewRes);
      if (sellersRes.success) setSellers(sellersRes.sellers);
      if (ordersRes.success) setPlatformOrders(ordersRes.orders);
      if (alertsRes.success) setStockAlerts(alertsRes.alerts);
      if (complaintsRes.success) setComplaints(complaintsRes.complaints);
      if (auditRes.success) setAuditLogs(auditRes.logs);
    } catch (err) {
      console.error('Failed to load admin console', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate('/login');
      return;
    }
    fetchAdminData();
  }, [user]);

  // Update seller approval or suspension
  const handleUpdateSeller = async (sellerId: string, updates: any) => {
    try {
      const res = await apiRequest(`/admin/sellers/${sellerId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      if (res.success) {
        setSellers((prev) =>
          prev.map((s) => (s._id === sellerId ? { ...s, ...updates } : s))
        );
        alert('Seller status updated successfully.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update seller');
    }
  };

  // Re-assign seller to store
  const handleAssignStore = async (sellerId: string, storeId: string) => {
    try {
      const res = await apiRequest(`/admin/sellers/${sellerId}`, {
        method: 'PATCH',
        body: JSON.stringify({ assignedStoreId: storeId })
      });
      if (res.success) {
        alert('Store assignment updated.');
        await fetchAdminData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to re-assign store');
    }
  };

  // Update complaint status & notes
  const handleResolveComplaint = async (complaintId: string, status: string) => {
    const adminNotes = prompt('Enter resolution or administrative notes:') || '';
    try {
      const res = await apiRequest(`/admin/complaints/${complaintId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, adminNotes })
      });
      if (res.success) {
        setComplaints((prev) =>
          prev.map((c) => (c._id === complaintId ? { ...c, status, adminNotes } : c))
        );
        alert(`Complaint status set to: ${status}`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update complaint');
    }
  };

  // Export platform CSV report
  const handleExportPlatformReport = async () => {
    try {
      const csvText = await apiRequest('/admin/export-report');
      const blob = new Blob([csvText], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vendersetu-platform-report-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    } catch (err: any) {
      alert(err.message || 'Failed to export platform report');
    }
  };

  if (loading && !overviewData) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="inline-block w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading Platform Administrator Console...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-600/30 border border-purple-500/40 text-purple-400 flex items-center justify-center font-bold text-2xl shrink-0">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-extrabold brand-font tracking-tight">
                Campus Admin Console
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Superuser Access
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Platform Overview • 5 Authorized Stores • Realtime Stock Oversight
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportPlatformReport}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-xs font-bold transition-colors flex items-center space-x-2 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Platform CSV</span>
          </button>

          <button
            onClick={fetchAdminData}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 text-xs"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'overview', name: 'Platform Overview', icon: TrendingUp },
          { id: 'sellers', name: `Sellers (${sellers.length})`, icon: Users },
          { id: 'stores', name: '5 Campus Stores', icon: StoreIcon },
          { id: 'orders', name: `Orders (${platformOrders.length})`, icon: ShoppingBag },
          { id: 'stock', name: `Stock Alerts (${stockAlerts.length})`, icon: AlertTriangle },
          { id: 'complaints', name: `Complaints (${complaints.filter((c) => c.status === 'open').length} open)`, icon: MessageSquareWarning },
          { id: 'audit', name: 'Audit Logs', icon: History }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-bold text-xs whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PLATFORM OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-medium">Campus Platform Revenue</span>
              <p className="text-2xl font-extrabold text-slate-900">
                ₹{overviewData?.stats?.totalRevenue || 0}
              </p>
              <span className="text-[11px] text-emerald-600 font-semibold">
                {overviewData?.stats?.totalOrders || 0} total orders placed
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-medium">Active Stores</span>
              <p className="text-2xl font-extrabold text-slate-900">
                {overviewData?.stats?.totalStores || 5}
              </p>
              <span className="text-[11px] text-slate-500">
                {overviewData?.stats?.totalProducts || 0} total products listed
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-medium">Registered Campus Users</span>
              <p className="text-2xl font-extrabold text-slate-900">
                {overviewData?.stats?.totalUsers || 0}
              </p>
              <span className="text-[11px] text-slate-500">
                {overviewData?.stats?.totalStudents || 0} students • {overviewData?.stats?.totalSellers || 0} sellers
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-medium">Pending Complaints</span>
              <p className="text-2xl font-extrabold text-rose-600">
                {overviewData?.stats?.pendingComplaints || 0}
              </p>
              <span className="text-[11px] text-slate-500">Requires administrator review</span>
            </div>
          </div>

          {/* 5 Stores Operational Quick Table */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">Participating Campus Stores</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-800 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Store Name</th>
                    <th className="py-3 px-3">Location</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Opening Hours</th>
                    <th className="py-3 px-3">Delivery Option</th>
                    <th className="py-3 px-3">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {overviewData?.stores?.map((store: any) => (
                    <tr key={store._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-slate-900">{store.name}</td>
                      <td className="py-3 px-3">{store.location}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            store.isOpen
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {store.isOpen ? 'Open' : 'Closed'}
                        </span>
                      </td>
                      <td className="py-3 px-3">{store.openingHours}</td>
                      <td className="py-3 px-3">
                        {store.offersDelivery ? `Yes (₹${store.deliveryFee})` : 'Pickup Only'}
                      </td>
                      <td className="py-3 px-3">{store.contactPhone || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MANAGE SELLERS */}
      {activeTab === 'sellers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Manage Store Seller Accounts</h2>
            <span className="text-xs text-slate-500">
              Approve, suspend, or re-assign merchants to campus stores
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-800 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Seller Name</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Assigned Store</th>
                    <th className="py-3 px-3">Approval Status</th>
                    <th className="py-3 px-3">Account Status</th>
                    <th className="py-3 px-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sellers.map((seller) => (
                    <tr key={seller._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-bold text-slate-900">{seller.name}</td>
                      <td className="py-3 px-3">{seller.email}</td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {seller.assignedStoreId?.name || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            seller.isApproved
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {seller.isApproved ? 'Approved' : 'Pending Approval'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            seller.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {seller.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {!seller.isApproved && (
                          <button
                            onClick={() => handleUpdateSeller(seller._id, { isApproved: true })}
                            className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px]"
                          >
                            Approve
                          </button>
                        )}
                        {seller.status === 'active' ? (
                          <button
                            onClick={() => handleUpdateSeller(seller._id, { status: 'suspended' })}
                            className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg font-bold text-[11px]"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateSeller(seller._id, { status: 'active' })}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-bold text-[11px]"
                          >
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 5 CAMPUS STORES */}
      {activeTab === 'stores' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {overviewData?.stores?.map((store: any) => (
            <div
              key={store._id}
              className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-base">{store.name}</h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      store.isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {store.isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">{store.location}</p>
                <p className="text-xs text-slate-600 mt-2">{store.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                <p>• Hours: {store.openingHours}</p>
                <p>• Delivery Fee: ₹{store.deliveryFee}</p>
                <p>• Minimum Order: ₹{store.minimumOrder}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: PLATFORM ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Campus Orders Log</h2>
            <span className="text-xs text-slate-500">Showing recent multi-store orders</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-800 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-3">Student</th>
                  <th className="py-3 px-3">Suborders</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3">Total Amount</th>
                  <th className="py-3 px-3">Fulfillment</th>
                  <th className="py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {platformOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{order.studentName}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                        {order.suborders ? order.suborders.length : 0} stores
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          order.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">₹{order.totalAmount}</td>
                    <td className="py-3 px-3 capitalize">{order.fulfillmentType}</td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: STOCK ALERTS ACROSS STORES */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm space-y-4">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Campus Low-Stock & Out-of-Stock Discrepancy Monitor
            </h2>
            <span className="text-xs text-rose-600 font-semibold">
              {stockAlerts.length} item(s) require merchant restock
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-800 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-3">Store</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Current Stock</th>
                  <th className="py-3 px-3">Threshold</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockAlerts.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-900">{item.name}</td>
                    <td className="py-3 px-3 font-semibold text-emerald-700">
                      {item.storeId?.name || 'Store'}
                    </td>
                    <td className="py-3 px-3 capitalize">{item.category}</td>
                    <td className="py-3 px-3 font-mono font-bold text-rose-600">{item.stock}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{item.lowStockThreshold}</td>
                    <td className="py-3 px-4">
                      {item.stock <= 0 ? (
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Out of Stock
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Low Stock Warning
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: STUDENT COMPLAINTS DESK */}
      {activeTab === 'complaints' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Student Complaints Desk</h2>
            <span className="text-xs text-slate-500">
              Review and resolve student delivery, quality, and refund complaints
            </span>
          </div>

          {complaints.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-500">
              No open complaints reported.
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.map((c) => (
                <div
                  key={c._id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-slate-900 text-sm">{c.subject}</h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            c.status === 'open'
                              ? 'bg-rose-100 text-rose-800'
                              : c.status === 'investigating'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Submitted by: <span className="text-slate-700 font-semibold">{c.studentName}</span> ({c.studentEmail}) • {new Date(c.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="space-x-1.5">
                      {c.status !== 'resolved' && (
                        <button
                          onClick={() => handleResolveComplaint(c._id, 'resolved')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                        >
                          Mark Resolved
                        </button>
                      )}
                      {c.status !== 'investigating' && c.status !== 'resolved' && (
                        <button
                          onClick={() => handleResolveComplaint(c._id, 'investigating')}
                          className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-semibold"
                        >
                          Investigate
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    "{c.description}"
                  </p>

                  {c.adminNotes && (
                    <p className="text-xs text-purple-800 bg-purple-50 p-2.5 rounded-xl border border-purple-100">
                      <span className="font-bold">Admin Resolution Note: </span>
                      {c.adminNotes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Security & Operational Audit Logs</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-800 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Actor Name</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-purple-800">{log.action}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{log.actorName}</td>
                    <td className="py-2.5 px-3 capitalize">{log.actorRole}</td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600 max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
