import { Router, Response } from 'express';
import { Task, Notification, Employee } from '../models/allModels';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import { logActivity } from '../middleware/auditLog';

const router = Router();

// Helper to auto-detect platform from published URL
export const detectPlatform = (url: string): string => {
  const lower = url.toLowerCase();
  if (lower.includes('instagram.com')) return 'Instagram';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'YouTube';
  if (lower.includes('tiktok.com')) return 'TikTok';
  if (lower.includes('twitter.com') || lower.includes('x.com')) return 'X (Twitter)';
  if (lower.includes('linkedin.com')) return 'LinkedIn';
  if (lower.includes('facebook.com') || lower.includes('fb.watch')) return 'Facebook';
  return 'Social Media';
};

// GET /api/v1/tasks
router.get('/', authenticateToken, checkPermission('task.view'), async (req: AuthRequest, res: Response) => {
  const { employeeId, brandId, status, platform, date, verificationStatus } = req.query;
  const filter: any = {};

  if (employeeId) filter.employeeId = employeeId;
  if (brandId) filter.brandId = brandId;
  if (status) filter.status = status;
  if (platform) filter.platform = platform;
  if (verificationStatus) filter.verificationStatus = verificationStatus;

  if (date) {
    const targetDate = new Date(date as string);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
    filter.scheduledDate = { $gte: startOfDay, $lte: endOfDay };
  }

  // If user is a regular Employee, default filter to their own tasks unless explicit employeeId provided
  if (req.user?.role === 'Employee' && !employeeId) {
    const empDoc = await Employee.findOne({ email: req.user.email });
    if (empDoc) {
      filter.employeeId = empDoc._id;
    }
  }

  try {
    const tasks = await Task.find(filter)
      .populate('employeeId', 'name employeeId designation department')
      .populate('brandId', 'brandName brandId logo industry')
      .populate('verifiedBy', 'name role')
      .populate('parentTaskId', 'taskId title brandId platform contentType')
      .sort({ scheduledDate: 1, scheduledTime: 1 });

    return res.status(200).json({ 
      success: true, 
      count: tasks.length, 
      data: tasks,
      message: tasks.length === 0 ? 'No records found' : 'Tasks fetched successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch tasks', error });
  }
});

// GET /api/v1/tasks/:id
router.get('/:id', authenticateToken, checkPermission('task.view'), async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('employeeId', 'name employeeId email designation department')
      .populate('brandId', 'brandName brandId logo industry')
      .populate('verifiedBy', 'name email role')
      .populate('parentTaskId', 'taskId title brandId platform contentType');

    if (!task) return res.status(404).json({ success: false, message: 'No record exists for this task' });
    return res.status(200).json({ success: true, data: task, message: 'Task fetched successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch task', error });
  }
});

// POST /api/v1/tasks
router.post('/', authenticateToken, checkPermission('task.create'), async (req: AuthRequest, res: Response) => {
  let { employeeId, brandId, platform, contentType, title, description, priority, scheduledDate, scheduledTime, deadline, isMainTask, parentTaskId } = req.body;

  // Force employeeId to self if user has Employee role and not a main task
  if (!isMainTask && req.user?.role?.toLowerCase() === 'employee') {
    const empDoc = await Employee.findOne({
      $or: [{ email: req.user?.email }, { name: req.user?.name }]
    });
    if (empDoc) {
      employeeId = empDoc._id.toString();
    }
  }

  if (isMainTask) {
    if (!platform) platform = 'All Platforms';
    if (!contentType) contentType = 'Master Campaign';
    if (!scheduledTime) scheduledTime = '09:00 AM';
    if (!deadline) deadline = scheduledDate || new Date().toISOString();
  }

  if (!brandId || !title || !scheduledDate) {
    return res.status(400).json({ success: false, message: 'Required task fields missing (brandId, title, scheduledDate)' });
  }

  try {
    const count = await Task.countDocuments();
    const taskId = isMainTask ? `MAIN-${10000 + count + 1}` : `TSK-${10000 + count + 1}`;

    const task = await Task.create({
      taskId,
      employeeId: employeeId || undefined,
      brandId,
      platform: platform || 'Instagram',
      contentType: contentType || 'Reel',
      title,
      description,
      priority: priority || 'Medium',
      scheduledDate: new Date(scheduledDate),
      scheduledTime: scheduledTime || '10:00 AM',
      deadline: deadline ? new Date(deadline) : new Date(scheduledDate),
      status: 'Pending',
      verificationStatus: 'Unsubmitted',
      isMainTask: !!isMainTask,
      parentTaskId: parentTaskId || undefined
    });

    // Send notification to employee
    const emp = await Employee.findById(employeeId);
    if (emp && emp.userId) {
      await Notification.create({
        userId: emp.userId,
        title: 'New Task Assigned',
        message: `Task "${title}" scheduled for ${scheduledDate} at ${scheduledTime}.`,
        type: 'Assignment',
        relatedId: (task._id as any).toString()
      });
    }

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'System',
      action: 'CREATE_TASK',
      module: 'Task Management',
      entity: 'Task',
      entityId: (task._id as any).toString(),
      newValue: { taskId, title, employeeId, brandId, scheduledDate }
    });

    return res.status(200).json({ success: true, message: 'Task created successfully', data: task });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create task', error });
  }
});

// PUT /api/v1/tasks/:id
router.put('/:id', authenticateToken, checkPermission('task.update'), async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'No record exists for this task' });

    const oldValue = { ...task.toObject() };
    Object.assign(task, req.body);
    await task.save();

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'System',
      action: 'UPDATE_TASK',
      module: 'Task Management',
      entity: 'Task',
      entityId: (task._id as any).toString(),
      oldValue,
      newValue: task.toObject()
    });

    return res.status(200).json({ success: true, message: 'Task updated successfully', data: task });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update task', error });
  }
});

// POST /api/v1/tasks/:id/submit-url (Published URL Submission)
router.post('/:id/submit-url', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { publishedUrl } = req.body;
  if (!publishedUrl) {
    return res.status(400).json({ success: false, message: 'Published URL is required' });
  }

  // Basic URL regex validation
  try {
    new URL(publishedUrl);
  } catch (_) {
    return res.status(400).json({ success: false, message: 'Invalid URL format' });
  }

  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'No record exists for this task' });

    // Check duplicate URL check across completed/submitted tasks
    const duplicate = await Task.findOne({ publishedUrl, _id: { $ne: task._id } });
    if (duplicate) {
      return res.status(400).json({ 
        success: false, 
        message: `This URL has already been submitted for task #${duplicate.taskId}` 
      });
    }

    const detected = detectPlatform(publishedUrl);

    task.publishedUrl = publishedUrl;
    task.publishedDate = new Date();
    task.status = 'Submitted';
    task.verificationStatus = 'Pending Verification';
    await task.save();

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'System',
      action: 'SUBMIT_PUBLISHED_URL',
      module: 'Published URL Management',
      entity: 'Task',
      entityId: (task._id as any).toString(),
      newValue: { publishedUrl, detectedPlatform: detected }
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Published URL submitted successfully and sent for verification', 
      detectedPlatform: detected,
      data: task 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to submit published URL', error });
  }
});

// DELETE /api/v1/tasks/:id
router.delete('/:id', authenticateToken, checkPermission('task.delete'), async (req: AuthRequest, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'No record exists for this task' });

    // Delete sub-tasks if main task
    if (task.isMainTask) {
      await Task.deleteMany({ parentTaskId: task._id });
    }

    await Task.findByIdAndDelete(req.params.id);

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'System',
      action: 'DELETE_TASK',
      module: 'Task Management',
      entity: 'Task',
      entityId: req.params.id,
      oldValue: task.toObject()
    });

    return res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete task', error });
  }
});

export default router;
