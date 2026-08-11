import { Router, Response } from 'express';
import { Task, Employee } from '../models/allModels';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';

const router = Router();

// GET /api/v1/postings/daily
router.get('/daily', authenticateToken, checkPermission('posting.view'), async (req: AuthRequest, res: Response) => {
  const { date, employeeId, brandId, campaignId, platform, status } = req.query;

  // Default date = today
  const targetDate = date ? new Date(date as string) : new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const filter: any = {
    scheduledDate: { $gte: startOfDay, $lte: endOfDay }
  };

  if (employeeId) filter.employeeId = employeeId;
  if (brandId) filter.brandId = brandId;
  if (campaignId) filter.campaignId = campaignId;
  if (platform) filter.platform = platform;
  if (status) filter.status = status;

  // Employee role scoping
  if (req.user?.role === 'Employee' && !employeeId) {
    const emp = await Employee.findOne({ email: req.user.email });
    if (emp) filter.employeeId = emp._id;
  }

  try {
    const tasks = await Task.find(filter)
      .populate('employeeId', 'name employeeId designation department')
      .populate('brandId', 'brandName brandId logo industry')
      .populate('campaignId', 'title status')
      .sort({ scheduledTime: 1 });

    // Calculate metrics for the selected day
    const metrics = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'Verified' || t.status === 'Submitted').length,
      pending: tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length,
      delayed: tasks.filter(t => t.status === 'Delayed').length,
      rejected: tasks.filter(t => t.status === 'Rejected').length,
      missed: tasks.filter(t => t.status === 'Missed').length,
    };

    return res.json({
      success: true,
      date: startOfDay.toISOString().split('T')[0],
      metrics,
      data: tasks
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching daily postings', error });
  }
});

// GET /api/v1/postings/calendar
router.get('/calendar', authenticateToken, checkPermission('posting.view'), async (req: AuthRequest, res: Response) => {
  const { start, end, employeeId, brandId, campaignId, platform, contentType, status } = req.query;

  if (!start || !end) {
    return res.status(400).json({ success: false, message: 'Start and End dates are required' });
  }

  const filter: any = {
    scheduledDate: { $gte: new Date(start as string), $lte: new Date(end as string) }
  };

  if (employeeId) filter.employeeId = employeeId;
  if (brandId) filter.brandId = brandId;
  if (campaignId) filter.campaignId = campaignId;
  if (platform) filter.platform = platform;
  if (contentType) filter.contentType = contentType;
  if (status) filter.status = status;

  if (req.user?.role === 'Employee' && !employeeId) {
    const emp = await Employee.findOne({ email: req.user.email });
    if (emp) filter.employeeId = emp._id;
  }

  try {
    const tasks = await Task.find(filter)
      .populate('employeeId', 'name employeeId designation')
      .populate('brandId', 'brandName brandId logo')
      .populate('campaignId', 'title')
      .sort({ scheduledDate: 1, scheduledTime: 1 });

    return res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching posting calendar data', error });
  }
});

export default router;
