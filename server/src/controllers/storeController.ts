import { Request, Response } from 'express';
import { Store } from '../models/Store.js';
import { Product } from '../models/Product.js';
import { AuthRequest } from '../middleware/auth.js';

export const getAllStores = async (_req: Request, res: Response): Promise<void> => {
  try {
    const stores = await Store.find().sort({ name: 1 }).lean();

    // Attach product count for each store
    const storeIds = stores.map((s) => s._id);
    const counts = await Product.aggregate([
      { $match: { storeId: { $in: storeIds }, isActive: true } },
      { $group: { _id: '$storeId', totalProducts: { $sum: 1 } } }
    ]);

    const countMap = new Map(counts.map((c) => [c._id.toString(), c.totalProducts]));

    const storesWithCounts = stores.map((s) => ({
      ...s,
      productCount: countMap.get(s._id.toString()) || 0
    }));

    res.json({ success: true, stores: storesWithCounts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStoreBySlugOrId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier } = req.params;
    let store;

    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      store = await Store.findById(identifier);
    } else {
      store = await Store.findOne({ slug: identifier });
    }

    if (!store) {
      res.status(404).json({ success: false, message: 'Store not found.' });
      return;
    }

    const totalProducts = await Product.countDocuments({ storeId: store._id, isActive: true });

    res.json({
      success: true,
      store: {
        ...store.toObject(),
        productCount: totalProducts
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStoreSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { storeId } = req.params;
    const {
      isOpen,
      openingHours,
      offersDelivery,
      deliveryFee,
      minimumOrder,
      estimatedPrepTime,
      contactPhone,
      description,
      location
    } = req.body;

    const store = await Store.findById(storeId);
    if (!store) {
      res.status(404).json({ success: false, message: 'Store not found.' });
      return;
    }

    // Role check: Admin or Seller assigned to this store
    if (req.user?.role !== 'admin' && req.user?.assignedStoreId?.toString() !== storeId) {
      res.status(403).json({ success: false, message: 'Unauthorized to modify this store settings.' });
      return;
    }

    if (isOpen !== undefined) store.isOpen = Boolean(isOpen);
    if (openingHours !== undefined) store.openingHours = openingHours;
    if (offersDelivery !== undefined) store.offersDelivery = Boolean(offersDelivery);
    if (deliveryFee !== undefined) store.deliveryFee = Number(deliveryFee);
    if (minimumOrder !== undefined) store.minimumOrder = Number(minimumOrder);
    if (estimatedPrepTime !== undefined) store.estimatedPrepTime = estimatedPrepTime;
    if (contactPhone !== undefined) store.contactPhone = contactPhone;
    if (description !== undefined) store.description = description;
    if (location !== undefined) store.location = location;
    if (req.body.bannerImage !== undefined) store.bannerImage = req.body.bannerImage;
    if (req.body.categoryTags !== undefined) store.categoryTags = req.body.categoryTags;

    await store.save();

    res.json({ success: true, message: 'Store settings updated successfully', store });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add uploaded menu document (PDF or image)
export const addMenuDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { storeId } = req.params;
    const { title, fileUrl, fileType = 'image' } = req.body;

    if (!fileUrl) {
      res.status(400).json({ success: false, message: 'fileUrl is required.' });
      return;
    }

    const store = await Store.findById(storeId);
    if (!store) {
      res.status(404).json({ success: false, message: 'Store not found.' });
      return;
    }

    if (req.user?.role !== 'admin' && req.user?.assignedStoreId?.toString() !== storeId) {
      res.status(403).json({ success: false, message: 'Unauthorized to add menu document for this store.' });
      return;
    }

    store.menuDocuments.push({
      title: title || `${store.name} Digital Menu`,
      fileUrl,
      fileType: fileType === 'pdf' ? 'pdf' : 'image',
      uploadedAt: new Date()
    });

    await store.save();

    res.status(201).json({
      success: true,
      message: 'Menu document published successfully.',
      menuDocuments: store.menuDocuments
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove menu document
export const removeMenuDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { storeId, docId } = req.params;

    const store = await Store.findById(storeId);
    if (!store) {
      res.status(404).json({ success: false, message: 'Store not found.' });
      return;
    }

    if (req.user?.role !== 'admin' && req.user?.assignedStoreId?.toString() !== storeId) {
      res.status(403).json({ success: false, message: 'Unauthorized.' });
      return;
    }

    store.menuDocuments = store.menuDocuments.filter(
      (doc: any) => doc._id.toString() !== docId
    );

    await store.save();

    res.json({
      success: true,
      message: 'Menu document removed successfully.',
      menuDocuments: store.menuDocuments
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
