import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Product, IProduct } from '../models/Product.js';
import { Store } from '../models/Store.js';
import { InventoryMovement, MovementType } from '../models/InventoryMovement.js';
import { Notification } from '../models/Notification.js';
import { AuthRequest } from '../middleware/auth.js';
import { broadcastStockUpdate } from '../services/socketService.js';

// Get all active products for the student marketplace
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { storeId, category, brand, search, availability, limit = 100, page = 1 } = req.query;

    const query: any = { isActive: true };

    if (storeId) {
      if (storeId.toString().match(/^[0-9a-fA-F]{24}$/)) {
        query.storeId = storeId;
      } else {
        const store = await Store.findOne({ slug: storeId.toString() });
        if (store) {
          query.storeId = store._id;
        }
      }
    }

    if (category && category !== 'all') {
      query.category = category.toString().toLowerCase();
    }

    if (brand && brand !== 'all') {
      query.brand = new RegExp(brand.toString(), 'i');
    }

    if (search) {
      const searchRegex = new RegExp(search.toString().trim(), 'i');
      query.$or = [{ name: searchRegex }, { brand: searchRegex }, { description: searchRegex }];
    }

    if (availability === 'in_stock') {
      query.stock = { $gt: 0 };
    } else if (availability === 'low_stock') {
      query.$expr = { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$lowStockThreshold'] }] };
    } else if (availability === 'out_of_stock') {
      query.stock = { $lte: 0 };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('storeId', 'name slug isOpen offersDelivery estimatedPrepTime deliveryFee')
        .sort({ stock: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(query)
    ]);

    // Format products for student marketplace (hide private costPrice from students)
    const formattedProducts = products.map((p) => ({
      _id: p._id,
      name: p.name,
      store: p.storeId,
      description: p.description,
      brand: p.brand,
      category: p.category,
      image: p.image,
      unit: p.unit,
      variant: p.variant,
      sellingPrice: p.sellingPrice,
      stock: p.stock,
      reservedStock: p.reservedStock,
      availableStock: Math.max(0, p.stock - (p.reservedStock || 0)),
      lowStockThreshold: p.lowStockThreshold,
      isLowStock: p.stock > 0 && p.stock <= p.lowStockThreshold,
      isOutOfStock: p.stock <= 0,
      isComparable: p.isComparable,
      comparableGroupKey: p.comparableGroupKey
    }));

    res.json({
      success: true,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      products: formattedProducts
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Compare prices of comparable items across stores
export const getComparableProducts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find({ isActive: true, isComparable: true })
      .populate('storeId', 'name slug isOpen deliveryFee offersDelivery')
      .sort({ comparableGroupKey: 1, sellingPrice: 1 })
      .lean();

    // Group by comparableGroupKey
    const comparisonGroups: Record<string, any[]> = {};

    for (const p of products) {
      const key = p.comparableGroupKey || p.name.toLowerCase().trim();
      if (!comparisonGroups[key]) {
        comparisonGroups[key] = [];
      }
      comparisonGroups[key].push({
        _id: p._id,
        name: p.name,
        brand: p.brand,
        unit: p.unit,
        category: p.category,
        image: p.image,
        sellingPrice: p.sellingPrice,
        stock: p.stock,
        isAvailable: p.stock > 0,
        store: p.storeId
      });
    }

    // Only return groups with products in 2 or more stores for actual comparison
    const result = Object.entries(comparisonGroups)
      .filter(([_, items]) => items.length >= 2)
      .map(([groupKey, items]) => {
        const prices = items.map((i) => i.sellingPrice);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        return {
          groupKey,
          itemName: items[0].name,
          brand: items[0].brand,
          unit: items[0].unit,
          category: items[0].category,
          image: items[0].image,
          minPrice,
          maxPrice,
          priceDiff: maxPrice - minPrice,
          stores: items
        };
      });

    res.json({ success: true, count: result.length, groups: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Single product details
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id).populate('storeId');

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    res.json({ success: true, product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create product (Seller / Admin)
export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      storeId,
      name,
      description,
      brand,
      category,
      image,
      unit,
      variant,
      sellingPrice,
      costPrice,
      stock = 0,
      lowStockThreshold = 5,
      isComparable = false,
      comparableGroupKey
    } = req.body;

    const targetStoreId = storeId || req.user?.assignedStoreId;

    if (!targetStoreId) {
      res.status(400).json({ success: false, message: 'storeId is required.' });
      return;
    }

    // Check store ownership
    if (req.user?.role !== 'admin' && req.user?.assignedStoreId?.toString() !== targetStoreId.toString()) {
      res.status(403).json({ success: false, message: 'Unauthorized to add product to this store.' });
      return;
    }

    if (!name || !brand || !category || sellingPrice === undefined || costPrice === undefined) {
      res.status(400).json({
        success: false,
        message: 'Name, brand, category, sellingPrice, and costPrice are required.'
      });
      return;
    }

    const product = await Product.create({
      storeId: targetStoreId,
      name: name.trim(),
      description: description || '',
      brand: brand.trim(),
      category: category.toLowerCase(),
      image: image || '',
      unit: unit || '1 unit',
      variant: variant || 'Standard',
      sellingPrice: Number(sellingPrice),
      costPrice: Number(costPrice),
      stock: Number(stock),
      lowStockThreshold: Number(lowStockThreshold),
      isComparable: Boolean(isComparable),
      comparableGroupKey: comparableGroupKey ? comparableGroupKey.trim() : undefined,
      isActive: true
    });

    // Record initial inventory movement
    if (Number(stock) > 0) {
      await InventoryMovement.create({
        productId: product._id,
        storeId: targetStoreId,
        userId: req.user!._id,
        userName: req.user!.name,
        type: 'initial',
        delta: Number(stock),
        stockBefore: 0,
        stockAfter: Number(stock),
        reason: 'Initial stock entered upon product creation'
      });
    }

    // Broadcast live stock update
    broadcastStockUpdate({
      productId: product._id.toString(),
      storeId: targetStoreId.toString(),
      stock: product.stock,
      reservedStock: 0,
      availableStock: product.stock,
      sellingPrice: product.sellingPrice,
      name: product.name,
      lowStock: product.stock <= product.lowStockThreshold,
      outOfStock: product.stock <= 0
    });

    res.status(201).json({ success: true, message: 'Product created successfully', product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update product metadata (Seller / Admin)
export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    // Role check
    if (req.user?.role !== 'admin' && req.user?.assignedStoreId?.toString() !== product.storeId.toString()) {
      res.status(403).json({ success: false, message: 'Unauthorized to update this product.' });
      return;
    }

    const {
      name,
      description,
      brand,
      category,
      image,
      unit,
      variant,
      sellingPrice,
      costPrice,
      lowStockThreshold,
      isActive,
      isComparable,
      comparableGroupKey
    } = req.body;

    if (name) product.name = name.trim();
    if (description !== undefined) product.description = description;
    if (brand) product.brand = brand.trim();
    if (category) product.category = category.toLowerCase();
    if (image !== undefined) product.image = image;
    if (unit) product.unit = unit;
    if (variant) product.variant = variant;
    if (sellingPrice !== undefined) product.sellingPrice = Number(sellingPrice);
    if (costPrice !== undefined) product.costPrice = Number(costPrice);
    if (lowStockThreshold !== undefined) product.lowStockThreshold = Number(lowStockThreshold);
    if (isActive !== undefined) product.isActive = Boolean(isActive);
    if (isComparable !== undefined) product.isComparable = Boolean(isComparable);
    if (comparableGroupKey !== undefined) product.comparableGroupKey = comparableGroupKey;

    await product.save();

    // Broadcast update
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

    res.json({ success: true, message: 'Product updated successfully', product });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Adjust product stock (Restock, Physical Adjustment, Wastage, Damaged, Expired)
// Enforces mandatory reason, atomic inventory updates, and instant real-time broadcast!
export const adjustStock = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { type, delta, reason } = req.body;

    if (!type || delta === undefined || !reason || !reason.trim()) {
      res.status(400).json({
        success: false,
        message: 'Movement type, delta (quantity difference), and mandatory reason are required.'
      });
      return;
    }

    const validTypes: MovementType[] = [
      'restock',
      'adjustment',
      'wastage',
      'damaged',
      'expired'
    ];

    if (!validTypes.includes(type)) {
      res.status(400).json({ success: false, message: `Invalid movement type: ${type}` });
      return;
    }

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found.' });
      return;
    }

    // Role check
    if (req.user?.role !== 'admin' && req.user?.assignedStoreId?.toString() !== product.storeId.toString()) {
      res.status(403).json({ success: false, message: 'Unauthorized to adjust stock for this store.' });
      return;
    }

    const numDelta = Number(delta);
    const stockBefore = product.stock;
    const stockAfter = stockBefore + numDelta;

    if (stockAfter < 0) {
      res.status(400).json({
        success: false,
        message: `Negative stock prevented. Current stock is ${stockBefore}, cannot decrease by ${Math.abs(numDelta)}.`
      });
      return;
    }

    // Atomic update
    product.stock = stockAfter;
    await product.save();

    // Record inventory movement audit
    const movement = await InventoryMovement.create({
      productId: product._id,
      storeId: product.storeId,
      userId: req.user!._id,
      userName: req.user!.name,
      type,
      delta: numDelta,
      stockBefore,
      stockAfter,
      reason: reason.trim()
    });

    // Check low stock and trigger notification
    if (stockAfter <= product.lowStockThreshold) {
      await Notification.create({
        storeId: product.storeId,
        title: stockAfter === 0 ? 'Out of Stock Alert' : 'Low Stock Warning',
        message: `Product "${product.name}" has ${stockAfter} units remaining (threshold: ${product.lowStockThreshold}).`,
        type: 'low_stock',
        link: `/seller/inventory?product=${product._id}`
      });
    }

    // Broadcast instant real-time stock sync to all clients & student marketplace!
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

    res.json({
      success: true,
      message: 'Stock updated and synchronized in real time.',
      product: {
        _id: product._id,
        name: product.name,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold
      },
      movement
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
