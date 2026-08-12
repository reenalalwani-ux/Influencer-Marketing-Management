import { Router, Response } from 'express';
import { Employee, Task, EmployeeBrand } from '../models/allModels';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';

const router = Router();

// GET /api/v1/performance
router.get('/', authenticateToken, checkPermission('performance.view'), async (req: AuthRequest, res: Response) => {
  try {
    let filter: any = { status: 'Active' };

    // Employee Role Isolation: If user is an employee, only return their own performance data
    const isEmployeeRole = req.user?.role?.toLowerCase() === 'employee';
    if (isEmployeeRole) {
      const emp = await Employee.findOne({
        $or: [
          { email: req.user?.email },
          { name: req.user?.name }
        ]
      });
      if (emp) {
        filter._id = emp._id;
      } else {
        filter._id = null;
      }
    }

    const employees = await Employee.find(filter).sort({ name: 1 });

    const performanceReport = await Promise.all(
      employees.map(async (emp) => {
        const empId = emp._id;

        // Fetch tasks assigned to this employee
        const tasks = await Task.find({ employeeId: empId });
        const totalAssigned = tasks.length;
        const completed = tasks.filter(t => t.status === 'Verified' || t.status === 'Submitted').length;
        const pending = tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;
        const delayed = tasks.filter(t => t.status === 'Delayed').length;
        const missed = tasks.filter(t => t.status === 'Missed' || t.status === 'Rejected').length;

        // Calculate rates
        const completionRate = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0;

        // On time tasks = completed tasks where publishedDate <= deadline
        const onTimeCount = tasks.filter(t => 
          (t.status === 'Verified' || t.status === 'Submitted') && 
          t.publishedDate && t.deadline && new Date(t.publishedDate) <= new Date(t.deadline)
        ).length;
        const onTimeRate = completed > 0 ? Math.round((onTimeCount / completed) * 100) : (totalAssigned > 0 ? 100 : 0);

        // Fetch brands managed count
        const brandsCount = await EmployeeBrand.countDocuments({ employeeId: empId, status: 'Active' });

        return {
          employee: {
            id: emp._id,
            employeeId: emp.employeeId,
            name: emp.name,
            email: emp.email,
            department: emp.department,
            designation: emp.designation,
            role: emp.role
          },
          metrics: {
            totalAssigned,
            completed,
            pending,
            delayed,
            missed,
            completionRate,
            onTimeRate,
            brandsManaged: brandsCount
          }
        };
      })
    );

    return res.json({ success: true, count: performanceReport.length, data: performanceReport });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to calculate performance metrics', error });
  }
});

// GET /api/v1/performance/:employeeId
router.get('/:employeeId', authenticateToken, checkPermission('performance.view'), async (req: AuthRequest, res: Response) => {
  try {
    const emp = await Employee.findById(req.params.employeeId);
    if (!emp) return res.status(404).json({ success: false, message: 'Employee not found' });

    const tasks = await Task.find({ employeeId: emp._id }).populate('brandId', 'brandName');
    const totalAssigned = tasks.length;
    const completed = tasks.filter(t => t.status === 'Verified' || t.status === 'Submitted').length;
    const pending = tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;
    const delayed = tasks.filter(t => t.status === 'Delayed').length;
    const missed = tasks.filter(t => t.status === 'Missed' || t.status === 'Rejected').length;

    const completionRate = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0;
    const brands = await EmployeeBrand.find({ employeeId: emp._id, status: 'Active' }).populate('brandId');

    return res.json({
      success: true,
      data: {
        employee: emp,
        metrics: {
          totalAssigned,
          completed,
          pending,
          delayed,
          missed,
          completionRate
        },
        brands,
        tasks
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching employee performance', error });
  }
});

export default router;
