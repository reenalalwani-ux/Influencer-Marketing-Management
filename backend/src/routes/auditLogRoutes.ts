import { Router, Response } from 'express';
import { AuditLog } from '../models/allModels';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';

const router = Router();

// GET /api/v1/audit-logs
router.get('/', authenticateToken, checkPermission('audit.view'), async (req: AuthRequest, res: Response) => {
  const { module, action, userName, page, limit } = req.query;
  const filter: any = {};

  if (module) filter.module = module;
  if (action) filter.action = action;
  if (userName) filter.userName = new RegExp(userName as string, 'i');

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || 10);
  const skip = (pageNum - 1) * limitNum;

  try {
    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return res.json({ 
      success: true, 
      count: logs.length, 
      total, 
      page: pageNum, 
      totalPages, 
      limit: limitNum, 
      data: logs 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs', error });
  }
});

export default router;
