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
    const totalCount = await EmployeeBrand.countDocuments(filter);
    const pageNum = req.query.page ? Math.max(1, Number(req.query.page)) : undefined;
    const limitNum = req.query.limit ? Math.max(1, Number(req.query.limit)) : 10;

    let query = EmployeeBrand.find(filter)
      .populate('employeeId', 'name employeeId designation department email')
      .populate('brandId', 'brandName brandId logo industry')
      .populate('assignedBy', 'name role')
      .sort({ createdAt: -1 });

    if (pageNum !== undefined) {
      query = query.skip((pageNum - 1) * limitNum).limit(limitNum);
    }

    const assignments = await query;

    return res.status(200).json({ 
      success: true, 
      count: assignments.length, 
      data: assignments,
      pagination: {
        page: pageNum || 1,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.max(1, Math.ceil(totalCount / limitNum))
      },
      message: assignments.length === 0 ? 'No records found' : 'Assignments fetched successfully'
    });
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

    return res.status(200).json({ success: true, message: 'Employee assigned to brand successfully', data: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to assign employee to brand', error });
  }
});

// PATCH /api/v1/employee-brands/:id/unassign
router.patch('/:id/unassign', authenticateToken, checkPermission('brand.assign'), async (req: AuthRequest, res: Response) => {
  try {
    const assignment = await EmployeeBrand.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'No record exists for this assignment' });

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

    return res.status(200).json({ success: true, message: 'Employee removed from brand assignment', data: assignment });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to unassign employee', error });
  }
});

// PUT /api/v1/employee-brands/:id
router.put('/:id', authenticateToken, checkPermission('brand.assign'), async (req: AuthRequest, res: Response) => {
  try {
    const assignment = await EmployeeBrand.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'No record exists for this assignment' });

    const oldValue = { ...assignment.toObject() };
    const { employeeId, brandId, responsibility, priority, status } = req.body;

    if (employeeId) assignment.employeeId = employeeId;
    if (brandId) assignment.brandId = brandId;
    if (responsibility) assignment.responsibility = responsibility;
    if (priority) assignment.priority = priority;
    if (status) assignment.status = status;

    await assignment.save();

    const populated = await EmployeeBrand.findById(assignment._id)
      .populate('employeeId', 'name employeeId designation department email')
      .populate('brandId', 'brandName brandId logo industry');

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'System',
      action: 'UPDATE_EMPLOYEE_BRAND',
      module: 'Employee-Brand Assignment',
      entity: 'EmployeeBrand',
      entityId: req.params.id,
      oldValue,
      newValue: assignment.toObject()
    });

    return res.status(200).json({ success: true, message: 'Assignment updated successfully', data: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update assignment', error });
  }
});

// POST /api/v1/employee-brands/sync-employee
router.post('/sync-employee', authenticateToken, checkPermission('brand.assign'), async (req: AuthRequest, res: Response) => {
  const { employeeId, brandIds, responsibility, priority } = req.body;

  if (!employeeId || !Array.isArray(brandIds)) {
    return res.status(400).json({ success: false, message: 'Employee ID and array of Brand IDs are required' });
  }

  try {
    // Enforce 1 brand = 1 person: Delete active assignments of these brandIds from ANY other employees
    if (brandIds.length > 0) {
      await EmployeeBrand.deleteMany({
        employeeId: { $ne: employeeId },
        brandId: { $in: brandIds }
      });
    }

    // Delete active assignments for brands not in brandIds for this employee
    await EmployeeBrand.deleteMany({
      employeeId,
      brandId: { $nin: brandIds }
    });

    // Create or update assignments for selected brandIds
    for (const bId of brandIds) {
      const existing = await EmployeeBrand.findOne({ employeeId, brandId: bId });
      if (existing) {
        existing.status = 'Active';
        if (responsibility) existing.responsibility = responsibility;
        if (priority) existing.priority = priority;
        await existing.save();
      } else {
        await EmployeeBrand.create({
          employeeId,
          brandId: bId,
          assignedBy: req.user?._id,
          responsibility: responsibility || 'Brand Operations & Content Posting',
          priority: priority || 'High',
          startDate: new Date(),
          status: 'Active'
        });
      }
    }

    const updatedAssignments = await EmployeeBrand.find({ employeeId, status: 'Active' })
      .populate('employeeId', 'name employeeId designation department email')
      .populate('brandId', 'brandName brandId logo industry');

    return res.status(200).json({ success: true, message: 'Employee brand assignments updated successfully', data: updatedAssignments });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to sync employee brand assignments', error });
  }
});

// POST /api/v1/employee-brands/transfer
router.post('/transfer', authenticateToken, checkPermission('brand.assign'), async (req: AuthRequest, res: Response) => {
  const { brandId, fromEmployeeId, toEmployeeId, responsibility, priority } = req.body;

  if (!brandId || !toEmployeeId) {
    return res.status(400).json({ success: false, message: 'Brand ID and destination Employee ID are required' });
  }

  if (fromEmployeeId && fromEmployeeId === toEmployeeId) {
    return res.status(400).json({ success: false, message: 'Source and destination employees must be different' });
  }

  try {
    // 1. Remove existing active assignments for this brand across the system
    await EmployeeBrand.deleteMany({
      brandId
    });

    // 2. Create new active assignment for destination employee
    const newAssignment = await EmployeeBrand.create({
      employeeId: toEmployeeId,
      brandId,
      assignedBy: req.user?._id,
      responsibility: responsibility || 'Brand Operations & Content Posting',
      priority: priority || 'High',
      startDate: new Date(),
      status: 'Active'
    });

    const populated = await EmployeeBrand.findById(newAssignment._id)
      .populate('employeeId', 'name employeeId designation department email userId')
      .populate('brandId', 'brandName brandId logo industry');

    const empDoc = populated?.employeeId as any;
    const brandDoc = populated?.brandId as any;

    if (empDoc && empDoc.userId) {
      await Notification.create({
        userId: empDoc.userId,
        title: 'Brand Transferred to You',
        message: `Brand "${brandDoc?.brandName || 'Brand'}" has been transferred and assigned to you.`,
        type: 'Assignment',
        relatedId: (brandId as string)
      });
    }

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'System',
      action: 'TRANSFER_EMPLOYEE_BRAND',
      module: 'Employee-Brand Assignment',
      entity: 'EmployeeBrand',
      entityId: (newAssignment._id as any).toString(),
      newValue: { brandId, fromEmployeeId, toEmployeeId }
    });

    return res.status(200).json({
      success: true,
      message: `Brand "${brandDoc?.brandName || 'Brand'}" successfully transferred to ${empDoc?.name || 'new employee'}`,
      data: populated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to transfer brand assignment', error });
  }
});

// DELETE /api/v1/employee-brands/employee/:employeeId
router.delete('/employee/:employeeId', authenticateToken, checkPermission('brand.assign'), async (req: AuthRequest, res: Response) => {
  try {
    await EmployeeBrand.deleteMany({ employeeId: req.params.employeeId });
    return res.status(200).json({ success: true, message: 'All brand assignments removed for employee' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete assignments', error });
  }
});

export default router;
