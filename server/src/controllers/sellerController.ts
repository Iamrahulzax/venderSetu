import { Response } from 'express';
import mongoose from 'mongoose';
import { Store } from '../models/Store.js';
import { Product } from '../models/Product.js';
import { SubOrder, SubOrderStatus } from '../models/SubOrder.js';
import { InventoryMovement } from '../models/InventoryMovement.js';
import { AuthRequest } from '../middleware/auth.js';
import { broadcastStockUpdate, emitOrderStatusUpdate } from '../services/socketService.js';

// Get seller's store dashboard stats & metrics
export const getSellerDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const storeId = req.user?.assignedStoreId || req.params.storeId;

    if (!storeId) {
      res.status(400).json({ success: false, message: 'No store assigned to this seller.' });
      return;
    }

    const store = await Store.findById(storeId);
    if (!store) {
      res.status(404).json({ success: false, message: 'Store not found.' });
      return;
    }

    // Get today's start and end date
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // 1. Order counts and today's sales
    const [allSubOrders, todaySubOrders] = await Promise.all([
      SubOrder.find({ storeId }),
      SubOrder.find({ storeId, createdAt: { $gte: startOfToday } })
    ]);

    const pendingOrdersCount = allSubOrders.filter((o) => o.status === 'pending').length;
    const activeOrdersCount = allSubOrders.filter((o) =>
      ['accepted', 'preparing', 'ready_for_pickup', 'out_for_delivery'].includes(o.status)
    ).length;
    const completedOrdersCount = allSubOrders.filter((o) => o.status === 'completed').length;
    const cancelledOrdersCount = allSubOrders.filter((o) => ['cancelled', 'rejected'].includes(o.status)).length;

    // Today's completed or accepted sales
    const todaySales = todaySubOrders
      .filter((o) => !['cancelled', 'rejected'].includes(o.status))
      .reduce((sum, o) => sum + o.itemsSubtotal, 0);

    const totalLifetimeSales = allSubOrders
      .filter((o) => !['cancelled', 'rejected'].includes(o.status))
      .reduce((sum, o) => sum + o.itemsSubtotal, 0);

    // 2. Inventory Metrics and Valuation
    const products = await Product.find({ storeId, isActive: true });
    let totalStockUnits = 0;
    let totalCostValuation = 0;
    let totalRetailValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const p of products) {
      totalStockUnits += p.stock;
      totalCostValuation += p.stock * p.costPrice;
      totalRetailValuation += p.stock * p.sellingPrice;
      if (p.stock <= 0) {
        outOfStockCount++;
      } else if (p.stock <= p.lowStockThreshold) {
        lowStockCount++;
      }
    }

    const estimatedGrossProfit = Math.max(0, totalRetailValuation - totalCostValuation);

    // 3. Best selling products for this store
    const bestSellersAgg = await SubOrder.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(storeId.toString()), status: 'completed' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.name' },
          totalUnitsSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' }
        }
      },
      { $sort: { totalUnitsSold: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      store: {
        _id: store._id,
        name: store.name,
        slug: store.slug,
        isOpen: store.isOpen,
        offersDelivery: store.offersDelivery,
        deliveryFee: store.deliveryFee,
        minimumOrder: store.minimumOrder,
        estimatedPrepTime: store.estimatedPrepTime,
        location: store.location
      },
      stats: {
        todaySales,
        todayOrdersCount: todaySubOrders.length,
        totalLifetimeSales,
        totalOrdersCount: allSubOrders.length,
        pendingOrdersCount,
        activeOrdersCount,
        completedOrdersCount,
        cancelledOrdersCount,
        inventory: {
          totalProductsCount: products.length,
          totalStockUnits,
          totalCostValuation,
          totalRetailValuation,
          estimatedGrossProfit,
          lowStockCount,
          outOfStockCount
        },
        bestSellers: bestSellersAgg
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get SubOrders for Seller's store
export const getSellerOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const storeId = req.user?.assignedStoreId || req.params.storeId;
    const { status, limit = 50, page = 1 } = req.query;

    if (!storeId) {
      res.status(400).json({ success: false, message: 'Store ID required.' });
      return;
    }

    const query: any = { storeId };

    if (status && status !== 'all') {
      if (status === 'active') {
        query.status = { $in: ['pending', 'accepted', 'preparing', 'ready_for_pickup', 'out_for_delivery'] };
      } else {
        query.status = status;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      SubOrder.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      SubOrder.countDocuments(query)
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

// Seller updates SubOrder status (Accept, Reject, Preparing, Ready, Out for delivery, Completed)
export const updateSubOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subOrderId } = req.params;
    const { status, rejectionReason } = req.body;

    const subOrder = await SubOrder.findById(subOrderId);
    if (!subOrder) {
      res.status(404).json({ success: false, message: 'SubOrder not found.' });
      return;
    }

    // Authorization check
    if (
      req.user?.role !== 'admin' &&
      req.user?.assignedStoreId?.toString() !== subOrder.storeId.toString()
    ) {
      res.status(403).json({ success: false, message: 'Unauthorized to update this order.' });
      return;
    }

    const validStatuses: SubOrderStatus[] = [
      'pending',
      'accepted',
      'preparing',
      'ready_for_pickup',
      'out_for_delivery',
      'completed',
      'rejected',
      'cancelled'
    ];

    if (!validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: `Invalid status: ${status}` });
      return;
    }

    // If seller rejects the order, restore stock back!
    if (status === 'rejected' && subOrder.status !== 'rejected') {
      if (!rejectionReason) {
        res.status(400).json({ success: false, message: 'Rejection reason is required.' });
        return;
      }

      for (const item of subOrder.items) {
        const product = await Product.findById(item.productId);
        if (product) {
          const stockBefore = product.stock;
          const stockAfter = stockBefore + item.quantity;
          product.stock = stockAfter;
          await product.save();

          await InventoryMovement.create({
            productId: product._id,
            storeId: product.storeId,
            userId: req.user!._id,
            userName: req.user!.name,
            type: 'cancellation',
            delta: item.quantity,
            stockBefore,
            stockAfter,
            reason: `Stock restored from rejected order ${subOrder.subOrderNumber}: ${rejectionReason}`
          });

          broadcastStockUpdate({
            productId: product._id.toString(),
            storeId: product.storeId.toString(),
            stock: product.stock,
            reservedStock: product.reservedStock || 0,
            availableStock: Math.max(0, product.stock - (product.reservedStock || 0)),
            sellingPrice: product.sellingPrice,
            name: product.name,
            lowStock: product.stock <= product.lowStockThreshold,
            outOfStock: product.stock <= 0
          });
        }
      }

      subOrder.rejectionReason = rejectionReason;
      if (subOrder.paymentStatus === 'paid') {
        subOrder.paymentStatus = 'refunded';
      }
    }

    // Set timestamps
    if (status === 'accepted') subOrder.acceptedAt = new Date();
    if (status === 'ready_for_pickup' || status === 'out_for_delivery') subOrder.readyAt = new Date();
    if (status === 'completed') {
      subOrder.completedAt = new Date();
      // If cash on pickup, mark payment completed
      if (subOrder.paymentStatus === 'pending') {
        subOrder.paymentStatus = 'paid';
      }
    }

    subOrder.status = status;
    await subOrder.save();

    // Notify student in real-time
    emitOrderStatusUpdate(subOrder.studentId.toString(), subOrder);

    res.json({
      success: true,
      message: `SubOrder status updated to "${status}".`,
      subOrder
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Inventory Movement Audit Logs for Seller's Store
export const getInventoryMovements = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const storeId = req.user?.assignedStoreId || req.params.storeId;
    const { productId, type, limit = 50, page = 1 } = req.query;

    if (!storeId) {
      res.status(400).json({ success: false, message: 'Store ID required.' });
      return;
    }

    const query: any = { storeId };
    if (productId) query.productId = productId;
    if (type && type !== 'all') query.type = type;

    const skip = (Number(page) - 1) * Number(limit);

    const [movements, total] = await Promise.all([
      InventoryMovement.find(query)
        .populate('productId', 'name brand category unit')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      InventoryMovement.countDocuments(query)
    ]);

    res.json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      movements
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Export Store Inventory to CSV
export const exportInventoryCSV = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const storeId = req.user?.assignedStoreId || req.params.storeId;
    if (!storeId) {
      res.status(400).json({ success: false, message: 'Store ID required.' });
      return;
    }

    const store = await Store.findById(storeId);
    const products = await Product.find({ storeId }).sort({ name: 1 });

    const header = [
      'Product ID',
      'Product Name',
      'Brand',
      'Category',
      'Unit',
      'Variant',
      'Current Stock',
      'Cost Price (₹)',
      'Selling Price (₹)',
      'Total Cost Value (₹)',
      'Total Retail Value (₹)',
      'Potential Gross Profit (₹)',
      'Low Stock Threshold',
      'Status'
    ].join(',');

    const rows = products.map((p) => {
      const totalCost = p.stock * p.costPrice;
      const totalRetail = p.stock * p.sellingPrice;
      const profit = totalRetail - totalCost;
      const status = p.stock <= 0 ? 'Out of Stock' : p.stock <= p.lowStockThreshold ? 'Low Stock' : 'In Stock';

      return [
        `"${p._id}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.brand.replace(/"/g, '""')}"`,
        `"${p.category}"`,
        `"${p.unit}"`,
        `"${p.variant}"`,
        p.stock,
        p.costPrice.toFixed(2),
        p.sellingPrice.toFixed(2),
        totalCost.toFixed(2),
        totalRetail.toFixed(2),
        profit.toFixed(2),
        p.lowStockThreshold,
        `"${status}"`
      ].join(',');
    });

    const csvContent = [header, ...rows].join('\n');
    const filename = `${store ? store.slug : 'store'}-inventory-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
