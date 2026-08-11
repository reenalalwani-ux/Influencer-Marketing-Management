import { Router, Response } from 'express';
import { Notification } from '../models/allModels';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/v1/notifications
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });

    return res.json({ success: true, unreadCount, data: notifications });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch notifications', error });
  }
});

// PATCH /api/v1/notifications/:id/read
router.patch('/:id/read', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    return res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update notification', error });
  }
});

// PATCH /api/v1/notifications/read-all
router.patch('/read-all', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    return res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to mark all as read', error });
  }
});

export default router;
