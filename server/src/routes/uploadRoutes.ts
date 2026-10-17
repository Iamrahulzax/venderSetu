import { Router } from 'express';
import {
  uploadMiddleware,
  handleSingleUpload,
  handleMultipleUpload
} from '../controllers/uploadController.js';
import { authenticate, requireRoles } from '../middleware/auth.js';

const router = Router();

// Single file upload endpoint (Product photos, store banners, menu PDFs)
router.post(
  '/',
  authenticate,
  requireRoles(['seller', 'admin']),
  uploadMiddleware.single('file'),
  handleSingleUpload
);

// Multiple files upload endpoint
router.post(
  '/multiple',
  authenticate,
  requireRoles(['seller', 'admin']),
  uploadMiddleware.array('files', 10),
  handleMultipleUpload
);

export default router;
