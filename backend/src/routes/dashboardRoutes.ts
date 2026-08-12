import { Router, Response } from 'express';
import { User, Employee, Brand, Task, EmployeeBrand, AuditLog, Target } from '../models/allModels';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/v1/dashboard/stats
router.get('/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const role = req.user.role;
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  try {
    // Fetch Active Target
    let activeTarget = await Target.findOne({ isActive: true, status: 'Active' }).sort({ updatedAt: -1 });
    if (!activeTarget) {
      activeTarget = await Target.findOne({ status: 'Active' }).sort({ createdAt: -1 });
    }

    if (role === 'Employee') {
      // Find employee document
      const emp = await Employee.findOne({ email: req.user.email });
      if (!emp) {
        return res.status(404).json({ success: false, message: 'Employee profile not found' });
      }

      // My Brands
      const myBrands = await EmployeeBrand.find({ employeeId: emp._id, status: 'Active' })
        .populate('brandId', 'brandName brandId logo industry');

      // Today's Tasks
      const todaysTasks = await Task.find({
        employeeId: emp._id,
        scheduledDate: { $gte: startOfDay, $lte: endOfDay }
      }).populate('brandId', 'brandName logo').sort({ scheduledTime: 1 });

      const completedCount = todaysTasks.filter(t => t.status === 'Verified' || t.status === 'Submitted').length;
      const pendingCount = todaysTasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;
      const delayedCount = todaysTasks.filter(t => t.status === 'Delayed').length;

      // Upcoming Tasks (next 7 days)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const upcomingTasks = await Task.find({
        employeeId: emp._id,
        scheduledDate: { $gt: endOfDay, $lte: nextWeek }
      }).populate('brandId', 'brandName logo').limit(10).sort({ scheduledDate: 1 });

      return res.json({
        success: true,
        role: 'Employee',
        data: {
          myBrands,
          todaySummary: {
            total: todaysTasks.length,
            completed: completedCount,
            pending: pendingCount,
            delayed: delayedCount
          },
          todaysTasks,
          upcomingTasks,
          activeTarget
        }
      });
    }

    // Manager / Super Admin / Admin Dashboard
    const totalEmployees = await Employee.countDocuments({ status: 'Active' });
    const totalBrands = await Brand.countDocuments({ status: 'Active' });

    // Today's System Tasks
    const todaysTasks = await Task.find({
      scheduledDate: { $gte: startOfDay, $lte: endOfDay }
    }).populate('employeeId', 'name designation').populate('brandId', 'brandName logo');

    const completed = todaysTasks.filter(t => t.status === 'Verified' || t.status === 'Submitted').length;
    const pending = todaysTasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;
    const delayed = todaysTasks.filter(t => t.status === 'Delayed').length;

    // Upcoming Postings (next 5)
    const upcomingPostings = await Task.find({
      scheduledDate: { $gt: endOfDay }
    }).populate('employeeId', 'name').populate('brandId', 'brandName logo').sort({ scheduledDate: 1 }).limit(5);

    // Recent Audit Logs
    const recentAuditLogs = await AuditLog.find().sort({ timestamp: -1 }).limit(8);

    return res.json({
      success: true,
      role,
      data: {
        totalEmployees,
        totalBrands,
        todaySummary: {
          total: todaysTasks.length,
          completed,
          pending,
          delayed
        },
        todaysTasks,
        upcomingPostings,
        recentAuditLogs,
        activeTarget
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard data', error });
  }
});

export default router;
