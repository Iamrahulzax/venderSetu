import { Router } from 'express';
import {
  getAdminOverview,
  getAllSellers,
  updateSellerStatus,
  getAllPlatformOrders,
  getPlatformStockAlerts,
  getComplaints,
  createComplaint,
  updateComplaintStatus,
  getAuditLogs,
  exportPlatformReportCSV
} from '../controllers/adminController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// Student complaint filing is accessible to authenticated students
router.post('/complaints', createComplaint);

// All subsequent routes require Admin role
router.use(requireRoles(['admin']));

router.get('/overview', getAdminOverview);
router.get('/sellers', getAllSellers);
router.patch('/sellers/:sellerId', updateSellerStatus);
router.get('/orders', getAllPlatformOrders);
router.get('/stock-alerts', getPlatformStockAlerts);
router.get('/complaints', getComplaints);
router.patch('/complaints/:complaintId', updateComplaintStatus);
router.get('/audit-logs', getAuditLogs);
router.get('/export-report', exportPlatformReportCSV);

export default router;
