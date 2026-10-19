import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

let io: Server | null = null;

interface SocketUserPayload {
  id: string;
  role: string;
  assignedStoreId?: string | null;
}

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: '*', // Allows local dev with vite
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    }
  });

  // Authentication middleware for Socket.IO
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers?.authorization && socket.handshake.headers.authorization.split(' ')[1]) ||
      socket.handshake.query?.token;

    if (token && typeof token === 'string') {
      try {
        const decoded = jwt.verify(token, ENV.JWT_SECRET) as SocketUserPayload;
        socket.data.user = decoded;
      } catch (err) {
        // Token invalid - socket will remain as unauthenticated guest
      }
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    // Marketplace room is public for stock updates
    socket.join('marketplace');

    // Secure store room: only allowed if user is Admin or assigned Seller of that store
    socket.on('join:store', (storeId: string) => {
      if (!storeId) return;
      const user = socket.data.user as SocketUserPayload | undefined;
      if (!user) return; // Prevent anonymous eavesdropping on store orders

      const isAdmin = user.role === 'admin';
      const isStoreSeller =
        user.role === 'seller' &&
        user.assignedStoreId &&
        user.assignedStoreId.toString() === storeId.toString();

      if (isAdmin || isStoreSeller) {
        socket.join(`store:${storeId}`);
      }
    });

    socket.on('leave:store', (storeId: string) => {
      if (storeId) {
        socket.leave(`store:${storeId}`);
      }
    });

    // Secure user room: only allowed if user is joining their own room or is Admin
    socket.on('join:user', (userId: string) => {
      if (!userId) return;
      const user = socket.data.user as SocketUserPayload | undefined;
      if (!user) return; // Prevent anonymous eavesdropping on user notifications

      if (user.id.toString() === userId.toString() || user.role === 'admin') {
        socket.join(`user:${userId}`);
      }
    });

    socket.on('disconnect', () => {
      // client disconnected
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet!');
  }
  return io;
};

// Real-time Stock Notification Broadcast
export const broadcastStockUpdate = (payload: {
  productId: string;
  storeId: string;
  stock: number;
  reservedStock: number;
  availableStock: number;
  sellingPrice: number;
  name: string;
  lowStock: boolean;
  outOfStock: boolean;
}) => {
  if (io) {
    io.to('marketplace').emit('stock:updated', payload);
    io.to(`store:${payload.storeId}`).emit('stock:updated', payload);
  }
};

// Real-time Order Notification for Seller
export const emitNewSubOrder = (storeId: string, subOrder: any) => {
  if (io) {
    io.to(`store:${storeId}`).emit('order:new', subOrder);
  }
};

// Real-time Order Status Update for Student
export const emitOrderStatusUpdate = (studentId: string, subOrder: any) => {
  if (io) {
    io.to(`user:${studentId}`).emit('order:status_update', subOrder);
    io.to(`store:${subOrder.storeId}`).emit('order:status_update', subOrder);
  }
};
