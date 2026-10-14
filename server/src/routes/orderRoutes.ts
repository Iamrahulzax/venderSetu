import { Router } from 'express';
import {
  createCheckoutOrder,
  verifyPayment,
  getStudentOrders,
  getOrderById,
  cancelSubOrder
} from '../controllers/orderController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/checkout', createCheckoutOrder);
router.post('/:orderId/verify-payment', verifyPayment);
router.get('/my-orders', getStudentOrders);
router.get('/:orderId', getOrderById);
router.post('/suborder/:subOrderId/cancel', cancelSubOrder);

export default router;
