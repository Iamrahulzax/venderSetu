import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

export interface CartItem {
  productId: string;
  name: string;
  brand: string;
  image: string;
  unit: string;
  price: number;
  basePrice?: number;
  selectedVariant?: {
    name: string;
    price: number;
  };
  selectedAddons?: Array<{
    name: string;
    price: number;
  }>;
  quantity: number;
  stock: number;
  availableStock: number;
  isAvailable: boolean;
  subtotal: number;
  storeId: string;
  storeName: string;
}

export interface StoreGroup {
  storeId: string;
  storeName: string;
  slug: string;
  isOpen: boolean;
  offersDelivery: boolean;
  deliveryFee: number;
  minimumOrder: number;
  estimatedPrepTime: string;
  items: CartItem[];
  storeSubtotal: number;
}

interface CartContextType {
  cart: {
    totalItemsCount: number;
    grandTotal: number;
    items: CartItem[];
    storeGroups: StoreGroup[];
  };
  loading: boolean;
  addToCart: (
    productId: string,
    quantity?: number,
    selectedVariant?: { name: string; price: number },
    selectedAddons?: Array<{ name: string; price: number }>
  ) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { liveStocks } = useSocket();
  const [cart, setCart] = useState<{
    totalItemsCount: number;
    grandTotal: number;
    items: CartItem[];
    storeGroups: StoreGroup[];
  }>({
    totalItemsCount: 0,
    grandTotal: 0,
    items: [],
    storeGroups: []
  });
  const [loading, setLoading] = useState<boolean>(false);

  const fetchCart = async () => {
    if (!user) {
      setCart({ totalItemsCount: 0, grandTotal: 0, items: [], storeGroups: [] });
      return;
    }

    try {
      setLoading(true);
      const data = await apiRequest('/cart');
      if (data.success && data.cart) {
        setCart(data.cart);
      }
    } catch (err) {
      console.error('Failed to fetch cart', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  // When live stock updates arrive via Socket.IO, dynamically reflect availableStock and availability in cart
  useEffect(() => {
    if (Object.keys(liveStocks).length === 0 || cart.items.length === 0) return;

    setCart((prev) => {
      let changed = false;
      const updatedItems = prev.items.map((item) => {
        const live = liveStocks[item.productId];
        if (live) {
          changed = true;
          return {
            ...item,
            stock: live.stock,
            availableStock: live.availableStock,
            isAvailable: live.availableStock >= item.quantity
          };
        }
        return item;
      });

      if (!changed) return prev;

      // Update store groups accordingly
      const storeGroupMap: Record<string, StoreGroup> = {};
      for (const group of prev.storeGroups) {
        storeGroupMap[group.storeId] = {
          ...group,
          items: []
        };
      }

      for (const item of updatedItems) {
        if (storeGroupMap[item.storeId]) {
          storeGroupMap[item.storeId].items.push(item);
        }
      }

      return {
        ...prev,
        items: updatedItems,
        storeGroups: Object.values(storeGroupMap)
      };
    });
  }, [liveStocks]);

  const addToCart = async (
    productId: string,
    quantity = 1,
    selectedVariant?: { name: string; price: number },
    selectedAddons?: Array<{ name: string; price: number }>
  ) => {
    await apiRequest('/cart/add', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity, selectedVariant, selectedAddons })
    });
    await fetchCart();
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    await apiRequest('/cart/quantity', {
      method: 'PUT',
      body: JSON.stringify({ productId, quantity })
    });
    await fetchCart();
  };

  const removeFromCart = async (productId: string) => {
    await apiRequest(`/cart/item/${productId}`, {
      method: 'DELETE'
    });
    await fetchCart();
  };

  const clearCart = async () => {
    await apiRequest('/cart/clear', {
      method: 'DELETE'
    });
    await fetchCart();
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart: fetchCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
