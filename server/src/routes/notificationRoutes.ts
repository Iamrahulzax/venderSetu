import { Router, Response } from 'express';
import { Notification } from '../models/Notification.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const storeId = req.user?.assignedStoreId;

    const query: any = {
      $or: [{ userId }]
    };

    if (storeId) {
      query.$or.push({ storeId });
    }

    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(30).lean();
    res.json({ success: true, notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await Notification.findByIdAndUpdate(id, { isRead: true });
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.patch('/mark-all-read', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!._id;
    const storeId = req.user?.assignedStoreId;

    const query: any = {
      $or: [{ userId }]
    };
    if (storeId) {
      query.$or.push({ storeId });
    }

    await Notification.updateMany(query, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
