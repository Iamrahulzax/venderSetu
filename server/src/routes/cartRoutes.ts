import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart
} from '../controllers/cartController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getCart);
router.post('/add', addToCart);
router.put('/quantity', updateCartQuantity);
router.delete('/item/:productId', removeFromCart);
router.delete('/clear', clearCart);

export default router;
