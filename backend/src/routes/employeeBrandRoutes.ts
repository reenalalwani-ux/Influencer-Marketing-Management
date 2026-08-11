import { Router, Response } from 'express';
import { EmployeeBrand, Notification } from '../models/allModels';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import { logActivity } from '../middleware/auditLog';

const router = Router();

// GET /api/v1/employee-brands
router.get('/', authenticateToken, checkPermission('brand.view'), async (req: AuthRequest, res: Response) => {
  const { employeeId, brandId, status } = req.query;
  const filter: any = {};
  if (employeeId) filter.employeeId = employeeId;
  if (brandId) filter.brandId = brandId;
  if (status) filter.status = status;

  try {
    const assignments = await EmployeeBrand.find(filter)
      .populate('employeeId', 'name employeeId designation department email')
      .populate('brandId', 'brandName brandId logo industry')
      .populate('assignedBy', 'name role')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: assignments.length, data: assignments });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch assignments', error });
  }
});

// POST /api/v1/employee-brands/assign
router.post('/assign', authenticateToken, checkPermission('brand.assign'), async (req: AuthRequest, res: Response) => {
  const { employeeId, brandId, responsibility, priority, startDate, endDate } = req.body;

  if (!employeeId || !brandId) {
    return res.status(400).json({ success: false, message: 'Employee and Brand IDs are required' });
  }

  try {
    // Check if active assignment exists
    const existing = await EmployeeBrand.findOne({ employeeId, brandId, status: 'Active' });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Employee is already assigned to this brand' });
    }

    const assignment = await EmployeeBrand.create({
      employeeId,
      brandId,
      assignedBy: req.user?._id,
      responsibility: responsibility || 'Brand Marketing Operations',
      priority: priority || 'Medium',
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : undefined,
      status: 'Active'
    });

    const populated = await EmployeeBrand.findById(assignment._id)
      .populate('employeeId', 'name email userId')
      .populate('brandId', 'brandName');

    // Notify employee if user account exists
    const empDoc = populated?.employeeId as any;
    const brandDoc = populated?.brandId as any;
    if (empDoc && empDoc.userId) {
      await Notification.create({
        userId: empDoc.userId,
        title: 'New Brand Assigned',
        message: `You have been assigned to manage ${brandDoc?.brandName || 'a brand'}.`,
        type: 'Assignment',
        relatedId: (brandId as string)
      });
    }

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'System',
      action: 'ASSIGN_EMPLOYEE_BRAND',
      module: 'Employee-Brand Assignment',
      entity: 'EmployeeBrand',
      entityId: (assignment._id as any).toString(),
      newValue: { employeeId, brandId, responsibility }
    });

    return res.status(201).json({ success: true, message: 'Employee assigned to brand successfully', data: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to assign employee to brand', error });
  }
});

// PATCH /api/v1/employee-brands/:id/unassign
router.patch('/:id/unassign', authenticateToken, checkPermission('brand.assign'), async (req: AuthRequest, res: Response) => {
  try {
    const assignment = await EmployeeBrand.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

    assignment.status = 'Removed';
    assignment.endDate = new Date();
    await assignment.save();

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'System',
      action: 'UNASSIGN_EMPLOYEE_BRAND',
      module: 'Employee-Brand Assignment',
      entity: 'EmployeeBrand',
      entityId: req.params.id
    });

    return res.json({ success: true, message: 'Employee removed from brand assignment', data: assignment });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to unassign employee', error });
  }
});

export default router;
