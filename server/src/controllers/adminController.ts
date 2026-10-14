import { Response } from 'express';
import { User } from '../models/User.js';
import { Store } from '../models/Store.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { SubOrder } from '../models/SubOrder.js';
import { Complaint } from '../models/Complaint.js';
import { AuditLog } from '../models/AuditLog.js';
import { AuthRequest } from '../middleware/auth.js';

// Platform Overview Stats
export const getAdminOverview = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalSellers,
      stores,
      totalProducts,
      orders,
      complaints,
      lowStockProducts
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'seller' }),
      Store.find().lean(),
      Product.countDocuments({ isActive: true }),
      Order.find().lean(),
      Complaint.find().lean(),
      Product.find({
        isActive: true,
        $expr: { $lte: ['$stock', '$lowStockThreshold'] }
      })
        .populate('storeId', 'name slug')
        .lean()
    ]);

    const totalRevenue = orders
      .filter((o) => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const pendingComplaints = complaints.filter((c) => c.status === 'open' || c.status === 'investigating').length;

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalStudents,
        totalSellers,
        totalStores: stores.length,
        totalProducts,
        totalOrders: orders.length,
        totalRevenue,
        pendingComplaints,
        lowStockAlertsCount: lowStockProducts.length
      },
      stores,
      lowStockProducts: lowStockProducts.slice(0, 10),
      recentOrders: orders.slice(-10).reverse()
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Manage Sellers (List, Approve, Suspend, Assign Store)
export const getAllSellers = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sellers = await User.find({ role: 'seller' })
      .populate('assignedStoreId', 'name slug')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, sellers });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSellerStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { sellerId } = req.params;
    const { isApproved, status, assignedStoreId } = req.body;

    const seller = await User.findById(sellerId);
    if (!seller || seller.role !== 'seller') {
      res.status(404).json({ success: false, message: 'Seller not found.' });
      return;
    }

    if (isApproved !== undefined) seller.isApproved = Boolean(isApproved);
    if (status !== undefined) seller.status = status;
    if (assignedStoreId !== undefined) seller.assignedStoreId = assignedStoreId;

    await seller.save();

    await AuditLog.create({
      action: 'ADMIN_SELLER_STATUS_CHANGED',
      actorId: req.user!._id,
      actorName: req.user!.name,
      actorRole: 'admin',
      targetId: seller._id.toString(),
      targetType: 'User',
      details: { isApproved, status, assignedStoreId }
    });

    res.json({ success: true, message: 'Seller status updated', seller });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Platform wide orders
export const getAllPlatformOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { paymentStatus, limit = 50, page = 1 } = req.query;
    const query: any = {};
    if (paymentStatus && paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate({
          path: 'suborders',
          populate: { path: 'storeId', select: 'name slug' }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Order.countDocuments(query)
    ]);

    res.json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      orders
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cross-store Stock Discrepancies and Inventory Alert
export const getPlatformStockAlerts = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const alerts = await Product.find({
      isActive: true,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] }
    })
      .populate('storeId', 'name slug contactPhone location')
      .sort({ stock: 1 })
      .lean();

    res.json({ success: true, count: alerts.length, alerts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Complaints Management
export const getComplaints = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const complaints = await Complaint.find()
      .populate('orderId', 'orderNumber totalAmount paymentStatus')
      .populate('subOrderId', 'subOrderNumber totalAmount status')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: complaints.length, complaints });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createComplaint = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId, subOrderId, storeId, storeName, subject, description } = req.body;

    if (!subject || !description) {
      res.status(400).json({ success: false, message: 'Subject and description are required.' });
      return;
    }

    const complaint = await Complaint.create({
      studentId: req.user!._id,
      studentName: req.user!.name,
      studentEmail: req.user!.email,
      orderId,
      subOrderId,
      storeId,
      storeName,
      subject,
      description,
      status: 'open'
    });

    res.status(201).json({ success: true, message: 'Complaint registered successfully.', complaint });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateComplaintStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { complaintId } = req.params;
    const { status, adminNotes } = req.body;

    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      res.status(404).json({ success: false, message: 'Complaint not found.' });
      return;
    }

    if (status) complaint.status = status;
    if (adminNotes !== undefined) complaint.adminNotes = adminNotes;

    await complaint.save();

    res.json({ success: true, message: 'Complaint status updated.', complaint });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Audit Logs
export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { limit = 100 } = req.query;
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(Number(limit)).lean();
    res.json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Platform Sales Report Export
export const exportPlatformReportCSV = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const orders = await Order.find().populate('suborders').sort({ createdAt: -1 }).lean();

    const header = [
      'Order Number',
      'Student Name',
      'Student Email',
      'Payment Method',
      'Payment Status',
      'Fulfillment',
      'Items Total (₹)',
      'Delivery Total (₹)',
      'Grand Total (₹)',
      'Suborders Count',
      'Created At'
    ].join(',');

    const rows = orders.map((o: any) => [
      `"${o.orderNumber}"`,
      `"${o.studentName}"`,
      `"${o.studentEmail}"`,
      `"${o.paymentMethod}"`,
      `"${o.paymentStatus}"`,
      `"${o.fulfillmentType}"`,
      o.itemsTotal.toFixed(2),
      o.deliveryTotal.toFixed(2),
      o.totalAmount.toFixed(2),
      o.suborders ? o.suborders.length : 0,
      `"${new Date(o.createdAt).toISOString()}"`
    ].join(','));

    const csvContent = [header, ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="vendersetu-platform-report-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.status(200).send(csvContent);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
