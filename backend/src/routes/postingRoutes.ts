import { Router, Response } from 'express';
import { Task, Employee, Brand, EmployeeBrand } from '../models/allModels';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';

const router = Router();

// GET /api/v1/postings/daily
router.get('/daily', authenticateToken, checkPermission('posting.view'), async (req: AuthRequest, res: Response) => {
  const { date, employeeId, brandId, platform, status } = req.query;

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

    return res.status(200).json({
      success: true,
      date: startOfDay.toISOString().split('T')[0],
      metrics,
      data: tasks,
      message: tasks.length === 0 ? 'No records found' : 'Daily postings fetched successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching daily postings', error });
  }
});

// GET /api/v1/postings/calendar
router.get('/calendar', authenticateToken, checkPermission('posting.view'), async (req: AuthRequest, res: Response) => {
  const { start, end, employeeId, brandId, platform, contentType, status } = req.query;

  if (!start || !end) {
    return res.status(400).json({ success: false, message: 'Start and End dates are required' });
  }

  const filter: any = {
    scheduledDate: { $gte: new Date(start as string), $lte: new Date(end as string) }
  };

  if (employeeId) filter.employeeId = employeeId;
  if (brandId) filter.brandId = brandId;
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
      .sort({ scheduledDate: 1, scheduledTime: 1 });

    return res.status(200).json({ 
      success: true, 
      count: tasks.length, 
      data: tasks,
      message: tasks.length === 0 ? 'No records found' : 'Posting calendar data fetched successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching posting calendar data', error });
  }
});

// GET /api/v1/postings/matrix - Spreadsheet style posting matrix per employee & brands
router.get('/matrix', authenticateToken, checkPermission('posting.view'), async (req: AuthRequest, res: Response) => {
  try {
    const { year, month, employeeId } = req.query;
    const now = new Date();
    const targetYear = Number(year) || now.getFullYear();
    const targetMonth = month !== undefined ? Number(month) - 1 : now.getMonth();

    const startOfMonth = new Date(targetYear, targetMonth, 1, 0, 0, 0);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

    // Fetch active employees
    const employees = await Employee.find({ status: 'Active' }).sort({ name: 1 });

    // Determine target employee
    let targetEmployeeId = employeeId as string;
    if (req.user?.role === 'Employee' && !targetEmployeeId) {
      const emp = employees.find(e => e.email === req.user?.email);
      if (emp) targetEmployeeId = (emp._id as any).toString();
    }
    if (!targetEmployeeId && employees.length > 0) {
      targetEmployeeId = (employees[0]._id as any).toString();
    }

    // Fetch brands assigned to target employee (or all brands if no assignments found)
    let assignedBrandIds: any[] = [];
    if (targetEmployeeId) {
      const assignments = await EmployeeBrand.find({ employeeId: targetEmployeeId, status: 'Active' });
      assignedBrandIds = assignments.map(a => a.brandId);
    }

    let brands: any[] = [];
    if (assignedBrandIds.length > 0) {
      brands = await Brand.find({ _id: { $in: assignedBrandIds }, status: 'Active' }).sort({ brandName: 1 });
    } else if (req.user?.role !== 'Employee') {
      brands = await Brand.find({ status: 'Active' }).sort({ brandName: 1 });
    } else {
      brands = [];
    }

    // Query tasks for the month
    const tasksFilter: any = {
      scheduledDate: { $gte: startOfMonth, $lte: endOfMonth }
    };
    if (targetEmployeeId) tasksFilter.employeeId = targetEmployeeId;

    const tasks = await Task.find(tasksFilter);

    // Build matrix lookup map: key = `${brandId}_${YYYY-MM-DD}`
    const matrixMap: Record<string, { isPosted: boolean; taskId?: string; status?: string }> = {};

    const formatLocalDate = (d: Date): string => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dayNum}`;
    };

    tasks.forEach(t => {
      const bId = (t.brandId as any).toString();
      const dStr = formatLocalDate(new Date(t.scheduledDate));
      const key = `${bId}_${dStr}`;
      const isPosted = t.status === 'Verified' || t.status === 'Submitted';
      matrixMap[key] = { isPosted, taskId: (t._id as any).toString(), status: t.status };
    });

    // Build dates array using local timezone date formatting
    const dates = [];
    const todayStr = formatLocalDate(new Date());

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(targetYear, targetMonth, day);
      const dateStr = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const monthDayStr = `${String(targetMonth + 1).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      dates.push({
        dateStr,
        monthDayStr,
        dayNum: day,
        dayName,
        isToday: dateStr === todayStr
      });
    }

    return res.status(200).json({
      success: true,
      year: targetYear,
      month: targetMonth + 1,
      monthName: startOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      selectedEmployeeId: targetEmployeeId,
      employees,
      brands,
      dates,
      matrixMap,
      message: brands.length === 0 ? 'No records found' : 'Posting matrix data fetched successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching posting matrix data', error });
  }
});

// POST /api/v1/postings/matrix/toggle - Toggle posting status for a brand on a specific date
router.post('/matrix/toggle', authenticateToken, checkPermission('posting.update'), async (req: AuthRequest, res: Response) => {
  try {
    const { employeeId, brandId, date, isPosted } = req.body;

    if (!employeeId || !brandId || !date) {
      return res.status(400).json({ success: false, message: 'employeeId, brandId, and date are required' });
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (date > todayStr) {
      return res.status(400).json({ success: false, message: 'Cannot mark postings for future dates' });
    }

    const scheduledDate = new Date(date);
    const startOfDay = new Date(scheduledDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(scheduledDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find existing task for this employee, brand, date
    let task = await Task.findOne({
      employeeId,
      brandId,
      scheduledDate: { $gte: startOfDay, $lte: endOfDay }
    });

    if (isPosted) {
      if (!task) {
        const count = await Task.countDocuments();
        const brand = await Brand.findById(brandId);
        task = await Task.create({
          taskId: `TSK-MTRX-${count + 10001}`,
          employeeId,
          brandId,
          platform: 'Instagram',
          contentType: 'Post',
          title: `Daily Posting - ${brand?.brandName || 'Brand'}`,
          description: 'Marked via Posting Calendar Sheet Matrix',
          scheduledDate: startOfDay,
          scheduledTime: '10:00 AM',
          deadline: endOfDay,
          status: 'Verified',
          verificationStatus: 'Verified',
          publishedDate: new Date(),
          verifiedBy: req.user?._id
        });
      } else {
        task.status = 'Verified';
        task.verificationStatus = 'Verified';
        task.publishedDate = new Date();
        await task.save();
      }
    } else {
      if (task) {
        task.status = 'Pending';
        task.verificationStatus = 'Unsubmitted';
        await task.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: `Posting updated for ${date}`,
      isPosted: !!isPosted,
      date,
      brandId,
      employeeId,
      task
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error toggling posting matrix cell', error });
  }
});

export default router;
