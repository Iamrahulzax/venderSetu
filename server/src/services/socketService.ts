import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { ENV } from '../config/env.js';

let io: Server | null = null;

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: '*', // Allows local dev with vite
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    }
  });

  io.on('connection', (socket: Socket) => {
    // console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Join marketplace room for general catalog and stock broadcasts
    socket.join('marketplace');

    // Allow joining store-specific room (e.g. for store sellers or customers viewing a store)
    socket.on('join:store', (storeId: string) => {
      if (storeId) {
        socket.join(`store:${storeId}`);
      }
    });

    socket.on('leave:store', (storeId: string) => {
      if (storeId) {
        socket.leave(`store:${storeId}`);
      }
    });

    // Allow joining user-specific room (for order tracking notifications)
    socket.on('join:user', (userId: string) => {
      if (userId) {
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
