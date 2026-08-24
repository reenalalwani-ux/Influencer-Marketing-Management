import { Router, Response } from 'express';
import { AuditLog } from '../models/allModels';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';

const router = Router();

// GET /api/v1/audit-logs
router.get('/', authenticateToken, checkPermission('audit.view'), async (req: AuthRequest, res: Response) => {
  const { module, action, userName, userRole, search, page, limit } = req.query;
  const filter: any = {};

  if (module && module !== 'All') filter.module = module;
  if (action && action !== 'All') filter.action = action;
  if (userRole && userRole !== 'All') filter.userRole = userRole;

  if (userName && userName !== 'All') {
    filter.userName = new RegExp(userName as string, 'i');
  }

  if (search) {
    const searchRegex = new RegExp(search as string, 'i');
    filter.$or = [
      { userName: searchRegex },
      { userEmail: searchRegex },
      { details: searchRegex },
      { action: searchRegex },
      { module: searchRegex }
    ];
  }

  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(500, Math.max(1, Number(limit) || 100));
  const skip = (pageNum - 1) * limitNum;

  try {
    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limitNum);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return res.status(200).json({ 
      success: true, 
      count: logs.length, 
      total, 
      page: pageNum, 
      totalPages, 
      limit: limitNum, 
      data: logs,
      message: logs.length === 0 ? 'No activity logs found' : 'Audit logs fetched successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs', error });
  }
});

export default router;
