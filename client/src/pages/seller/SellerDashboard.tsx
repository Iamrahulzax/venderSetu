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
  FileSpreadsheet,
  Settings,
  History,
  RefreshCw,
  Search,
  Filter,
  Eye,
  FileText,
  DollarSign,
  CreditCard,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Edit3,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  BellRing
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardFooter, CardMedia, CardTitle, CardText } from '../../components/ui/Card';
import { Badge, Chip, VegBadge } from '../../components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, ConfirmDialog } from '../../components/ui/Dialog';
import { Input, Textarea, Select, Label } from '../../components/ui/Input';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { FileUploadZone } from '../../components/ui/FileUploadZone';
import { ImageWithFallback } from '../../components/ui/ImageWithFallback';
import { ProductDetailModal } from '../../components/ProductDetailModal';

export const SellerDashboard: React.FC = () => {
  const { user, isSeller, isAdmin } = useAuth();
  const { socket, liveStocks } = useSocket();
  const navigate = useNavigate();

  // Navigation tabs matching Section 8:
  // Overview | Orders | Menu & Products | Inventory | Stock History | Sales | Payments | Store Settings
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'orders'
    | 'menu'
    | 'inventory'
    | 'movements'
    | 'sales'
    | 'payments'
    | 'settings'
  >('overview');

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);

  // Modals & form state
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [stockAdjustModalOpen, setStockAdjustModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<any>(null);
  const [adjustType, setAdjustType] = useState<
    'restock' | 'adjustment' | 'wastage' | 'damaged' | 'expired'
  >('restock');
  const [adjustDelta, setAdjustDelta] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState<string>('');

  // Reject order modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingOrder, setRejectingOrder] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Physical Menu Upload Modal (PDF / Image)
  const [menuDocModalOpen, setMenuDocModalOpen] = useState(false);
  const [menuDocTitle, setMenuDocTitle] = useState('');
  const [menuDocFileUrl, setMenuDocFileUrl] = useState('');
  const [menuDocFileType, setMenuDocFileType] = useState<'pdf' | 'image'>('image');

  // Preview live menu item modal
  const [previewProduct, setPreviewProduct] = useState<any>(null);

  // Product Form states
  const [pName, setPName] = useState('');
  const [pBrand, setPBrand] = useState('');
  const [pCategory, setPCategory] = useState('burgers');
  const [pUnit, setPUnit] = useState('1 unit');
  const [pServingSize, setPServingSize] = useState('');
  const [pPrepTime, setPPrepTime] = useState('10-15 mins');
  const [pSellingPrice, setPSellingPrice] = useState<number>(50);
  const [pCostPrice, setPCostPrice] = useState<number>(30);
  const [pStock, setPStock] = useState<number>(20);
  const [pThreshold, setPThreshold] = useState<number>(5);
  const [pDescription, setPDescription] = useState('');
  const [pImage, setPImage] = useState('');
  const [pIsVeg, setPIsVeg] = useState(true);
  const [pIsAvailable, setPIsAvailable] = useState(true);
  const [pSku, setPSku] = useState('');
  const [pExpiryDate, setPExpiryDate] = useState('');
  const [pIsComparable, setPIsComparable] = useState(false);
  const [pComparableKey, setPComparableKey] = useState('');

  // Dynamic variants & add-ons for food menu
  const [pVariants, setPVariants] = useState<Array<{ name: string; price: number }>>([]);
  const [pAddons, setPAddons] = useState<Array<{ name: string; price: number }>>([]);
  const [newVarName, setNewVarName] = useState('');
  const [newVarPrice, setNewVarPrice] = useState<number>(0);
  const [newAddonName, setNewAddonName] = useState('');
  const [newAddonPrice, setNewAddonPrice] = useState<number>(0);

  // Store settings form
  const [storeOpen, setStoreOpen] = useState(true);
  const [openingHours, setOpeningHours] = useState('');
  const [offersDelivery, setOffersDelivery] = useState(true);
  const [deliveryFee, setDeliveryFee] = useState<number>(10);
  const [minimumOrder, setMinimumOrder] = useState<number>(40);
  const [prepTime, setPrepTime] = useState('15-20 mins');
  const [contactPhone, setContactPhone] = useState('');
  const [storeBanner, setStoreBanner] = useState('');

  // Filters
  const [inventorySearch, setInventorySearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Sound chime notification for new incoming order
  const playNewOrderChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch {
      // Audio context may require user interaction
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const storeId = user?.assignedStoreId?._id || user?.assignedStoreId;
      const [statsRes, ordersRes, productsRes, movementsRes] = await Promise.all([
        apiRequest('/seller/dashboard'),
        apiRequest('/seller/orders?limit=150'),
        apiRequest('/products?storeId=' + storeId + '&limit=150'),
        apiRequest('/seller/inventory-movements?limit=100')
      ]);

      if (statsRes.success) {
        setDashboardData(statsRes);
        setStoreOpen(statsRes.store.isOpen);
        setOpeningHours(statsRes.store.openingHours);
        setOffersDelivery(statsRes.store.offersDelivery);
        setDeliveryFee(statsRes.store.deliveryFee);
        setMinimumOrder(statsRes.store.minimumOrder);
        setPrepTime(statsRes.store.estimatedPrepTime);
        setStoreBanner(statsRes.store.bannerImage || '');
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

  // Real-time socket listener for incoming suborders
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewOrder = (newSubOrder: any) => {
      setOrders((prev) => [newSubOrder, ...prev]);
      playNewOrderChime();
    };

    socket.on('new_suborder', handleNewOrder);

    return () => {
      socket.off('new_suborder', handleNewOrder);
    };
  }, [socket, user]);

  const isFoodStore =
    dashboardData?.store?.slug &&
    ['college-canteen', 'durga-fast-food', 'monal-fast-food'].includes(dashboardData.store.slug);

  // Reset product form modal
  const openNewProductModal = () => {
    setEditingProduct(null);
    setPName('');
    setPBrand(dashboardData?.store?.name || 'In-House');
    setPCategory(isFoodStore ? 'burgers' : 'stationery');
    setPUnit('1 unit');
    setPServingSize('');
    setPPrepTime(dashboardData?.store?.estimatedPrepTime || '10-15 mins');
    setPSellingPrice(50);
    setPCostPrice(30);
    setPStock(25);
    setPThreshold(5);
    setPDescription('');
    setPImage('');
    setPIsVeg(true);
    setPIsAvailable(true);
    setPSku('');
    setPExpiryDate('');
    setPIsComparable(false);
    setPComparableKey('');
    setPVariants([]);
    setPAddons([]);
    setProductModalOpen(true);
  };

  const openEditProductModal = (prod: any) => {
    setEditingProduct(prod);
    setPName(prod.name);
    setPBrand(prod.brand);
    setPCategory(prod.category);
    setPUnit(prod.unit);
    setPServingSize(prod.servingSize || '');
    setPPrepTime(prod.prepTime || '');
    setPSellingPrice(prod.sellingPrice);
    setPCostPrice(prod.costPrice || prod.sellingPrice * 0.7);
    setPStock(prod.stock);
    setPThreshold(prod.lowStockThreshold);
    setPDescription(prod.description || '');
    setPImage(prod.image || '');
    setPIsVeg(prod.isVeg !== false);
    setPIsAvailable(prod.isAvailable !== false);
    setPSku(prod.sku || '');
    setPExpiryDate(prod.expiryDate ? new Date(prod.expiryDate).toISOString().slice(0, 10) : '');
    setPIsComparable(Boolean(prod.isComparable));
    setPComparableKey(prod.comparableGroupKey || '');
    setPVariants(prod.variants || []);
    setPAddons(prod.addons || []);
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: pName,
        brand: pBrand,
        category: pCategory,
        unit: pUnit,
        servingSize: pServingSize,
        prepTime: pPrepTime,
        sellingPrice: Number(pSellingPrice),
        costPrice: Number(pCostPrice),
        lowStockThreshold: Number(pThreshold),
        description: pDescription,
        image: pImage,
        isVeg: pIsVeg,
        isAvailable: pIsAvailable,
        sku: pSku || undefined,
        expiryDate: pExpiryDate ? new Date(pExpiryDate) : undefined,
        isComparable: pIsComparable,
        comparableGroupKey: pComparableKey || undefined,
        variants: pVariants,
        addons: pAddons
      };

      if (editingProduct) {
        const res = await apiRequest(`/products/${editingProduct._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        if (res.success) {
          setProductModalOpen(false);
          await fetchDashboardData();
        }
      } else {
        payload.stock = Number(pStock);
        payload.storeId = user?.assignedStoreId?._id || user?.assignedStoreId;
        const res = await apiRequest('/products', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (res.success) {
          setProductModalOpen(false);
          await fetchDashboardData();
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save product');
    }
  };

  const handleToggleProductAvailability = async (prod: any) => {
    try {
      const res = await apiRequest(`/products/${prod._id}/toggle-availability`, {
        method: 'PATCH'
      });
      if (res.success) {
        setProducts((prev) =>
          prev.map((p) => (p._id === prod._id ? { ...p, isAvailable: res.isAvailable } : p))
        );
      }
    } catch (err: any) {
      alert(err.message || 'Failed to toggle availability');
    }
  };

  const handleSoftDeleteProduct = async (prod: any) => {
    if (!confirm(`Are you sure you want to deactivate "${prod.name}" from your store?`)) return;
    try {
      const res = await apiRequest(`/products/${prod._id}`, {
        method: 'DELETE'
      });
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p._id !== prod._id));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to remove product');
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;

    try {
      const multiplier = ['wastage', 'damaged', 'expired'].includes(adjustType) ? -1 : 1;
      const delta = Math.abs(adjustDelta) * multiplier;

      const res = await apiRequest(`/products/${adjustingProduct._id}/stock`, {
        method: 'PATCH',
        body: JSON.stringify({
          type: adjustType,
          delta,
          reason: adjustReason
        })
      });

      if (res.success) {
        setStockAdjustModalOpen(false);
        setAdjustReason('');
        await fetchDashboardData();
      }
    } catch (err: any) {
      alert(err.message || 'Stock adjustment failed');
    }
  };

  const handleUpdateOrderStatus = async (subOrderId: string, status: string, reason?: string) => {
    try {
      const res = await apiRequest(`/seller/orders/${subOrderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, rejectionReason: reason })
      });

      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (o._id === subOrderId ? { ...o, status, rejectionReason: reason } : o))
        );
        if (status === 'rejected') {
          setRejectModalOpen(false);
          setRejectionReason('');
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  const handleSaveStoreSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const storeId = dashboardData?.store?._id;
      const res = await apiRequest(`/stores/${storeId}/settings`, {
        method: 'PATCH',
        body: JSON.stringify({
          isOpen: storeOpen,
          openingHours,
          offersDelivery,
          deliveryFee: Number(deliveryFee),
          minimumOrder: Number(minimumOrder),
          estimatedPrepTime: prepTime,
          contactPhone,
          bannerImage: storeBanner
        })
      });

      if (res.success) {
        alert('Store settings successfully updated.');
        await fetchDashboardData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    }
  };

  const handleAddMenuDocument = async () => {
    if (!menuDocFileUrl) {
      alert('Please upload a file or paste URL first.');
      return;
    }
    try {
      const storeId = dashboardData?.store?._id;
      const res = await apiRequest(`/stores/${storeId}/menu-documents`, {
        method: 'POST',
        body: JSON.stringify({
          title: menuDocTitle || `${dashboardData?.store?.name} Printed Menu`,
          fileUrl: menuDocFileUrl,
          fileType: menuDocFileType
        })
      });

      if (res.success) {
        setMenuDocModalOpen(false);
        setMenuDocTitle('');
        setMenuDocFileUrl('');
        await fetchDashboardData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to publish menu document');
    }
  };

  const handleRemoveMenuDocument = async (docId: string) => {
    if (!confirm('Remove this menu document?')) return;
    try {
      const storeId = dashboardData?.store?._id;
      const res = await apiRequest(`/stores/${storeId}/menu-documents/${docId}`, {
        method: 'DELETE'
      });
      if (res.success) {
        await fetchDashboardData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to remove menu document');
    }
  };

  const handleExportCSV = () => {
    const storeId = dashboardData?.store?._id;
    window.open(`http://localhost:5000/api/seller/inventory/export?storeId=${storeId}`, '_blank');
  };

  // Metric Computations
  const stats = dashboardData?.stats;
  const unavailableProductsCount = products.filter((p) => p.isAvailable === false).length;
  const lowStockCount = products.filter(
    (p) => p.stock > 0 && p.stock <= p.lowStockThreshold
  ).length;

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter === 'all') return true;
    if (orderStatusFilter === 'active') {
      return ['pending', 'accepted', 'preparing', 'ready_for_pickup', 'out_for_delivery'].includes(
        o.status
      );
    }
    return o.status === orderStatusFilter;
  });

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      inventorySearch === '' ||
      p.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(inventorySearch.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(inventorySearch.toLowerCase()));

    const matchesCategory =
      categoryFilter === 'all' || p.category.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  const categoriesList = ['all', ...Array.from(new Set(products.map((p) => p.category)))];

  // Sales computations
  const totalSalesRevenue = orders
    .filter((o) => !['cancelled', 'rejected'].includes(o.status))
    .reduce((sum, o) => sum + (o.itemsSubtotal || 0), 0);

  const completedOrders = orders.filter((o) => o.status === 'completed');

  if (loading && !dashboardData) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-stone-500 font-medium">Loading seller portal...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Top Store Identity Bar */}
      <div className="bg-white rounded-3xl border border-stone-200/90 p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-md">
            <StoreIcon className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg sm:text-xl font-bold text-stone-900 brand-font">
                {dashboardData?.store?.name}
              </h1>
              <Badge variant={dashboardData?.store?.isOpen ? 'inStock' : 'outOfStock'}>
                {dashboardData?.store?.isOpen ? 'Store Open' : 'Store Closed'}
              </Badge>
              {isFoodStore && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Fast Food & Canteen
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              {dashboardData?.store?.location} • Isolated Merchant Console
            </p>
          </div>
        </div>

        {/* Quick Top Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {isFoodStore && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMenuDocModalOpen(true)}
              className="text-xs"
            >
              <FileText className="w-3.5 h-3.5 mr-1 text-amber-600" />
              <span>Upload Menu PDF / Photo</span>
            </Button>
          )}

          <Button
            variant="solid"
            size="sm"
            onClick={openNewProductModal}
            className="text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>{isFoodStore ? 'Add Food Menu Item' : 'Add Product'}</span>
          </Button>

          <Button
            variant="soft"
            size="sm"
            onClick={fetchDashboardData}
            title="Refresh Store Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* ChaiUI Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} variant="line">
        <TabsList className="bg-transparent border-b border-stone-200">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">
            <span>Orders</span>
            {stats?.pendingOrdersCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-bold rounded-full">
                {stats.pendingOrdersCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="menu">
            {isFoodStore ? 'Menu Management' : 'Products & Catalog'}
          </TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="movements">Stock History</TabsTrigger>
          <TabsTrigger value="sales">Sales & Performance</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="settings">Store Settings</TabsTrigger>
        </TabsList>

        {/* ============================================================ */}
        {/* TAB 1: OVERVIEW METRIC CARDS                                  */}
        {/* ============================================================ */}
        <TabsContent value="overview" className="space-y-6 pt-5">
          {/* 7 Core Requested Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Today's Orders */}
            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Today's Orders
              </span>
              <div className="text-2xl font-bold text-stone-900">{stats?.todayOrdersCount || 0}</div>
              <p className="text-[11px] text-stone-500">Orders placed today</p>
            </div>

            {/* Pending Orders */}
            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                Pending Orders
              </span>
              <div className="text-2xl font-bold text-amber-600">{stats?.pendingOrdersCount || 0}</div>
              <p className="text-[11px] text-stone-500">Awaiting acceptance</p>
            </div>

            {/* Completed Orders */}
            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                Completed Orders
              </span>
              <div className="text-2xl font-bold text-emerald-700">{stats?.completedOrdersCount || 0}</div>
              <p className="text-[11px] text-stone-500">Fulfilled orders</p>
            </div>

            {/* Today's Sales */}
            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Today's Sales
              </span>
              <div className="text-2xl font-bold text-stone-900">₹{stats?.todaySales || 0}</div>
              <p className="text-[11px] text-emerald-600 font-semibold">Gross revenue today</p>
            </div>

            {/* Active Products */}
            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Active Products
              </span>
              <div className="text-2xl font-bold text-stone-900">{products.length}</div>
              <p className="text-[11px] text-stone-500">In student catalog</p>
            </div>

            {/* Low-Stock Products */}
            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                Low-Stock Items
              </span>
              <div className="text-2xl font-bold text-amber-600">{lowStockCount}</div>
              <p className="text-[11px] text-stone-500">Below threshold</p>
            </div>

            {/* Unavailable Menu Items */}
            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">
                Unavailable Items
              </span>
              <div className="text-2xl font-bold text-rose-600">{unavailableProductsCount}</div>
              <p className="text-[11px] text-stone-500">Temporarily hidden</p>
            </div>

            {/* Total Valuation */}
            <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-sm space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
                Inventory Retail Value
              </span>
              <div className="text-2xl font-bold text-stone-900">
                ₹{stats?.inventory?.totalRetailValuation || 0}
              </div>
              <p className="text-[11px] text-stone-500">
                Cost: ₹{stats?.inventory?.totalCostValuation || 0}
              </p>
            </div>
          </div>

          {/* Quick Active Orders Preview */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-stone-900">Live Active Orders Queue</h3>
                <p className="text-xs text-stone-500">Orders requiring immediate preparation or fulfillment</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setActiveTab('orders')}>
                View All Orders ({orders.length})
              </Button>
            </div>

            {orders.filter((o) => ['pending', 'accepted', 'preparing'].includes(o.status)).length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400">
                No active pending orders. Your kitchen is currently clear!
              </div>
            ) : (
              <div className="space-y-3">
                {orders
                  .filter((o) => ['pending', 'accepted', 'preparing'].includes(o.status))
                  .slice(0, 4)
                  .map((order) => (
                    <div
                      key={order._id}
                      className="p-4 rounded-2xl border border-stone-200 bg-stone-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-stone-900">{order.subOrderNumber}</span>
                          <Badge variant={order.status === 'pending' ? 'hot' : 'new'}>
                            {order.status}
                          </Badge>
                          <span className="text-[11px] text-stone-400">
                            by {order.studentName} ({order.fulfillmentType})
                          </span>
                        </div>
                        <p className="text-xs text-stone-600">
                          {order.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-stone-900 mr-2">₹{order.totalAmount}</span>
                        {order.status === 'pending' && (
                          <>
                            <Button
                              variant="campus"
                              size="sm"
                              onClick={() => handleUpdateOrderStatus(order._id, 'accepted')}
                            >
                              Accept
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => {
                                setRejectingOrder(order);
                                setRejectModalOpen(true);
                              }}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {order.status === 'accepted' && (
                          <Button
                            variant="solid"
                            size="sm"
                            onClick={() => handleUpdateOrderStatus(order._id, 'preparing')}
                          >
                            Mark Preparing
                          </Button>
                        )}
                        {order.status === 'preparing' && (
                          <Button
                            variant="campus"
                            size="sm"
                            onClick={() =>
                              handleUpdateOrderStatus(
                                order._id,
                                order.fulfillmentType === 'delivery' ? 'out_for_delivery' : 'ready_for_pickup'
                              )
                            }
                          >
                            Mark Ready
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 2: ORDERS MANAGEMENT                                      */}
        {/* ============================================================ */}
        <TabsContent value="orders" className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-700">Filter Status:</span>
              <div className="flex flex-wrap gap-1">
                {['all', 'active', 'pending', 'accepted', 'preparing', 'ready_for_pickup', 'completed', 'rejected'].map(
                  (st) => (
                    <Chip
                      key={st}
                      active={orderStatusFilter === st}
                      onClick={() => setOrderStatusFilter(st)}
                      className="cursor-pointer capitalize text-[11px]"
                    >
                      {st.replace(/_/g, ' ')}
                    </Chip>
                  )
                )}
              </div>
            </div>
            <span className="text-xs text-stone-500">
              Showing <strong>{filteredOrders.length}</strong> orders
            </span>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center text-xs text-stone-400">
              No orders found matching this filter.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <div
                  key={order._id}
                  className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-stone-900">{order.subOrderNumber}</span>
                        <Badge
                          variant={
                            order.status === 'completed'
                              ? 'inStock'
                              : ['rejected', 'cancelled'].includes(order.status)
                              ? 'outOfStock'
                              : 'hot'
                          }
                        >
                          {order.status.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-[11px] font-semibold text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded-md">
                          {order.fulfillmentType}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500">
                        Student: <strong>{order.studentName}</strong> • {order.studentPhone} •{' '}
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-base font-bold text-stone-900">₹{order.totalAmount}</div>
                      <span className="text-[11px] text-stone-400 capitalize">
                        Payment: {order.paymentStatus}
                      </span>
                    </div>
                  </div>

                  {/* Order items with variants & add-ons */}
                  <div className="space-y-1.5 text-xs text-stone-700">
                    {order.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center py-1">
                        <div>
                          <span className="font-semibold">{item.quantity}x</span> {item.name}
                          {item.selectedVariant && (
                            <span className="text-stone-500 ml-1.5 font-medium">
                              ({item.selectedVariant.name})
                            </span>
                          )}
                          {item.selectedAddons && item.selectedAddons.length > 0 && (
                            <span className="text-emerald-700 ml-1.5 text-[11px]">
                              + {item.selectedAddons.map((a: any) => a.name).join(', ')}
                            </span>
                          )}
                        </div>
                        <span className="font-semibold text-stone-900">₹{item.subtotal}</span>
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200">
                      <strong>Notes from student:</strong> {order.notes}
                    </p>
                  )}

                  {order.rejectionReason && (
                    <p className="text-xs text-rose-700 bg-rose-50 p-2 rounded-xl border border-rose-200">
                      <strong>Rejection reason:</strong> {order.rejectionReason} (Inventory automatically restored)
                    </p>
                  )}

                  {/* Seller Action Buttons */}
                  <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-stone-100">
                    {order.status === 'pending' && (
                      <>
                        <Button
                          variant="campus"
                          size="sm"
                          onClick={() => handleUpdateOrderStatus(order._id, 'accepted')}
                        >
                          Accept Order
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setRejectingOrder(order);
                            setRejectModalOpen(true);
                          }}
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    {order.status === 'accepted' && (
                      <Button
                        variant="solid"
                        size="sm"
                        onClick={() => handleUpdateOrderStatus(order._id, 'preparing')}
                      >
                        Start Preparing
                      </Button>
                    )}

                    {order.status === 'preparing' && (
                      <Button
                        variant="campus"
                        size="sm"
                        onClick={() =>
                          handleUpdateOrderStatus(
                            order._id,
                            order.fulfillmentType === 'delivery' ? 'out_for_delivery' : 'ready_for_pickup'
                          )
                        }
                      >
                        {order.fulfillmentType === 'delivery' ? 'Out for Delivery' : 'Ready for Pickup'}
                      </Button>
                    )}

                    {['ready_for_pickup', 'out_for_delivery'].includes(order.status) && (
                      <Button
                        variant="campus"
                        size="sm"
                        onClick={() => handleUpdateOrderStatus(order._id, 'completed')}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Complete Order
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 3: MENU & PRODUCTS MANAGEMENT                             */}
        {/* ============================================================ */}
        <TabsContent value="menu" className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-stone-900"
              />
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
              {categoriesList.map((cat) => (
                <Chip
                  key={cat}
                  active={categoryFilter === cat}
                  onClick={() => setCategoryFilter(cat)}
                  className="cursor-pointer capitalize text-[11px]"
                >
                  {cat}
                </Chip>
              ))}
            </div>
          </div>

          {/* Product grid / list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((prod) => (
              <div
                key={prod._id}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[16/9] bg-stone-100 overflow-hidden">
                    <ImageWithFallback
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                    />

                    {/* Quick Availability Badge */}
                    <div className="absolute top-2.5 right-2.5">
                      <button
                        type="button"
                        onClick={() => handleToggleProductAvailability(prod)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm cursor-pointer transition-all ${
                          prod.isAvailable !== false
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-rose-600 text-white hover:bg-rose-700'
                        }`}
                        title="Click to toggle availability"
                      >
                        {prod.isAvailable !== false ? 'Available' : 'Unavailable'}
                      </button>
                    </div>

                    <div className="absolute top-2.5 left-2.5">
                      <VegBadge isVeg={prod.isVeg !== false} />
                    </div>
                  </div>

                  <div className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        {prod.category}
                      </span>
                      {prod.sku && (
                        <span className="text-[10px] font-mono text-stone-400">
                          SKU: {prod.sku}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-sm text-stone-900 line-clamp-1">{prod.name}</h3>
                    {prod.description && (
                      <p className="text-xs text-stone-500 line-clamp-2">{prod.description}</p>
                    )}

                    <div className="pt-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-stone-900 text-sm">₹{prod.sellingPrice}</span>
                        <span className="text-stone-400 text-[11px] ml-1">
                          (Cost: ₹{prod.costPrice || 0})
                        </span>
                      </div>
                      <span
                        className={`font-semibold ${
                          prod.stock <= prod.lowStockThreshold ? 'text-amber-600' : 'text-stone-600'
                        }`}
                      >
                        Stock: {prod.stock}
                      </span>
                    </div>

                    {/* Variants and add-ons count */}
                    {prod.variants && prod.variants.length > 0 && (
                      <div className="text-[11px] text-stone-500 pt-1">
                        Variants: {prod.variants.map((v: any) => `${v.name} (₹${v.price})`).join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 pt-0 flex items-center justify-between gap-2 border-t border-stone-100 mt-2">
                  <Button
                    variant="soft"
                    size="sm"
                    onClick={() => setPreviewProduct(prod)}
                    className="text-xs"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Preview
                  </Button>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditProductModal(prod)}
                      className="text-xs"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSoftDeleteProduct(prod)}
                      className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-2"
                      title="Deactivate item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 4: INVENTORY CONTROL & ADJUSTMENTS                        */}
        {/* ============================================================ */}
        <TabsContent value="inventory" className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Inventory Valuation & Control</h3>
              <p className="text-xs text-stone-500">
                Track units, valuation, low stock warnings, and record restocks with mandatory reasons.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="w-3.5 h-3.5 mr-1" />
              <span>Export CSV</span>
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead>Cost Price</TableHead>
                <TableHead>Selling Price</TableHead>
                <TableHead>Gross Profit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((prod) => {
                const profit = prod.sellingPrice - (prod.costPrice || 0);
                const isLow = prod.stock <= prod.lowStockThreshold;
                const isOut = prod.stock <= 0;

                return (
                  <TableRow key={prod._id}>
                    <TableCell>
                      <div className="font-semibold text-stone-900">{prod.name}</div>
                      <div className="text-[11px] text-stone-400 font-mono">
                        {prod.sku || prod._id.slice(-6)}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{prod.category}</TableCell>
                    <TableCell>
                      <span className="font-bold">{prod.stock}</span> {prod.unit}
                    </TableCell>
                    <TableCell>₹{prod.costPrice || 0}</TableCell>
                    <TableCell className="font-semibold">₹{prod.sellingPrice}</TableCell>
                    <TableCell className="text-emerald-700 font-semibold">+₹{profit}</TableCell>
                    <TableCell>
                      {isOut ? (
                        <Badge variant="outOfStock">Out of Stock</Badge>
                      ) : isLow ? (
                        <Badge variant="lowStock">Low Stock</Badge>
                      ) : (
                        <Badge variant="inStock">In Stock</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAdjustingProduct(prod);
                          setStockAdjustModalOpen(true);
                        }}
                      >
                        Adjust Stock
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 5: STOCK HISTORY & MOVEMENT AUDIT LOGS                    */}
        {/* ============================================================ */}
        <TabsContent value="movements" className="space-y-4 pt-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Inventory Movement Audit Trail</h3>
              <p className="text-xs text-stone-500">
                Immutable audit of every stock delta (sales, restocks, cancellations, adjustments).
              </p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Delta</TableHead>
                <TableHead>Stock (Before → After)</TableHead>
                <TableHead>Authorized By</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((m) => (
                <TableRow key={m._id}>
                  <TableCell className="text-[11px] text-stone-500 whitespace-nowrap">
                    {new Date(m.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-semibold text-stone-900">
                    {m.productId?.name || 'Item'}
                  </TableCell>
                  <TableCell>
                    <span className="capitalize font-medium text-stone-700">{m.type}</span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`font-bold ${
                        m.delta > 0 ? 'text-emerald-700' : 'text-rose-600'
                      }`}
                    >
                      {m.delta > 0 ? `+${m.delta}` : m.delta}
                    </span>
                  </TableCell>
                  <TableCell>
                    {m.stockBefore} → <strong>{m.stockAfter}</strong>
                  </TableCell>
                  <TableCell>{m.userName || 'System'}</TableCell>
                  <TableCell className="text-stone-600 max-w-xs truncate">{m.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 6: SALES & PERFORMANCE                                    */}
        {/* ============================================================ */}
        <TabsContent value="sales" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Lifetime Store Sales
              </span>
              <div className="text-2xl font-bold text-stone-900">₹{totalSalesRevenue}</div>
              <p className="text-xs text-stone-500">Across all fulfilled suborders</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Completed Deliveries / Pickups
              </span>
              <div className="text-2xl font-bold text-emerald-700">{completedOrders.length}</div>
              <p className="text-xs text-stone-500">Fulfilled student orders</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Average Order Value
              </span>
              <div className="text-2xl font-bold text-stone-900">
                ₹
                {completedOrders.length > 0
                  ? Math.round(totalSalesRevenue / completedOrders.length)
                  : 0}
              </div>
              <p className="text-xs text-stone-500">Per transaction</p>
            </div>
          </div>

          {/* Best Sellers */}
          {stats?.bestSellers && stats.bestSellers.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-stone-900">Top Selling Products</h3>
              <div className="space-y-2">
                {stats.bestSellers.map((b: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-stone-50 text-xs"
                  >
                    <span className="font-semibold text-stone-800">
                      {idx + 1}. {b.name}
                    </span>
                    <div className="space-x-3 text-stone-600">
                      <span>Units Sold: <strong>{b.totalUnitsSold}</strong></span>
                      <span>Revenue: <strong>₹{b.totalRevenue}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 7: PAYMENTS SETTLEMENTS                                  */}
        {/* ============================================================ */}
        <TabsContent value="payments" className="space-y-4 pt-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Payments & Transactions</h3>
              <p className="text-xs text-stone-500">
                Reconciliation across UPI, Razorpay sandbox, and cash on pickup.
              </p>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Fulfillment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o._id}>
                  <TableCell className="font-bold text-stone-900">{o.subOrderNumber}</TableCell>
                  <TableCell className="text-stone-500">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{o.studentName}</TableCell>
                  <TableCell className="font-bold">₹{o.totalAmount}</TableCell>
                  <TableCell>
                    <Badge variant={o.paymentStatus === 'paid' ? 'inStock' : 'lowStock'}>
                      {o.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{o.fulfillmentType}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        {/* ============================================================ */}
        {/* TAB 8: STORE SETTINGS & PHYSICAL MENU UPLOAD                  */}
        {/* ============================================================ */}
        <TabsContent value="settings" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Store Configuration Form */}
            <form
              onSubmit={handleSaveStoreSettings}
              className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4"
            >
              <h3 className="text-base font-bold text-stone-900">Store Profile & Timings</h3>

              <div className="space-y-1">
                <Label>Store Status</Label>
                <label className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={storeOpen}
                    onChange={(e) => setStoreOpen(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-semibold text-stone-800">
                    Store is Open for Online Student Orders
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Opening Hours</Label>
                  <Input
                    value={openingHours}
                    onChange={(e) => setOpeningHours(e.target.value)}
                    placeholder="08:00 AM - 10:00 PM"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Estimated Prep Time</Label>
                  <Input
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    placeholder="10-15 mins"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Delivery Fee (₹)</Label>
                  <Input
                    type="number"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Minimum Order (₹)</Label>
                  <Input
                    type="number"
                    value={minimumOrder}
                    onChange={(e) => setMinimumOrder(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Contact Phone</Label>
                <Input
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="space-y-1">
                <FileUploadZone
                  label="Store Banner / Cover Photo"
                  value={storeBanner}
                  onChange={(url) => setStoreBanner(url)}
                />
              </div>

              <Button type="submit" variant="solid" size="md" className="w-full justify-center">
                Save Store Settings
              </Button>
            </form>

            {/* Published Physical Menus / Documents */}
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Uploaded Physical Menus & Cards
                  </h3>
                  <p className="text-xs text-stone-500">
                    PDF or high-res photos of your printed shop menu for students to view.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMenuDocModalOpen(true)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Menu Document
                </Button>
              </div>

              {dashboardData?.store?.menuDocuments &&
              dashboardData.store.menuDocuments.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.store.menuDocuments.map((doc: any) => (
                    <div
                      key={doc._id}
                      className="p-3.5 rounded-2xl border border-stone-200 bg-stone-50 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-600 shrink-0">
                          <FileText className="w-5 h-5 text-amber-600" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-stone-900 truncate">{doc.title}</h4>
                          <span className="text-[10px] text-stone-400 uppercase">
                            Type: {doc.fileType} • Uploaded{' '}
                            {new Date(doc.uploadedAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-200 transition-colors"
                          title="View document"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveMenuDocument(doc._id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-stone-200 transition-colors"
                          title="Delete document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-stone-200 rounded-2xl text-xs text-stone-400 space-y-2">
                  <FileText className="w-8 h-8 text-stone-300 mx-auto" />
                  <p>No physical menu documents uploaded yet.</p>
                  <p className="text-[11px]">
                    Upload a PDF or menu card photo so students can browse your entire printed menu!
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ============================================================ */}
      {/* MODAL: ADD / EDIT PRODUCT & FAST FOOD MENU ITEM               */}
      {/* ============================================================ */}
      <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
        <DialogContent
          onClose={() => setProductModalOpen(false)}
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle>
              {editingProduct
                ? `Edit ${editingProduct.name}`
                : isFoodStore
                ? 'Create Fast-Food Menu Item'
                : 'Add New Catalog Product'}
            </DialogTitle>
            <DialogDescription>
              {isFoodStore
                ? 'Configure food item details, serving size, preparation time, variants, and optional add-ons.'
                : 'Configure inventory specifications, cost/retail price, and initial stock.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProduct} className="space-y-4 pt-2">
            {/* Product Image Uploader */}
            <FileUploadZone
              label="Product Photography / Image"
              value={pImage}
              onChange={(url) => setPImage(url)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Item Name</Label>
                <Input
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  placeholder="e.g. Crispy Veg Aloo Tikki Burger"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>Brand / Kitchen</Label>
                <Input
                  value={pBrand}
                  onChange={(e) => setPBrand(e.target.value)}
                  placeholder="e.g. Durga Kitchen"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Category</Label>
                <Select value={pCategory} onChange={(e) => setPCategory(e.target.value)}>
                  <option value="burgers">Burgers</option>
                  <option value="momos">Momos</option>
                  <option value="sandwiches">Sandwiches</option>
                  <option value="maggi and noodles">Maggi & Noodles</option>
                  <option value="pizza">Pizza</option>
                  <option value="fries and snacks">Fries & Snacks</option>
                  <option value="tea and coffee">Tea & Coffee</option>
                  <option value="cold drinks">Cold Drinks & Shakes</option>
                  <option value="south indian">South Indian</option>
                  <option value="chinese">Chinese</option>
                  <option value="combos">Combos</option>
                  <option value="chips">Chips & Snacks</option>
                  <option value="biscuits">Biscuits</option>
                  <option value="chocolates">Chocolates</option>
                  <option value="stationery">Stationery</option>
                  <option value="groceries">Groceries</option>
                  <option value="daily essentials">Daily Essentials</option>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Selling Price (₹)</Label>
                <Input
                  type="number"
                  value={pSellingPrice}
                  onChange={(e) => setPSellingPrice(Number(e.target.value))}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label>Cost Price (₹)</Label>
                <Input
                  type="number"
                  value={pCostPrice}
                  onChange={(e) => setPCostPrice(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            {/* Food specifics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Serving Size / Unit</Label>
                <Input
                  value={pServingSize}
                  onChange={(e) => setPServingSize(e.target.value)}
                  placeholder="e.g. Plate of 8 pcs"
                />
              </div>

              <div className="space-y-1">
                <Label>Prep Time</Label>
                <Input
                  value={pPrepTime}
                  onChange={(e) => setPPrepTime(e.target.value)}
                  placeholder="e.g. 10-15 mins"
                />
              </div>

              <div className="space-y-1">
                <Label>Food Dietary Tag</Label>
                <label className="flex items-center gap-2 p-2 bg-stone-50 border border-stone-200 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pIsVeg}
                    onChange={(e) => setPIsVeg(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600"
                  />
                  <VegBadge isVeg={pIsVeg} />
                  <span className="text-xs font-semibold">{pIsVeg ? 'Vegetarian' : 'Non-Veg'}</span>
                </label>
              </div>
            </div>

            {/* General store specifics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Barcode / SKU (Optional)</Label>
                <Input
                  value={pSku}
                  onChange={(e) => setPSku(e.target.value)}
                  placeholder="e.g. STA-NOTE-A4-160"
                />
              </div>
              <div className="space-y-1">
                <Label>Expiry Date (Optional)</Label>
                <Input
                  type="date"
                  value={pExpiryDate}
                  onChange={(e) => setPExpiryDate(e.target.value)}
                />
              </div>
            </div>

            {/* Stock and Low Stock Threshold */}
            {!editingProduct && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Initial Stock Quantity</Label>
                  <Input
                    type="number"
                    value={pStock}
                    onChange={(e) => setPStock(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Low Stock Warning Threshold</Label>
                  <Input
                    type="number"
                    value={pThreshold}
                    onChange={(e) => setPThreshold(Number(e.target.value))}
                    required
                  />
                </div>
              </div>
            )}

            {/* Variants Manager */}
            {isFoodStore && (
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900">
                    Item Variants (e.g. Small / Medium / Large)
                  </span>
                  <span className="text-[11px] text-stone-400">Optional</span>
                </div>

                <div className="flex gap-2">
                  <Input
                    value={newVarName}
                    onChange={(e) => setNewVarName(e.target.value)}
                    placeholder="Variant Name (e.g. Double Cheese)"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={newVarPrice || ''}
                    onChange={(e) => setNewVarPrice(Number(e.target.value))}
                    placeholder="Price (₹)"
                    className="w-24"
                  />
                  <Button
                    type="button"
                    variant="solid"
                    size="sm"
                    onClick={() => {
                      if (!newVarName || newVarPrice <= 0) return;
                      setPVariants((prev) => [...prev, { name: newVarName, price: newVarPrice }]);
                      setNewVarName('');
                      setNewVarPrice(0);
                    }}
                  >
                    Add
                  </Button>
                </div>

                {pVariants.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {pVariants.map((v, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-stone-200 rounded-xl text-xs font-medium"
                      >
                        <span>{v.name}: ₹{v.price}</span>
                        <button
                          type="button"
                          onClick={() => setPVariants((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-stone-400 hover:text-rose-600"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Add-ons Manager */}
            {isFoodStore && (
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-900">
                    Item Add-ons (e.g. Extra Cheese Slice, Mayo Dip)
                  </span>
                  <span className="text-[11px] text-stone-400">Optional</span>
                </div>

                <div className="flex gap-2">
                  <Input
                    value={newAddonName}
                    onChange={(e) => setNewAddonName(e.target.value)}
                    placeholder="Add-on Name (e.g. Extra Cheese)"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={newAddonPrice || ''}
                    onChange={(e) => setNewAddonPrice(Number(e.target.value))}
                    placeholder="Price (₹)"
                    className="w-24"
                  />
                  <Button
                    type="button"
                    variant="solid"
                    size="sm"
                    onClick={() => {
                      if (!newAddonName || newAddonPrice <= 0) return;
                      setPAddons((prev) => [...prev, { name: newAddonName, price: newAddonPrice }]);
                      setNewAddonName('');
                      setNewAddonPrice(0);
                    }}
                  >
                    Add
                  </Button>
                </div>

                {pAddons.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {pAddons.map((a, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-stone-200 rounded-xl text-xs font-medium"
                      >
                        <span>{a.name}: +₹{a.price}</span>
                        <button
                          type="button"
                          onClick={() => setPAddons((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-stone-400 hover:text-rose-600"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                value={pDescription}
                onChange={(e) => setPDescription(e.target.value)}
                placeholder="Delicious description with ingredients and tastes..."
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setProductModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="solid" size="sm">
                {editingProduct ? 'Save Changes' : 'Publish Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* MODAL: STOCK ADJUSTMENT WITH MANDATORY REASON                */}
      {/* ============================================================ */}
      <Dialog open={stockAdjustModalOpen} onOpenChange={setStockAdjustModalOpen}>
        <DialogContent
          onClose={() => setStockAdjustModalOpen(false)}
          className="max-w-md"
        >
          <DialogHeader>
            <DialogTitle>Adjust Inventory Stock</DialogTitle>
            <DialogDescription>
              {adjustingProduct?.name} (Current Stock: {adjustingProduct?.stock})
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAdjustStock} className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label>Movement Type</Label>
              <Select
                value={adjustType}
                onChange={(e: any) => setAdjustType(e.target.value)}
              >
                <option value="restock">Supplier Restock (Add)</option>
                <option value="adjustment">Physical Count Adjustment (Add)</option>
                <option value="wastage">Wastage (Deduct)</option>
                <option value="damaged">Damaged Goods (Deduct)</option>
                <option value="expired">Expired Stock (Deduct)</option>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Quantity Units</Label>
              <Input
                type="number"
                min="1"
                value={adjustDelta}
                onChange={(e) => setAdjustDelta(Number(e.target.value))}
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Mandatory Reason / Supplier Note</Label>
              <Textarea
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g. Received weekly carton from supplier Metro Cash & Carry..."
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStockAdjustModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="solid" size="sm">
                Commit Stock Adjustment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* MODAL: REJECT ORDER WITH MANDATORY REASON                    */}
      {/* ============================================================ */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent onClose={() => setRejectModalOpen(false)} className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Order {rejectingOrder?.subOrderNumber}</DialogTitle>
            <DialogDescription>
              Rejecting will automatically restore reserved stock to your inventory and notify the student.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label>Reason for Rejection (Required)</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Kitchen closed early due to maintenance / Raw ingredients out of stock..."
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRejectModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={!rejectionReason.trim()}
              onClick={() => handleUpdateOrderStatus(rejectingOrder._id, 'rejected', rejectionReason)}
            >
              Confirm Rejection & Release Stock
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============================================================ */}
      {/* MODAL: UPLOAD PHYSICAL MENU DOCUMENT (PDF / PHOTO)            */}
      {/* ============================================================ */}
      <Dialog open={menuDocModalOpen} onOpenChange={setMenuDocModalOpen}>
        <DialogContent onClose={() => setMenuDocModalOpen(false)} className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Physical Food Menu</DialogTitle>
            <DialogDescription>
              Upload a PDF document or high-resolution photograph of your printed menu for students to view.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <Label>Menu Document Title</Label>
              <Input
                value={menuDocTitle}
                onChange={(e) => setMenuDocTitle(e.target.value)}
                placeholder="e.g. Official Fast Food Menu Card (2026)"
              />
            </div>

            <div className="space-y-1">
              <Label>Document Type</Label>
              <Select
                value={menuDocFileType}
                onChange={(e: any) => setMenuDocFileType(e.target.value)}
              >
                <option value="image">Image (JPEG, PNG, WebP)</option>
                <option value="pdf">PDF Document</option>
              </Select>
            </div>

            <FileUploadZone
              label="Select Menu File"
              value={menuDocFileUrl}
              onChange={(url) => setMenuDocFileUrl(url)}
              allowPdf={true}
              maxSizeMB={10}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMenuDocModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="solid"
              size="sm"
              disabled={!menuDocFileUrl}
              onClick={handleAddMenuDocument}
            >
              Publish Menu Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student View Interactive Preview Modal */}
      {previewProduct && (
        <ProductDetailModal
          product={{ ...previewProduct, store: dashboardData?.store }}
          open={Boolean(previewProduct)}
          onOpenChange={(open) => !open && setPreviewProduct(null)}
        />
      )}
    </div>
  );
};
