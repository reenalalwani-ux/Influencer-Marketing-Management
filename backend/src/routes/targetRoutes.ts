import { Router, Response } from 'express';
import { Target } from '../models/allModels';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import { logActivity } from '../middleware/auditLog';

const router = Router();

// GET /api/v1/targets - Fetch all targets
router.get('/', authenticateToken, checkPermission('target.view'), async (req: AuthRequest, res: Response) => {
  try {
    const targets = await Target.find().sort({ createdAt: -1 }).populate('createdBy', 'name email role');
    return res.json({ success: true, count: targets.length, data: targets });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching targets', error });
  }
});

// GET /api/v1/targets/active - Fetch current active target for top banner display
router.get('/active', authenticateToken, checkPermission('target.view'), async (req: AuthRequest, res: Response) => {
  try {
    let activeTarget = await Target.findOne({ isActive: true, status: 'Active' }).sort({ updatedAt: -1 }).populate('createdBy', 'name email role');
    
    // Fallback: If no target is explicitly marked isActive, pick the most recent Active target
    if (!activeTarget) {
      activeTarget = await Target.findOne({ status: 'Active' }).sort({ createdAt: -1 }).populate('createdBy', 'name email role');
    }

    return res.json({ success: true, data: activeTarget || null });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching active target', error });
  }
});

// POST /api/v1/targets - Create target (Manager / Admin)
router.post('/', authenticateToken, checkPermission('target.create'), async (req: AuthRequest, res: Response) => {
  try {
    const { title, targetAmount, achievedAmount, currency, period, startDate, endDate, description, isActive } = req.body;

    if (!title || targetAmount === undefined || !period) {
      return res.status(400).json({ success: false, message: 'Title, Target Amount, and Period are required.' });
    }

    // If setting as active, deactivate other targets
    if (isActive !== false) {
      await Target.updateMany({}, { isActive: false });
    }

    const newTarget = await Target.create({
      title,
      targetAmount: Number(targetAmount),
      achievedAmount: Number(achievedAmount || 0),
      currency: currency || '$',
      period,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      description,
      status: 'Active',
      isActive: isActive !== false,
      createdBy: req.user?._id
    });

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'System',
      action: 'CREATE_TARGET',
      module: 'Target Module',
      entity: 'Target',
      entityId: (newTarget._id as any).toString(),
      newValue: newTarget.toObject()
    });

    return res.status(201).json({ success: true, message: 'Target created successfully', data: newTarget });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create target', error });
  }
});

// PUT /api/v1/targets/:id - Update target (Manager / Admin)
router.put('/:id', authenticateToken, checkPermission('target.update'), async (req: AuthRequest, res: Response) => {
  try {
    const target = await Target.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'Target not found' });

    const oldValue = { ...target.toObject() };

    if (req.body.isActive === true) {
      await Target.updateMany({ _id: { $ne: target._id } }, { isActive: false });
    }

    if (req.body.title !== undefined) target.title = req.body.title;
    if (req.body.targetAmount !== undefined) target.targetAmount = Number(req.body.targetAmount);
    if (req.body.achievedAmount !== undefined) target.achievedAmount = Number(req.body.achievedAmount);
    if (req.body.currency !== undefined) target.currency = req.body.currency;
    if (req.body.period !== undefined) target.period = req.body.period;
    if (req.body.startDate !== undefined) target.startDate = req.body.startDate ? new Date(req.body.startDate) : undefined;
    if (req.body.endDate !== undefined) target.endDate = req.body.endDate ? new Date(req.body.endDate) : undefined;
    if (req.body.status !== undefined) target.status = req.body.status;
    if (req.body.isActive !== undefined) target.isActive = req.body.isActive;
    if (req.body.description !== undefined) target.description = req.body.description;

    await target.save();

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'System',
      action: 'UPDATE_TARGET',
      module: 'Target Module',
      entity: 'Target',
      entityId: (target._id as any).toString(),
      oldValue,
      newValue: target.toObject()
    });

    return res.json({ success: true, message: 'Target updated successfully', data: target });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update target', error });
  }
});

// PATCH /api/v1/targets/:id/active - Set target as active system banner target
router.patch('/:id/active', authenticateToken, checkPermission('target.update'), async (req: AuthRequest, res: Response) => {
  try {
    const target = await Target.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'Target not found' });

    // Set all targets to isActive: false, then set this one to true
    await Target.updateMany({}, { isActive: false });
    target.isActive = true;
    await target.save();

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'System',
      action: 'SET_ACTIVE_TARGET',
      module: 'Target Module',
      entity: 'Target',
      entityId: (target._id as any).toString(),
      newValue: { title: target.title, isActive: true }
    });

    return res.json({ success: true, message: 'Set as active system target', data: target });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to set active target', error });
  }
});

// DELETE /api/v1/targets/:id - Delete target
router.delete('/:id', authenticateToken, checkPermission('target.delete'), async (req: AuthRequest, res: Response) => {
  try {
    const target = await Target.findByIdAndDelete(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'Target not found' });

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'System',
      action: 'DELETE_TARGET',
      module: 'Target Module',
      entity: 'Target',
      entityId: req.params.id,
      oldValue: target.toObject()
    });

    return res.json({ success: true, message: 'Target deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete target', error });
  }
});

export default router;
