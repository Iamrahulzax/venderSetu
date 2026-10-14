import { Response } from 'express';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { Store } from '../models/Store.js';
import { AuthRequest } from '../middleware/auth.js';

export const getCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = await Cart.create({ userId, items: [] });
    }

    // Populate active products and their stores
    const productIds = cart.items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } })
      .populate('storeId', 'name slug isOpen offersDelivery deliveryFee minimumOrder estimatedPrepTime')
      .lean();

    const productMap = new Map(products.map((p) => [p._id.toString(), p]));

    // Group items by store for multi-store cart display
    const storeGroups: Record<string, any> = {};
    const validItems: any[] = [];
    let grandTotal = 0;
    let totalItemsCount = 0;

    for (const item of cart.items) {
      const product: any = productMap.get(item.productId.toString());
      if (!product || !product.isActive) {
        // Item no longer available; can skip or show warning
        continue;
      }

      const store = product.storeId;
      const storeIdStr = store._id.toString();

      const availableStock = Math.max(0, product.stock - (product.reservedStock || 0));
      const isAvailable = availableStock >= item.quantity;
      const itemSubtotal = product.sellingPrice * item.quantity;

      const enrichedItem = {
        productId: product._id,
        name: product.name,
        brand: product.brand,
        image: product.image,
        unit: product.unit,
        price: product.sellingPrice,
        quantity: item.quantity,
        stock: product.stock,
        availableStock,
        isAvailable,
        subtotal: itemSubtotal,
        storeId: store._id,
        storeName: store.name
      };

      validItems.push(enrichedItem);
      grandTotal += itemSubtotal;
      totalItemsCount += item.quantity;

      if (!storeGroups[storeIdStr]) {
        storeGroups[storeIdStr] = {
          storeId: store._id,
          storeName: store.name,
          slug: store.slug,
          isOpen: store.isOpen,
          offersDelivery: store.offersDelivery,
          deliveryFee: store.deliveryFee || 0,
          minimumOrder: store.minimumOrder || 0,
          estimatedPrepTime: store.estimatedPrepTime,
          items: [],
          storeSubtotal: 0
        };
      }

      storeGroups[storeIdStr].items.push(enrichedItem);
      storeGroups[storeIdStr].storeSubtotal += itemSubtotal;
    }

    res.json({
      success: true,
      cart: {
        totalItemsCount,
        grandTotal,
        items: validItems,
        storeGroups: Object.values(storeGroups)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addToCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      res.status(400).json({ success: false, message: 'productId is required.' });
      return;
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      res.status(404).json({ success: false, message: 'Product is not available.' });
      return;
    }

    const availableStock = Math.max(0, product.stock - (product.reservedStock || 0));
    if (availableStock <= 0) {
      res.status(400).json({ success: false, message: 'Sorry, this product is currently out of stock.' });
      return;
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingIndex = cart.items.findIndex((i) => i.productId.toString() === productId);

    if (existingIndex > -1) {
      const newQty = cart.items[existingIndex].quantity + Number(quantity);
      if (newQty > availableStock) {
        res.status(400).json({
          success: false,
          message: `Cannot add more. Only ${availableStock} units available in stock.`
        });
        return;
      }
      cart.items[existingIndex].quantity = newQty;
    } else {
      if (Number(quantity) > availableStock) {
        res.status(400).json({
          success: false,
          message: `Only ${availableStock} units available in stock.`
        });
        return;
      }
      cart.items.push({
        productId: product._id as any,
        storeId: product.storeId as any,
        quantity: Number(quantity)
      });
    }

    await cart.save();
    res.json({ success: true, message: `Added "${product.name}" to cart.` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCartQuantity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      res.status(400).json({ success: false, message: 'productId and quantity are required.' });
      return;
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      res.status(404).json({ success: false, message: 'Cart not found.' });
      return;
    }

    const itemIndex = cart.items.findIndex((i) => i.productId.toString() === productId);
    if (itemIndex === -1) {
      res.status(404).json({ success: false, message: 'Item not in cart.' });
      return;
    }

    const numQty = Number(quantity);
    if (numQty <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      const product = await Product.findById(productId);
      if (product) {
        const availableStock = Math.max(0, product.stock - (product.reservedStock || 0));
        if (numQty > availableStock) {
          res.status(400).json({
            success: false,
            message: `Only ${availableStock} units available in stock.`
          });
          return;
        }
      }
      cart.items[itemIndex].quantity = numQty;
    }

    await cart.save();
    res.json({ success: true, message: 'Cart updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeFromCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    const { productId } = req.params;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      res.status(404).json({ success: false, message: 'Cart not found.' });
      return;
    }

    cart.items = cart.items.filter((i) => i.productId.toString() !== productId);
    await cart.save();

    res.json({ success: true, message: 'Item removed from cart' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clearCart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!._id;
    await Cart.findOneAndUpdate({ userId }, { items: [] });
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
