import { Router, Response } from 'express';
import { Employee, Brand, Task, EmployeeBrand, Campaign } from '../models/allModels';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';

const router = Router();

// GET /api/v1/reports/employee-summary
router.get('/employee-summary', authenticateToken, checkPermission('report.view'), async (req: AuthRequest, res: Response) => {
  try {
    const employees = await Employee.find().sort({ name: 1 });

    const report = await Promise.all(
      employees.map(async (emp) => {
        const assignedBrands = await EmployeeBrand.countDocuments({ employeeId: emp._id, status: 'Active' });
        const tasks = await Task.find({ employeeId: emp._id });

        const totalTasks = tasks.length;
        const completed = tasks.filter(t => t.status === 'Verified' || t.status === 'Submitted').length;
        const pending = tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;
        const delayed = tasks.filter(t => t.status === 'Delayed').length;
        const completionRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

        return {
          employeeId: emp.employeeId,
          name: emp.name,
          department: emp.department,
          designation: emp.designation,
          assignedBrands,
          totalTasks,
          completed,
          pending,
          delayed,
          completionRate: `${completionRate}%`
        };
      })
    );

    return res.json({ success: true, data: report });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to generate employee report', error });
  }
});

// GET /api/v1/reports/brand-summary
router.get('/brand-summary', authenticateToken, checkPermission('report.view'), async (req: AuthRequest, res: Response) => {
  try {
    const brands = await Brand.find().sort({ brandName: 1 });

    const report = await Promise.all(
      brands.map(async (b) => {
        const assignedEmployees = await EmployeeBrand.countDocuments({ brandId: b._id, status: 'Active' });
        const totalCampaigns = await Campaign.countDocuments({ brandId: b._id });
        const tasks = await Task.find({ brandId: b._id });

        const totalTasks = tasks.length;
        const completed = tasks.filter(t => t.status === 'Verified' || t.status === 'Submitted').length;
        const pending = tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;
        const delayed = tasks.filter(t => t.status === 'Delayed').length;

        return {
          brandId: b.brandId,
          brandName: b.brandName,
          industry: b.industry,
          assignedEmployees,
          totalCampaigns,
          totalTasks,
          completed,
          pending,
          delayed
        };
      })
    );

    return res.json({ success: true, data: report });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to generate brand report', error });
  }
});

// GET /api/v1/reports/daily-posting
router.get('/daily-posting', authenticateToken, checkPermission('report.view'), async (req: AuthRequest, res: Response) => {
  const { date } = req.query;
  const targetDate = date ? new Date(date as string) : new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const tasks = await Task.find({ scheduledDate: { $gte: startOfDay, $lte: endOfDay } })
      .populate('employeeId', 'name employeeId')
      .populate('brandId', 'brandName')
      .populate('campaignId', 'title')
      .sort({ scheduledTime: 1 });

    const report = tasks.map(t => {
      const emp = t.employeeId as any;
      const brand = t.brandId as any;
      const campaign = t.campaignId as any;
      return {
        taskId: t.taskId,
        scheduledDate: t.scheduledDate.toISOString().split('T')[0],
        scheduledTime: t.scheduledTime,
        employee: emp ? emp.name : 'Unassigned',
        brand: brand ? brand.brandName : 'N/A',
        campaign: campaign ? campaign.title : 'N/A',
        platform: t.platform,
        contentType: t.contentType,
        taskTitle: t.title,
        status: t.status,
        publishedUrl: t.publishedUrl || 'N/A',
        verificationStatus: t.verificationStatus
      };
    });

    return res.json({ success: true, date: startOfDay.toISOString().split('T')[0], count: report.length, data: report });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to generate daily posting report', error });
  }
});

export default router;
