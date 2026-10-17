import { Router } from 'express';
import {
  getAllStores,
  getStoreBySlugOrId,
  updateStoreSettings,
  addMenuDocument,
  removeMenuDocument
} from '../controllers/storeController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', getAllStores);
router.get('/:identifier', getStoreBySlugOrId);
router.patch('/:storeId/settings', authenticate, updateStoreSettings);
router.post('/:storeId/menu-documents', authenticate, addMenuDocument);
router.delete('/:storeId/menu-documents/:docId', authenticate, removeMenuDocument);

export default router;
