import { Router } from 'express';
import {
  getSellerDashboardStats,
  getSellerOrders,
  updateSubOrderStatus,
  getInventoryMovements,
  exportInventoryCSV
} from '../controllers/sellerController.js';
import { authenticate, requireRoles, requireStoreOwnerOrAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(requireRoles(['seller', 'admin']));

router.get('/dashboard', getSellerDashboardStats);
router.get('/orders', getSellerOrders);
router.patch('/suborder/:subOrderId/status', updateSubOrderStatus);
router.get('/inventory-movements', getInventoryMovements);
router.get('/inventory-export', exportInventoryCSV);

// Parameterized routes for admin inspection of specific stores
router.get('/store/:storeId/dashboard', requireStoreOwnerOrAdmin, getSellerDashboardStats);
router.get('/store/:storeId/orders', requireStoreOwnerOrAdmin, getSellerOrders);
router.get('/store/:storeId/movements', requireStoreOwnerOrAdmin, getInventoryMovements);
router.get('/store/:storeId/export', requireStoreOwnerOrAdmin, exportInventoryCSV);

export default router;
