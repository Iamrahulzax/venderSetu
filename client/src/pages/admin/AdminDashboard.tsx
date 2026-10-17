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
  TrendingUp,
  ExternalLink,
  Eye,
  FileText
} from 'lucide-react';
import { apiRequest } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Badge, Chip } from '../../components/ui/Badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/Dialog';

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'sellers' | 'stores' | 'orders' | 'stock' | 'complaints' | 'audit' | 'menus'
  >('overview');

  const [loading, setLoading] = useState<boolean>(true);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [sellers, setSellers] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [platformOrders, setPlatformOrders] = useState<any[]>([]);
  const [stockAlerts, setStockAlerts] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);

  // Modals
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<any>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');

  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [resolutionStatus, setResolutionStatus] = useState<string>('resolved');
  const [adminResolutionNotes, setAdminResolutionNotes] = useState<string>('');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [
        overviewRes,
        sellersRes,
        storesRes,
        ordersRes,
        alertsRes,
        complaintsRes,
        auditRes,
        productsRes
      ] = await Promise.all([
        apiRequest('/admin/overview'),
        apiRequest('/admin/sellers'),
        apiRequest('/stores'),
        apiRequest('/admin/orders?limit=60'),
        apiRequest('/admin/stock-alerts'),
        apiRequest('/admin/complaints'),
        apiRequest('/admin/audit-logs?limit=60'),
        apiRequest('/products?limit=200')
      ]);

      if (overviewRes.success) setOverviewData(overviewRes);
      if (sellersRes.success) setSellers(sellersRes.sellers);
      if (storesRes.success) setStores(storesRes.stores);
      if (ordersRes.success) setPlatformOrders(ordersRes.orders);
      if (alertsRes.success) setStockAlerts(alertsRes.alerts);
      if (complaintsRes.success) setComplaints(complaintsRes.complaints);
      if (auditRes.success) setAuditLogs(auditRes.logs);
      if (productsRes.success) setAllProducts(productsRes.products);
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
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update seller');
    }
  };

  // Re-assign seller to store
  const handleAssignStore = async () => {
    if (!selectedSeller || !selectedStoreId) return;
    try {
      const res = await apiRequest(`/admin/sellers/${selectedSeller._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ assignedStoreId: selectedStoreId })
      });
      if (res.success) {
        setAssignModalOpen(false);
        await fetchAdminData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to re-assign store');
    }
  };

  // Toggle inappropriate or incorrect product listing
  const handleToggleProductStatus = async (prod: any) => {
    try {
      const res = await apiRequest(`/products/${prod._id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !prod.isActive })
      });
      if (res.success) {
        setAllProducts((prev) =>
          prev.map((p) => (p._id === prod._id ? { ...p, isActive: !p.isActive } : p))
        );
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update product listing');
    }
  };

  // Resolve complaint
  const handleResolveComplaint = async () => {
    if (!selectedComplaint) return;
    try {
      const res = await apiRequest(`/admin/complaints/${selectedComplaint._id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: resolutionStatus,
          adminNotes: adminResolutionNotes
        })
      });
      if (res.success) {
        setComplaints((prev) =>
          prev.map((c) =>
            c._id === selectedComplaint._id
              ? { ...c, status: resolutionStatus, adminNotes: adminResolutionNotes }
              : c
          )
        );
        setResolveModalOpen(false);
        setAdminResolutionNotes('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to resolve complaint');
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
        <div className="inline-block w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-stone-500 font-medium">Loading Platform Administrator Console...</p>
      </div>
    );
  }

  const overview = overviewData?.overview;

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-md">
            <Shield className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-stone-900 brand-font">
                Campus Administrator Console
              </h1>
              <Badge variant="solid">Platform Admin</Badge>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Campus Governance • Multi-Store Oversight & Compliance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPlatformReport}>
            <Download className="w-3.5 h-3.5 mr-1" />
            <span>Export Campus Audit CSV</span>
          </Button>
          <Button variant="soft" size="sm" onClick={fetchAdminData}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} variant="line">
        <TabsList className="bg-transparent border-b border-stone-200">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stores">Stores ({stores.length})</TabsTrigger>
          <TabsTrigger value="sellers">Sellers & Approvals</TabsTrigger>
          <TabsTrigger value="menus">Catalog & Menus Review</TabsTrigger>
          <TabsTrigger value="orders">Orders & Payments</TabsTrigger>
          <TabsTrigger value="stock">Stock Discrepancy Radar</TabsTrigger>
          <TabsTrigger value="complaints">Disputes & Complaints</TabsTrigger>
          <TabsTrigger value="audit">Audit Log History</TabsTrigger>
        </TabsList>

        {/* TAB 1: OVERVIEW */}
        <TabsContent value="overview" className="space-y-6 pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Registered Students
              </span>
              <div className="text-2xl font-bold text-stone-900">{overview?.totalStudents || 0}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Onboarded Sellers
              </span>
              <div className="text-2xl font-bold text-stone-900">{overview?.totalSellers || 0}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Official Stores
              </span>
              <div className="text-2xl font-bold text-stone-900">{overview?.totalStores || 5}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Total Campus Orders
              </span>
              <div className="text-2xl font-bold text-stone-900">{overview?.totalOrders || 0}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Gross Volume
              </span>
              <div className="text-2xl font-bold text-emerald-700">₹{overview?.totalGrossSales || 0}</div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                Open Disputes
              </span>
              <div className="text-2xl font-bold text-amber-600">{overview?.openComplaints || 0}</div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: STORES */}
        <TabsContent value="stores" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stores.map((st) => (
              <div key={st._id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-stone-900">{st.name}</h3>
                  <Badge variant={st.isOpen ? 'inStock' : 'outOfStock'}>
                    {st.isOpen ? 'Open' : 'Closed'}
                  </Badge>
                </div>
                <p className="text-xs text-stone-500 line-clamp-2">{st.description}</p>
                <div className="text-xs text-stone-600 space-y-1 border-t border-stone-100 pt-2">
                  <p>• Location: {st.location}</p>
                  <p>• Hours: {st.openingHours}</p>
                  <p>• Products: <strong>{st.productCount || 0} active items</strong></p>
                  <p>• Menu Documents: <strong>{st.menuDocuments?.length || 0} uploaded</strong></p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 3: SELLERS & APPROVALS */}
        <TabsContent value="sellers" className="space-y-4 pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Merchant Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Assigned Store</TableHead>
                <TableHead>Account Status</TableHead>
                <TableHead className="text-right">Admin Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sellers.map((s) => (
                <TableRow key={s._id}>
                  <TableCell className="font-semibold text-stone-900">{s.name}</TableCell>
                  <TableCell>{s.email}</TableCell>
                  <TableCell>{s.phone || 'N/A'}</TableCell>
                  <TableCell>
                    <span className="font-medium text-emerald-700">
                      {s.assignedStoreId?.name || 'Unassigned'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.status === 'active' ? 'inStock' : 'outOfStock'}>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSeller(s);
                        setSelectedStoreId(s.assignedStoreId?._id || '');
                        setAssignModalOpen(true);
                      }}
                    >
                      Assign Store
                    </Button>
                    {s.status === 'active' ? (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleUpdateSeller(s._id, { status: 'suspended' })}
                      >
                        Suspend
                      </Button>
                    ) : (
                      <Button
                        variant="campus"
                        size="sm"
                        onClick={() => handleUpdateSeller(s._id, { status: 'active', isApproved: true })}
                      >
                        Approve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        {/* TAB 4: CATALOG & MENUS REVIEW */}
        <TabsContent value="menus" className="space-y-4 pt-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-stone-900">Catalogue & Menu Review</h3>
              <p className="text-xs text-stone-500">
                Audit listings, verify real product photography, and disable inappropriate items.
              </p>
            </div>
            <span className="text-xs text-stone-500">
              Total <strong>{allProducts.length}</strong> items across all 5 stores
            </span>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allProducts.map((p) => (
                <TableRow key={p._id}>
                  <TableCell className="font-semibold text-stone-900">
                    <div className="flex items-center gap-2">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-8 h-8 rounded-lg object-cover border border-stone-200"
                      />
                      <span>{p.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{p.store?.name || p.storeId?.name || 'Store'}</TableCell>
                  <TableCell className="capitalize">{p.category}</TableCell>
                  <TableCell className="font-bold">₹{p.sellingPrice}</TableCell>
                  <TableCell>{p.stock}</TableCell>
                  <TableCell>
                    <Badge variant={p.isActive !== false ? 'inStock' : 'outOfStock'}>
                      {p.isActive !== false ? 'Published' : 'Disabled'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant={p.isActive !== false ? 'danger' : 'campus'}
                      size="sm"
                      onClick={() => handleToggleProductStatus(p)}
                    >
                      {p.isActive !== false ? 'Disable' : 'Enable'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        {/* TAB 5: ORDERS & PAYMENTS */}
        <TabsContent value="orders" className="space-y-4 pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Fulfillment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {platformOrders.map((o) => (
                <TableRow key={o._id}>
                  <TableCell className="font-bold text-stone-900">{o.orderNumber}</TableCell>
                  <TableCell className="text-stone-500">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{o.studentName}</TableCell>
                  <TableCell className="font-bold">₹{o.totalAmount}</TableCell>
                  <TableCell className="uppercase text-[11px] font-semibold">{o.paymentMethod}</TableCell>
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

        {/* TAB 6: STOCK RADAR */}
        <TabsContent value="stock" className="space-y-4 pt-4">
          <div className="bg-white p-4 rounded-2xl border border-stone-200">
            <h3 className="text-sm font-bold text-stone-900">Campus-Wide Low Stock Alerts</h3>
            <p className="text-xs text-stone-500">Real-time inventory radar identifying shortages</p>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead>Threshold</TableHead>
                <TableHead>Condition</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockAlerts.map((a) => (
                <TableRow key={a._id}>
                  <TableCell className="font-semibold text-stone-900">{a.name}</TableCell>
                  <TableCell>{a.storeId?.name || 'Store'}</TableCell>
                  <TableCell className="font-bold text-rose-600">{a.stock}</TableCell>
                  <TableCell>{a.lowStockThreshold}</TableCell>
                  <TableCell>
                    <Badge variant={a.stock <= 0 ? 'outOfStock' : 'lowStock'}>
                      {a.stock <= 0 ? 'Critical (Out of Stock)' : 'Low Stock Warning'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        {/* TAB 7: COMPLAINTS */}
        <TabsContent value="complaints" className="space-y-4 pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket #</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complaints.map((c) => (
                <TableRow key={c._id}>
                  <TableCell className="font-bold text-stone-900">{c.complaintNumber}</TableCell>
                  <TableCell>{c.studentName}</TableCell>
                  <TableCell className="font-semibold">{c.subject}</TableCell>
                  <TableCell className="text-stone-600 max-w-xs truncate">{c.description}</TableCell>
                  <TableCell>
                    <Badge variant={c.status === 'resolved' ? 'inStock' : 'hot'}>
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedComplaint(c);
                        setResolutionStatus(c.status);
                        setAdminResolutionNotes(c.adminNotes || '');
                        setResolveModalOpen(true);
                      }}
                    >
                      Review & Resolve
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        {/* TAB 8: AUDIT LOGS */}
        <TabsContent value="audit" className="space-y-4 pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Summary / Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <TableRow key={log._id}>
                  <TableCell className="text-[11px] text-stone-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium text-stone-900">{log.userName}</TableCell>
                  <TableCell className="font-semibold">{log.action}</TableCell>
                  <TableCell className="capitalize">{log.entityType}</TableCell>
                  <TableCell className="text-stone-600 max-w-sm truncate">{log.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      {/* Modal: Assign Store */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent onClose={() => setAssignModalOpen(false)} className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Store to {selectedSeller?.name}</DialogTitle>
            <DialogDescription>
              Associate this verified merchant with their official campus store.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <label className="text-xs font-semibold text-stone-700">Select Official Store</label>
            <select
              value={selectedStoreId}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-white border border-stone-200 rounded-xl"
            >
              <option value="">-- Choose Store --</option>
              {stores.map((st) => (
                <option key={st._id} value={st._id}>
                  {st.name} ({st.slug})
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="solid" size="sm" onClick={handleAssignStore}>
              Confirm Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Resolve Complaint */}
      <Dialog open={resolveModalOpen} onOpenChange={setResolveModalOpen}>
        <DialogContent onClose={() => setResolveModalOpen(false)} className="max-w-md">
          <DialogHeader>
            <DialogTitle>Resolve Ticket {selectedComplaint?.complaintNumber}</DialogTitle>
            <DialogDescription>{selectedComplaint?.subject}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700">Investigation Status</label>
              <select
                value={resolutionStatus}
                onChange={(e) => setResolutionStatus(e.target.value)}
                className="w-full px-3.5 py-2 text-xs bg-white border border-stone-200 rounded-xl"
              >
                <option value="under_review">Under Review</option>
                <option value="resolved">Resolved</option>
                <option value="dismissed">Dismissed</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700">
                Official Administrator Resolution Notes
              </label>
              <textarea
                value={adminResolutionNotes}
                onChange={(e) => setAdminResolutionNotes(e.target.value)}
                placeholder="Enter investigation conclusion, refund confirmation, or disciplinary action..."
                className="w-full px-3.5 py-2 text-xs bg-white border border-stone-200 rounded-xl min-h-[90px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setResolveModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="solid" size="sm" onClick={handleResolveComplaint}>
              Update Resolution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
