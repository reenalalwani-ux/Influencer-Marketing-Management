import { Router, Response } from 'express';
import { Task, Notification, Employee } from '../models/allModels';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import { logActivity } from '../middleware/auditLog';

const router = Router();

// GET /api/v1/verification/pending
router.get('/pending', authenticateToken, checkPermission('task.verify'), async (req: AuthRequest, res: Response) => {
  try {
    const pendingTasks = await Task.find({ verificationStatus: 'Pending Verification' })
      .populate('employeeId', 'name employeeId email designation department')
      .populate('brandId', 'brandName brandId logo industry')
      .sort({ publishedDate: -1 });

    return res.status(200).json({ 
      success: true, 
      count: pendingTasks.length, 
      data: pendingTasks,
      message: pendingTasks.length === 0 ? 'No records found' : 'Pending verification tasks fetched successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch pending verifications', error });
  }
});

// POST /api/v1/verification/:taskId/verify
router.post('/:taskId/verify', authenticateToken, checkPermission('task.verify'), async (req: AuthRequest, res: Response) => {
  const { decision, rejectionReason, comments } = req.body;

  if (!decision || !['Verified', 'Rejected'].includes(decision)) {
    return res.status(400).json({ success: false, message: 'Valid decision ("Verified" or "Rejected") is required' });
  }

  if (decision === 'Rejected' && !rejectionReason) {
    return res.status(400).json({ success: false, message: 'Rejection reason is required when rejecting a task' });
  }

  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, message: 'No record exists for this task' });

    task.verifiedBy = req.user?._id as any;
    task.verifiedAt = new Date();
    task.comments = comments || undefined;

    if (decision === 'Verified') {
      task.verificationStatus = 'Verified';
      task.status = 'Verified';
      task.rejectionReason = undefined;
    } else {
      task.verificationStatus = 'Rejected';
      task.status = 'Rejected';
      task.rejectionReason = rejectionReason;
    }

    await task.save();

    // Notify employee of verification result
    const emp = await Employee.findById(task.employeeId);
    if (emp && emp.userId) {
      await Notification.create({
        userId: emp.userId,
        title: `Task ${decision}`,
        message: decision === 'Verified' 
          ? `Your URL for task "${task.title}" has been verified successfully.`
          : `Your URL submission for "${task.title}" was rejected. Reason: ${rejectionReason}`,
        type: 'Verification',
        relatedId: (task._id as any).toString()
      });
    }

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'Manager',
      action: `VERIFY_TASK_${decision.toUpperCase()}`,
      module: 'Task Verification',
      entity: 'Task',
      entityId: (task._id as any).toString(),
      newValue: { decision, rejectionReason, verifiedBy: req.user?.name }
    });

    return res.status(200).json({ 
      success: true, 
      message: `Task verification completed: ${decision}`, 
      data: task 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to verify task', error });
  }
});

export default router;
