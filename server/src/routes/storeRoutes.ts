import { Router } from 'express';
import { getAllStores, getStoreBySlugOrId, updateStoreSettings } from '../controllers/storeController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', getAllStores);
router.get('/:identifier', getStoreBySlugOrId);
router.patch('/:storeId/settings', authenticate, updateStoreSettings);

export default router;
