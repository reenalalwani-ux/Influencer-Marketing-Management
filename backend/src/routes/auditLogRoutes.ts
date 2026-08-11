import { Router, Response } from 'express';
import { AuditLog } from '../models/allModels';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';

const router = Router();

// GET /api/v1/audit-logs
router.get('/', authenticateToken, checkPermission('audit.view'), async (req: AuthRequest, res: Response) => {
  const { module, action, userName, limit } = req.query;
  const filter: any = {};

  if (module) filter.module = module;
  if (action) filter.action = action;
  if (userName) filter.userName = new RegExp(userName as string, 'i');

  try {
    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(Number(limit) || 100);

    return res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs', error });
  }
});

export default router;
