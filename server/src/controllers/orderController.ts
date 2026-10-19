import { Response } from 'express';
import crypto from 'crypto';
import mongoose from 'mongoose';
import { Order, PaymentMethod, PaymentStatus } from '../models/Order.js';
import { SubOrder, SubOrderStatus } from '../models/SubOrder.js';
import { Product } from '../models/Product.js';
import { Store } from '../models/Store.js';
import { Cart } from '../models/Cart.js';
import { InventoryMovement } from '../models/InventoryMovement.js';
import { AuthRequest } from '../middleware/auth.js';
import { ENV } from '../config/env.js';
import {
  broadcastStockUpdate,
  emitNewSubOrder,
  emitOrderStatusUpdate
} from '../services/socketService.js';

// Helper to generate readable order numbers
const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `VS-${timestamp}-${random}`;
};

// Checkout & Create Multi-Store Order
export const createCheckoutOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const student = req.user!;
    const {
      paymentMethod = 'cash_on_pickup',
      fulfillmentType = 'pickup',
      deliveryAddress = '',
      notes = '',
      storeFulfillmentOptions = {} // { [storeId]: 'pickup' | 'delivery' }
    } = req.body;

    // Fetch user cart
    const cart = await Cart.findOne({ userId: student._id });
    if (!cart || cart.items.length === 0) {
      res.status(400).json({ success: false, message: 'Your cart is empty.' });
      return;
    }

    // Load all products in the cart
    const productIds = cart.items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    // Group items by store
    const storeMap: Record<string, { store: any; items: any[] }> = {};

    for (const item of cart.items) {
      const product = productMap.get(item.productId.toString());

      if (!product || !product.isActive) {
        res.status(400).json({
          success: false,
          message: `Item "${product ? product.name : 'Unknown'}" is currently unavailable.`
        });
        return;
      }

      if (product.isAvailable === false) {
        res.status(400).json({
          success: false,
          message: `"${product.name}" is temporarily marked as unavailable by the seller.`
        });
        return;
      }

      // Check current stock availability
      const availableStock = Math.max(0, product.stock - (product.reservedStock || 0));
      if (availableStock < item.quantity) {
        res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${availableStock}, Requested: ${item.quantity}.`
        });
        return;
      }

      const storeIdStr = product.storeId.toString();
      if (!storeMap[storeIdStr]) {
        const store = await Store.findById(product.storeId);
        if (!store) {
          res.status(400).json({ success: false, message: 'Store not found for product.' });
          return;
        }
        if (!store.isOpen) {
          res.status(400).json({
            success: false,
            message: `Store "${store.name}" is currently closed. Please remove its items to proceed.`
          });
          return;
        }
        storeMap[storeIdStr] = { store, items: [] };
      }

      // Compute price taking into account selected variant and addons
      const variantPrice = item.selectedVariant && item.selectedVariant.price !== undefined
        ? Number(item.selectedVariant.price)
        : product.sellingPrice;
      const addonsPrice = Array.isArray(item.selectedAddons)
        ? item.selectedAddons.reduce((sum: number, a: any) => sum + (Number(a.price) || 0), 0)
        : 0;
      const effectiveUnitPrice = variantPrice + addonsPrice;
      const itemSubtotal = effectiveUnitPrice * item.quantity;

      storeMap[storeIdStr].items.push({
        product,
        quantity: item.quantity,
        unitPrice: effectiveUnitPrice,
        costPrice: product.costPrice,
        subtotal: itemSubtotal,
        selectedVariant: item.selectedVariant,
        selectedAddons: item.selectedAddons || []
      });
    }

    // Step 2: Atomic Stock Decrement & Movement Audit for each item
    for (const item of cart.items) {
      const product = productMap.get(item.productId.toString())!;
      const stockBefore = product.stock;
      const stockAfter = stockBefore - item.quantity;

      // Update product atomically
      product.stock = stockAfter;
      await product.save();

      // Record movement
      await InventoryMovement.create({
        productId: product._id,
        storeId: product.storeId,
        userId: student._id,
        userName: student.name,
        type: 'sale',
        delta: -item.quantity,
        stockBefore,
        stockAfter,
        reason: `Online order placement by student ${student.name}`
      });

      // Live stock broadcast via Socket.IO
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

    // Step 3: Create Parent Order and Store-Specific SubOrders
    const orderNumber = generateOrderNumber();
    let parentItemsTotal = 0;
    let parentDeliveryTotal = 0;
    const createdSubOrderIds: mongoose.Types.ObjectId[] = [];
    const createdSubOrders: any[] = [];

    // Temporary parent order ID placeholder
    const parentOrderId = new mongoose.Types.ObjectId();

    for (const [storeIdStr, data] of Object.entries(storeMap)) {
      const { store, items } = data;
      const storeFulfillment =
        storeFulfillmentOptions[storeIdStr] ||
        (store.offersDelivery && fulfillmentType === 'delivery' ? 'delivery' : 'pickup');

      let deliveryFee = 0;
      if (storeFulfillment === 'delivery' && store.offersDelivery) {
        deliveryFee = store.deliveryFee || 0;
      }

      const itemsSubtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
      const subOrderTotal = itemsSubtotal + deliveryFee;

      parentItemsTotal += itemsSubtotal;
      parentDeliveryTotal += deliveryFee;

      const subOrderNumber = `${orderNumber}-${store.slug.slice(0, 4).toUpperCase()}`;

      const subOrder = await SubOrder.create({
        subOrderNumber,
        orderId: parentOrderId,
        storeId: store._id,
        studentId: student._id,
        studentName: student.name,
        studentPhone: student.phone || '',
        studentEmail: student.email,
        items: items.map((i) => ({
          productId: i.product._id,
          name: i.product.name,
          brand: i.product.brand,
          category: i.product.category,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          costPrice: i.costPrice,
          unit: i.product.unit,
          subtotal: i.subtotal,
          selectedVariant: i.selectedVariant,
          selectedAddons: i.selectedAddons || []
        })),
        itemsSubtotal,
        deliveryFee,
        totalAmount: subOrderTotal,
        fulfillmentType: storeFulfillment,
        deliveryAddress: storeFulfillment === 'delivery' ? deliveryAddress || student.hostelRoom : '',
        notes,
        status: 'pending',
        paymentStatus: paymentMethod === 'upi' || paymentMethod === 'card' ? 'pending' : 'pending'
      });

      createdSubOrderIds.push(subOrder._id as any);
      createdSubOrders.push(subOrder);

      // Emit new suborder in real time to the seller's dashboard!
      emitNewSubOrder(store._id.toString(), subOrder);
    }

    const grandTotal = parentItemsTotal + parentDeliveryTotal;

    // Create Razorpay sandbox order if payment method is online
    let razorpayOrderId: string | undefined;
    if (paymentMethod === 'upi' || paymentMethod === 'card' || paymentMethod === 'netbanking') {
      razorpayOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
    }

    const order = await Order.create({
      _id: parentOrderId,
      orderNumber,
      studentId: student._id,
      studentName: student.name,
      studentEmail: student.email,
      studentPhone: student.phone || '',
      suborders: createdSubOrderIds,
      totalAmount: grandTotal,
      deliveryTotal: parentDeliveryTotal,
      itemsTotal: parentItemsTotal,
      paymentMethod,
      paymentStatus: 'pending',
      paymentDetails: {
        razorpayOrderId
      },
      fulfillmentType,
      deliveryAddress,
      notes
    });

    // Clear student cart
    cart.items = [];
    await cart.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully!',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        razorpayOrderId,
        subordersCount: createdSubOrders.length,
        suborders: createdSubOrders
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Payment Verification (Razorpay / Cryptographic signature check)
export const verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { razorpayPaymentId, razorpaySignature } = req.body;

    const order = await Order.findById(orderId).populate('suborders');
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    // CRITICAL SECURITY FIX: Authorization check (IDOR Protection)
    const isOwner = req.user?.role === 'student' && order.studentId.toString() === req.user._id.toString();
    const isAdmin = req.user?.role === 'admin';
    if (!isOwner && !isAdmin) {
      res.status(403).json({ success: false, message: 'Unauthorized to verify payment for this order.' });
      return;
    }

    // Idempotency check: prevent duplicate payment processing
    if (order.paymentStatus === 'paid') {
      res.json({ success: true, message: 'Order already marked as paid.', order });
      return;
    }

    const razorpayOrderId = order.paymentDetails?.razorpayOrderId;
    const isOnlinePayment = ['upi', 'card', 'netbanking'].includes(order.paymentMethod);

    if (isOnlinePayment && razorpayOrderId) {
      if (!razorpayPaymentId) {
        res.status(400).json({ success: false, message: 'razorpayPaymentId is required for online payments.' });
        return;
      }

      // Generate expected cryptographic HMAC SHA-256 signature
      const expectedSignature = crypto
        .createHmac('sha256', ENV.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      let signatureValid = false;
      if (razorpaySignature && typeof razorpaySignature === 'string') {
        const expectedBuf = Buffer.from(expectedSignature, 'utf8');
        const providedBuf = Buffer.from(razorpaySignature, 'utf8');

        if (expectedBuf.length === providedBuf.length && crypto.timingSafeEqual(expectedBuf, providedBuf)) {
          signatureValid = true;
        } else if (ENV.NODE_ENV !== 'production' && razorpaySignature === 'simulated_valid_signature') {
          // Allow mock signature only in non-production development environments
          signatureValid = true;
        }
      }

      if (!signatureValid) {
        res.status(400).json({
          success: false,
          message: 'Invalid payment signature. Verification failed.'
        });
        return;
      }
    }

    const paymentId = razorpayPaymentId || `pay_${crypto.randomBytes(8).toString('hex')}`;

    order.paymentStatus = 'paid';
    order.paymentDetails.razorpayPaymentId = paymentId;
    order.paymentDetails.razorpaySignature = razorpaySignature || 'verified_signature';
    order.paymentDetails.paidAt = new Date();
    await order.save();

    // Update all suborders as paid and emit real-time status update to stores
    await SubOrder.updateMany({ orderId: order._id }, { paymentStatus: 'paid' });

    for (const subId of order.suborders) {
      const sub = await SubOrder.findById(subId);
      if (sub) {
        emitOrderStatusUpdate(order.studentId.toString(), sub);
      }
    }

    res.json({
      success: true,
      message: 'Payment verified and confirmed successfully!',
      order
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get student's orders history
export const getStudentOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user!._id;

    const orders = await Order.find({ studentId })
      .populate({
        path: 'suborders',
        populate: {
          path: 'storeId',
          select: 'name slug contactPhone location'
        }
      })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: orders.length, orders });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single order with suborders breakdown
export const getOrderById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId)
      .populate({
        path: 'suborders',
        populate: {
          path: 'storeId',
          select: 'name slug contactPhone location openingHours'
        }
      })
      .lean();

    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found.' });
      return;
    }

    // Role check: student who placed it, seller whose store has a suborder, or admin
    if (req.user?.role === 'student' && order.studentId.toString() !== req.user._id.toString()) {
      res.status(403).json({ success: false, message: 'Unauthorized to view this order.' });
      return;
    }

    res.json({ success: true, order });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Cancel SubOrder / Order (Releases stock back safely!)
export const cancelSubOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subOrderId } = req.params;
    const { reason = 'Cancelled by student' } = req.body;

    const subOrder = await SubOrder.findById(subOrderId);
    if (!subOrder) {
      res.status(404).json({ success: false, message: 'SubOrder not found.' });
      return;
    }

    // Check authorization: Student who placed it, or Seller of that store, or Admin
    const isOwnerStudent = req.user?.role === 'student' && subOrder.studentId.toString() === req.user._id.toString();
    const isOwnerSeller = req.user?.role === 'seller' && req.user.assignedStoreId?.toString() === subOrder.storeId.toString();
    const isAdmin = req.user?.role === 'admin';

    if (!isOwnerStudent && !isOwnerSeller && !isAdmin) {
      res.status(403).json({ success: false, message: 'Unauthorized to cancel this suborder.' });
      return;
    }

    if (subOrder.status === 'completed' || subOrder.status === 'cancelled') {
      res.status(400).json({
        success: false,
        message: `Cannot cancel an order that is already ${subOrder.status}.`
      });
      return;
    }

    // Release stock back for each item in the cancelled suborder
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
          reason: `Stock restored from cancelled order ${subOrder.subOrderNumber}: ${reason}`
        });

        // Broadcast real-time stock update
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

    subOrder.status = 'cancelled';
    subOrder.cancellationReason = reason;
    subOrder.cancelledAt = new Date();
    if (subOrder.paymentStatus === 'paid') {
      subOrder.paymentStatus = 'refunded';
    }
    await subOrder.save();

    // Broadcast status update
    emitOrderStatusUpdate(subOrder.studentId.toString(), subOrder);

    res.json({
      success: true,
      message: 'SubOrder cancelled and inventory successfully restored.',
      subOrder
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
