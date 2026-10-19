import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getAuthToken } from '../services/api';

export interface LiveStockPayload {
  productId: string;
  storeId: string;
  stock: number;
  reservedStock: number;
  availableStock: number;
  sellingPrice: number;
  name: string;
  lowStock: boolean;
  outOfStock: boolean;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  liveStocks: Record<string, LiveStockPayload>;
  lastStockEvent: LiveStockPayload | null;
  joinStoreRoom: (storeId: string) => void;
  leaveStoreRoom: (storeId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [liveStocks, setLiveStocks] = useState<Record<string, LiveStockPayload>>({});
  const [lastStockEvent, setLastStockEvent] = useState<LiveStockPayload | null>(null);

  useEffect(() => {
    // Connect to server with authentication token
    const token = getAuthToken();
    const socketInstance = io('/', {
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socketInstance.on('connect', () => {
      // console.log('[Socket.IO Connected]', socketInstance.id);
      setIsConnected(true);

      if (user?.id) {
        socketInstance.emit('join:user', user.id);
      }

      if (user?.role === 'seller' && user?.assignedStoreId) {
        const storeId = user.assignedStoreId._id || user.assignedStoreId;
        socketInstance.emit('join:store', storeId);
      }
    });

    socketInstance.on('disconnect', () => {
      // console.log('[Socket.IO Disconnected]');
      setIsConnected(false);
    });

    // Real-Time Stock Updates Handler
    socketInstance.on('stock:updated', (payload: LiveStockPayload) => {
      // console.log('[Realtime Stock Update Received]', payload);
      setLastStockEvent(payload);
      setLiveStocks((prev) => ({
        ...prev,
        [payload.productId]: payload
      }));
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user?.id, user?.assignedStoreId]);

  const joinStoreRoom = (storeId: string) => {
    if (socket && isConnected) {
      socket.emit('join:store', storeId);
    }
  };

  const leaveStoreRoom = (storeId: string) => {
    if (socket && isConnected) {
      socket.emit('leave:store', storeId);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        liveStocks,
        lastStockEvent,
        joinStoreRoom,
        leaveStoreRoom
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
