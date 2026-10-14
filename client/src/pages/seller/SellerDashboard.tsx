import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store as StoreIcon,
  ShoppingBag,
  TrendingUp,
  Package,
  AlertTriangle,
  Clock,
  Plus,
  Download,
  CheckCircle2,
  XCircle,
  ChefHat,
  Bike,
  FileSpreadsheet,
  Settings,
  History,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

export const SellerDashboard: React.FC = () => {
  const { user, isSeller, isAdmin } = useAuth();
  const { socket, liveStocks } = useSocket();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'orders' | 'inventory' | 'movements' | 'settings'
  >('overview');

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);

  // Modals
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [stockAdjustModalOpen, setStockAdjustModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<any>(null);
  const [adjustType, setAdjustType] = useState<
    'restock' | 'adjustment' | 'wastage' | 'damaged' | 'expired'
  >('restock');
  const [adjustDelta, setAdjustDelta] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>('');

  // Form states for product
  const [pName, setPName] = useState('');
  const [pBrand, setPBrand] = useState('');
  const [pCategory, setPCategory] = useState('kurkure');
  const [pUnit, setPUnit] = useState('1 unit');
  const [pVariant, setPVariant] = useState('Standard');
  const [pSellingPrice, setPSellingPrice] = useState<number>(20);
  const [pCostPrice, setPCostPrice] = useState<number>(15);
  const [pStock, setPStock] = useState<number>(20);
  const [pThreshold, setPThreshold] = useState<number>(5);
  const [pDescription, setPDescription] = useState('');
  const [pIsComparable, setPIsComparable] = useState(false);
  const [pComparableKey, setPComparableKey] = useState('');

  // Store settings form
  const [storeOpen, setStoreOpen] = useState(true);
  const [openingHours, setOpeningHours] = useState('');
  const [offersDelivery, setOffersDelivery] = useState(true);
  const [deliveryFee, setDeliveryFee] = useState<number>(10);
  const [minimumOrder, setMinimumOrder] = useState<number>(40);
  const [prepTime, setPrepTime] = useState('15-20 mins');
  const [contactPhone, setContactPhone] = useState('');

  // Product search filter
  const [inventorySearch, setInventorySearch] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, ordersRes, productsRes, movementsRes] = await Promise.all([
        apiRequest('/seller/dashboard'),
        apiRequest('/seller/orders?limit=100'),
        apiRequest('/products?storeId=' + (user?.assignedStoreId?._id || user?.assignedStoreId) + '&limit=100'),
        apiRequest('/seller/inventory-movements?limit=50')
      ]);

      if (statsRes.success) {
        setDashboardData(statsRes);
        setStoreOpen(statsRes.store.isOpen);
        setOpeningHours(statsRes.store.openingHours);
        setOffersDelivery(statsRes.store.offersDelivery);
        setDeliveryFee(statsRes.store.deliveryFee);
        setMinimumOrder(statsRes.store.minimumOrder);
        setPrepTime(statsRes.store.estimatedPrepTime);
      }

      if (ordersRes.success) {
        setOrders(ordersRes.orders);
      }

      if (productsRes.success) {
        setProducts(productsRes.products);
      }

      if (movementsRes.success) {
        setMovements(movementsRes.movements);
      }
    } catch (err: any) {
      console.error('Failed to load seller dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSeller && !isAdmin) {
      navigate('/login');
      return;
    }
    fetchDashboardData();
  }, [user]);

  // Real-time Order arrival & status updates via Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (newSubOrder: any) => {
      // console.log('[Seller Received New SubOrder Realtime]', newSubOrder);
      setOrders((prev) => [newSubOrder, ...prev]);
      // Play a gentle alert chime
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audio.play().catch(() => {});
      } catch (e) {}
    };

    socket.on('order:new', handleNewOrder);

    return () => {
      socket.off('order:new', handleNewOrder);
    };
  }, [socket]);

  // Store open/close quick toggle
  const handleToggleStoreOpen = async () => {
    if (!dashboardData?.store?._id) return;
    try {
      const newStatus = !storeOpen;
      setStoreOpen(newStatus);
      await apiRequest(`/stores/${dashboardData.store._id}/settings`, {
        method: 'PATCH',
        body: JSON.stringify({ isOpen: newStatus })
      });
      alert(`Store status changed to: ${newStatus ? 'OPEN' : 'CLOSED'}`);
    } catch (err: any) {
      alert(err.message || 'Failed to update store status');
      setStoreOpen(!storeOpen);
    }
  };

  // SubOrder status update (Accept, Preparing, Ready, Out, Complete, Reject)
  const handleUpdateOrderStatus = async (subOrderId: string, status: string) => {
    let rejectionReason: string | undefined;

    if (status === 'rejected') {
      const reason = prompt('Please specify a rejection reason (e.g. out of ingredients, closing early):');
      if (!reason) return;
      rejectionReason = reason;
    }

    try {
      const res = await apiRequest(`/seller/suborder/${subOrderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, rejectionReason })
      });

      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id === subOrderId ? { ...o, status, rejectionReason } : o))
        );
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  // Create or Update Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        storeId: dashboardData.store._id,
        name: pName,
        brand: pBrand,
        category: pCategory,
        unit: pUnit,
        variant: pVariant,
        sellingPrice: pSellingPrice,
        costPrice: pCostPrice,
        stock: pStock,
        lowStockThreshold: pThreshold,
        description: pDescription,
        isComparable: pIsComparable,
        comparableGroupKey: pIsComparable ? pComparableKey || pName.toLowerCase().replace(/\s+/g, '-') : undefined
      };

      if (editingProduct) {
        await apiRequest(`/products/${editingProduct._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        alert('Product updated successfully!');
      } else {
        await apiRequest('/products', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        alert('New product added to store catalogue!');
      }

      setProductModalOpen(false);
      setEditingProduct(null);
      await fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Failed to save product');
    }
  };

  const openAddProductModal = () => {
    setEditingProduct(null);
    setPName('');
    setPBrand('');
    setPCategory('kurkure');
    setPUnit('1 unit');
    setPVariant('Standard');
    setPSellingPrice(20);
    setPCostPrice(15);
    setPStock(25);
    setPThreshold(5);
    setPDescription('');
    setPIsComparable(false);
    setPComparableKey('');
    setProductModalOpen(true);
  };

  const openEditProductModal = (product: any) => {
    setEditingProduct(product);
    setPName(product.name);
    setPBrand(product.brand);
    setPCategory(product.category);
    setPUnit(product.unit);
    setPVariant(product.variant || 'Standard');
    setPSellingPrice(product.sellingPrice);
    setPCostPrice(product.costPrice || product.sellingPrice * 0.75);
    setPStock(product.stock);
    setPThreshold(product.lowStockThreshold || 5);
    setPDescription(product.description || '');
    setPIsComparable(product.isComparable || false);
    setPComparableKey(product.comparableGroupKey || '');
    setProductModalOpen(true);
  };

  // Stock Adjustment with Mandatory Reason
  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    if (!adjustReason.trim()) {
      alert('Mandatory reason is required for any inventory adjustment or restock.');
      return;
    }

    try {
      const deltaNumber = ['wastage', 'damaged', 'expired'].includes(adjustType)
        ? -Math.abs(adjustDelta)
        : Number(adjustDelta);

      const res = await apiRequest(`/products/${adjustingProduct._id}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({
          type: adjustType,
          delta: deltaNumber,
          reason: adjustReason.trim()
        })
      });

      if (res.success) {
        alert(
          `Stock successfully adjusted! New stock: ${res.product.stock}. Synchronized in real time.`
        );
        setStockAdjustModalOpen(false);
        setAdjustingProduct(null);
        setAdjustReason('');
        await fetchDashboardData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to adjust stock');
    }
  };

  // Export Inventory CSV
  const handleExportCSV = async () => {
    try {
      const csvText = await apiRequest('/seller/inventory-export');
      const blob = new Blob([csvText], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dashboardData?.store?.slug || 'store'}-inventory.csv`;
      a.click();
    } catch (err: any) {
      alert(err.message || 'Failed to export inventory CSV');
    }
  };

  // Save Store Settings
  const handleSaveStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest(`/stores/${dashboardData.store._id}/settings`, {
        method: 'PATCH',
        body: JSON.stringify({
          isOpen: storeOpen,
          openingHours,
          offersDelivery,
          deliveryFee,
          minimumOrder,
          estimatedPrepTime: prepTime,
          contactPhone
        })
      });
      alert('Store settings saved successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to save store settings');
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading your dedicated store dashboard...</p>
      </div>
    );
  }

  const filteredInventory = products.filter(
    (p) =>
      inventorySearch === '' ||
      p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      p.category.toLowerCase().includes(inventorySearch.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto">
      {/* Store Banner & Quick Status Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-2xl shrink-0">
            <StoreIcon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-extrabold brand-font tracking-tight">
                {dashboardData?.store?.name}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Assigned Store
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Store Manager: <span className="text-slate-200 font-medium">{user?.name}</span> •{' '}
              {dashboardData?.store?.location}
            </p>
          </div>
        </div>

        {/* Quick Open/Close Toggle */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleToggleStoreOpen}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 border shadow-sm ${
              storeOpen
                ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500'
                : 'bg-rose-600 text-white border-rose-500 hover:bg-rose-500'
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                storeOpen ? 'bg-white live-pulse' : 'bg-white'
              }`}
            />
            <span>{storeOpen ? 'Store is OPEN' : 'Store is CLOSED'}</span>
          </button>

          <button
            onClick={fetchDashboardData}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl border border-slate-700 text-xs"
            title="Refresh Store Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 space-x-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'overview', name: 'Overview & Analytics', icon: TrendingUp },
          { id: 'orders', name: `Order Queue (${orders.filter((o) => o.status === 'pending').length} pending)`, icon: ShoppingBag },
          { id: 'inventory', name: `Inventory (${products.length} items)`, icon: Package },
          { id: 'movements', name: 'Audit Log & Movements', icon: History },
          { id: 'settings', name: 'Store Settings', icon: Settings }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-bold text-xs whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-medium">Today's Sales</span>
              <p className="text-2xl font-extrabold text-slate-900">
                ₹{dashboardData?.stats?.todaySales || 0}
              </p>
              <span className="text-[11px] text-emerald-600 font-semibold">
                {dashboardData?.stats?.todayOrdersCount || 0} order(s) today
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-medium">Lifetime Sales</span>
              <p className="text-2xl font-extrabold text-slate-900">
                ₹{dashboardData?.stats?.totalLifetimeSales || 0}
              </p>
              <span className="text-[11px] text-slate-500">
                Total Orders: {dashboardData?.stats?.totalOrdersCount || 0}
              </span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-medium">Estimated Gross Profit</span>
              <p className="text-2xl font-extrabold text-emerald-700">
                ₹{dashboardData?.stats?.inventory?.estimatedGrossProfit || 0}
              </p>
              <span className="text-[11px] text-slate-500">Based on private cost price</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs text-slate-500 font-medium">Inventory Stock Warnings</span>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-extrabold text-amber-600">
                  {dashboardData?.stats?.inventory?.lowStockCount || 0}
                </span>
                <span className="text-xs text-slate-400">low /</span>
                <span className="text-2xl font-extrabold text-rose-600">
                  {dashboardData?.stats?.inventory?.outOfStockCount || 0}
                </span>
                <span className="text-xs text-slate-400">out</span>
              </div>
              <span className="text-[11px] text-slate-500">Requires restocking</span>
            </div>
          </div>

          {/* Inventory Valuation Breakdown */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">Live Inventory Valuation</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                <p className="text-slate-500">Total Stock On Shelf</p>
                <p className="text-xl font-bold text-slate-900">
                  {dashboardData?.stats?.inventory?.totalStockUnits || 0} units
                </p>
                <p className="text-[11px] text-slate-400">Across {products.length} catalog items</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl space-y-1">
                <p className="text-slate-500">Total Cost Valuation (Recorded)</p>
                <p className="text-xl font-bold text-slate-900">
                  ₹{dashboardData?.stats?.inventory?.totalCostValuation || 0}
                </p>
                <p className="text-[11px] text-slate-400">Sum of (Stock × Supplier Cost)</p>
              </div>

              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-1">
                <p className="text-emerald-800 font-semibold">Total Retail Potential</p>
                <p className="text-xl font-bold text-emerald-900">
                  ₹{dashboardData?.stats?.inventory?.totalRetailValuation || 0}
                </p>
                <p className="text-[11px] text-emerald-700">Gross margin ready to realize</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={openAddProductModal}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Product to Store</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export Store Inventory CSV</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE ORDERS QUEUE */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Store Orders Queue</h2>
            <span className="text-xs text-slate-500">
              New orders pop up here in real time via Socket.IO
            </span>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-500">
              No orders received for this store yet.
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((subOrder) => (
                <div
                  key={subOrder._id}
                  className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-sm text-slate-900">
                          {subOrder.subOrderNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            subOrder.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {subOrder.paymentStatus}
                        </span>
                        <span className="text-xs text-slate-500 font-medium capitalize">
                          • {subOrder.fulfillmentType}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Placed: {new Date(subOrder.createdAt).toLocaleTimeString()} • Customer:{' '}
                        <span className="font-semibold text-slate-700">{subOrder.studentName}</span>{' '}
                        ({subOrder.studentPhone})
                      </p>
                      {subOrder.deliveryAddress && (
                        <p className="text-[11px] text-emerald-700 font-medium">
                          📍 Hostel Room: {subOrder.deliveryAddress}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400">Suborder Total</span>
                      <p className="text-xl font-extrabold text-emerald-700 leading-none">
                        ₹{subOrder.totalAmount}
                      </p>
                    </div>
                  </div>

                  {/* Items Ordered */}
                  <div className="space-y-1.5 text-xs text-slate-700">
                    {subOrder.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center py-1 border-b border-slate-50">
                        <span className="font-medium">
                          {item.quantity}x {item.name} ({item.unit})
                        </span>
                        <span className="font-bold text-slate-900">₹{item.subtotal}</span>
                      </div>
                    ))}
                  </div>

                  {/* Status Progression Controls */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500">Current Status:</span>
                      <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800">
                        {subOrder.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {subOrder.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateOrderStatus(subOrder._id, 'accepted')}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
                          >
                            ✓ Accept Order
                          </button>
                          <button
                            onClick={() => handleUpdateOrderStatus(subOrder._id, 'rejected')}
                            className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-colors"
                          >
                            ✕ Reject (Refunds Stock)
                          </button>
                        </>
                      )}

                      {subOrder.status === 'accepted' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(subOrder._id, 'preparing')}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1"
                        >
                          <ChefHat className="w-3.5 h-3.5" />
                          <span>Start Preparing</span>
                        </button>
                      )}

                      {subOrder.status === 'preparing' && (
                        <button
                          onClick={() =>
                            handleUpdateOrderStatus(
                              subOrder._id,
                              subOrder.fulfillmentType === 'delivery'
                                ? 'out_for_delivery'
                                : 'ready_for_pickup'
                            )
                          }
                          className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1"
                        >
                          <Bike className="w-3.5 h-3.5" />
                          <span>
                            {subOrder.fulfillmentType === 'delivery'
                              ? 'Dispatch for Delivery'
                              : 'Mark Ready for Pickup'}
                          </span>
                        </button>
                      )}

                      {(subOrder.status === 'ready_for_pickup' ||
                        subOrder.status === 'out_for_delivery') && (
                        <button
                          onClick={() => handleUpdateOrderStatus(subOrder._id, 'completed')}
                          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Complete & Handover</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: INVENTORY MANAGEMENT */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products in your store..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={openAddProductModal}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="inline-flex items-center space-x-1 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-800 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Item Name</th>
                    <th className="py-3 px-3">Brand / Category</th>
                    <th className="py-3 px-3">Selling Price</th>
                    <th className="py-3 px-3">Cost Price</th>
                    <th className="py-3 px-3">Current Stock</th>
                    <th className="py-3 px-3">Threshold</th>
                    <th className="py-3 px-3">Availability</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInventory.map((product) => {
                    const live = liveStocks[product._id];
                    const stock = live ? live.stock : product.stock;
                    const isOutOfStock = stock <= 0;
                    const isLowStock = stock > 0 && stock <= product.lowStockThreshold;

                    return (
                      <tr key={product._id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {product.name}
                          <span className="block text-[11px] font-normal text-slate-400">
                            {product.unit} {product.variant && `• ${product.variant}`}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-medium text-slate-800">{product.brand}</span>
                          <span className="block text-[10px] text-slate-400 capitalize">
                            {product.category}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">₹{product.sellingPrice}</td>
                        <td className="py-3 px-3 text-slate-500">₹{product.costPrice || '—'}</td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          <span
                            className={
                              isOutOfStock
                                ? 'text-rose-600'
                                : isLowStock
                                ? 'text-amber-600'
                                : 'text-emerald-700'
                            }
                          >
                            {stock}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500">{product.lowStockThreshold}</td>
                        <td className="py-3 px-3">
                          {isOutOfStock ? (
                            <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Out of Stock
                            </span>
                          ) : isLowStock ? (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Low Stock
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-medium px-2 py-0.5 rounded-full">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setAdjustingProduct(product);
                              setAdjustType('restock');
                              setAdjustDelta(10);
                              setAdjustReason('');
                              setStockAdjustModalOpen(true);
                            }}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold text-[11px]"
                            title="Adjust inventory with mandatory reason"
                          >
                            Adjust Stock
                          </button>
                          <button
                            onClick={() => openEditProductModal(product)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-[11px]"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOGS & MOVEMENTS */}
      {activeTab === 'movements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Inventory Movement Audit Trail</h2>
            <span className="text-xs text-slate-500">
              Complete traceable record of sales, supplier restocks, and wastage
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-800 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-3">Product</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Change (Delta)</th>
                    <th className="py-3 px-3">Stock Before / After</th>
                    <th className="py-3 px-3">Action By</th>
                    <th className="py-3 px-4">Mandatory Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map((m) => (
                    <tr key={m._id} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(m.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {m.productId?.name || 'Product'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {m.type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold">
                        <span className={m.delta >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                          {m.delta >= 0 ? `+${m.delta}` : m.delta}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">
                        {m.stockBefore} → {m.stockAfter}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{m.userName || 'System'}</td>
                      <td className="py-2.5 px-4 text-slate-700 max-w-xs truncate" title={m.reason}>
                        {m.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: STORE SETTINGS */}
      {activeTab === 'settings' && (
        <form
          onSubmit={handleSaveStoreSettings}
          className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-5 max-w-2xl shadow-sm"
        >
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
            Store Fulfillment & Timings Configuration
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Opening Hours</label>
              <input
                type="text"
                value={openingHours}
                onChange={(e) => setOpeningHours(e.target.value)}
                placeholder="08:00 AM - 09:30 PM"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Estimated Prep Time</label>
              <input
                type="text"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                placeholder="10-15 mins"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Delivery Fee (₹)</label>
              <input
                type="number"
                min="0"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Minimum Order (₹)</label>
              <input
                type="number"
                min="0"
                value={minimumOrder}
                onChange={(e) => setMinimumOrder(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={offersDelivery}
                onChange={(e) => setOffersDelivery(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span>Enable Hostel Delivery for this store</span>
            </label>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Save Store Configuration
            </button>
          </div>
        </form>
      )}

      {/* Product Add / Edit Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveProduct}
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingProduct ? 'Edit Store Product' : 'Add New Product to Store'}
              </h3>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kurkure Chilli Chatka"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Brand</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PepsiCo / Haldiram"
                    value={pBrand}
                    onChange={(e) => setPBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Category</label>
                  <select
                    value={pCategory}
                    onChange={(e) => setPCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="kurkure">Kurkure</option>
                    <option value="chips">Chips</option>
                    <option value="biscuits">Biscuits</option>
                    <option value="chocolates">Chocolates</option>
                    <option value="cold drinks">Cold Drinks</option>
                    <option value="maggi">Maggi</option>
                    <option value="noodles">Noodles</option>
                    <option value="fast food">Fast Food</option>
                    <option value="stationery">Stationery</option>
                    <option value="groceries">Groceries</option>
                    <option value="daily essentials">Daily Essentials</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Selling Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={pSellingPrice}
                    onChange={(e) => setPSellingPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">
                    Cost Price (₹) <span className="text-slate-400 text-[10px]">(Private)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={pCostPrice}
                    onChange={(e) => setPCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={pStock}
                    onChange={(e) => setPStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Low Stock Alert Threshold</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={pThreshold}
                    onChange={(e) => setPThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Unit</label>
                  <input
                    type="text"
                    placeholder="90g pack / 500ml / piece"
                    value={pUnit}
                    onChange={(e) => setPUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Variant</label>
                  <input
                    type="text"
                    placeholder="Standard / Spicy / Large"
                    value={pVariant}
                    onChange={(e) => setPVariant(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Description</label>
                <textarea
                  rows={2}
                  placeholder="Short description of the product..."
                  value={pDescription}
                  onChange={(e) => setPDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <label className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pIsComparable}
                    onChange={(e) => setPIsComparable(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Enable Cross-Store Price Comparison</span>
                </label>

                {pIsComparable && (
                  <input
                    type="text"
                    placeholder="Comparison key (e.g. kurkure-masala-munch-90g)"
                    value={pComparableKey}
                    onChange={(e) => setPComparableKey(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                )}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                Save Product
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stock Adjustment Modal (Mandatory Reason) */}
      {stockAdjustModalOpen && adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAdjustStock}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Adjust Product Inventory</h3>
                <p className="text-[11px] text-slate-500">{adjustingProduct.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setStockAdjustModalOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Current Available Stock:</span>
              <span className="font-mono font-bold text-base text-slate-900">
                {adjustingProduct.stock} units
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Movement Type</label>
              <select
                value={adjustType}
                onChange={(e) => setAdjustType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                <option value="restock">Restock from Supplier (+)</option>
                <option value="adjustment">Physical Count Adjustment (+/-)</option>
                <option value="wastage">Wastage (-)</option>
                <option value="damaged">Damaged Goods (-)</option>
                <option value="expired">Expired Products (-)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Quantity Delta</label>
              <input
                type="number"
                required
                value={adjustDelta}
                onChange={(e) => setAdjustDelta(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Mandatory Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={2}
                placeholder="e.g. Morning delivery from distributor, packaging damaged in transit, physical recount discrepancy..."
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setStockAdjustModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
              >
                Commit Adjustment & Broadcast
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
