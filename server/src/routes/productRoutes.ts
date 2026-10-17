import { Router } from 'express';
import {
  getProducts,
  getComparableProducts,
  getProductById,
  createProduct,
  updateProduct,
  toggleAvailability,
  deleteProduct,
  adjustStock
} from '../controllers/productController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const router = Router();

router.get('/', getProducts);
router.get('/compare', getComparableProducts);
router.get('/:id', getProductById);

router.post('/', authenticate, requireRoles(['seller', 'admin']), createProduct);
router.put('/:id', authenticate, requireRoles(['seller', 'admin']), updateProduct);
router.patch('/:id/toggle-availability', authenticate, requireRoles(['seller', 'admin']), toggleAvailability);
router.delete('/:id', authenticate, requireRoles(['seller', 'admin']), deleteProduct);
router.patch('/:id/stock', authenticate, requireRoles(['seller', 'admin']), adjustStock);

export default router;
