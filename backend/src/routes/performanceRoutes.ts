import { Router, Response } from 'express';
import { Employee, Task, EmployeeBrand, Influencer, Brand } from '../models/allModels';
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

        // Fetch brands managed by this employee
        const assignments = await EmployeeBrand.find({ employeeId: empId, status: 'Active' }).populate('brandId');
        const assignedBrandNames = assignments
          .map((a: any) => a.brandId?.brandName)
          .filter(Boolean);
        const assignedBrandIds = assignments
          .map((a: any) => a.brandId?._id)
          .filter(Boolean);

        // Fetch Influencer Deals for this employee's assigned brands or executive name
        const deals = await Influencer.find({
          $or: [
            { brandName: { $in: assignedBrandNames } },
            { brandId: { $in: assignedBrandIds } },
            { influencerManager: new RegExp(emp.name, 'i') },
            { assignedExecutive: new RegExp(emp.name, 'i') }
          ]
        });

        const barterDeals = deals.filter(d => d.category === 'Barter');
        const paidDeals = deals.filter(d => d.category === 'Paid');

        const barterCount = barterDeals.length;
        const paidCount = paidDeals.length;
        const totalCollabs = deals.length;

        const totalRevenue = paidDeals.reduce((acc, d) => acc + (d.brandOnboardingAmt || d.brandReceivedAmt || 0), 0);
        const totalInfluencerCost = paidDeals.reduce((acc, d) => acc + (d.influencerPaidAmt || d.influencerOnboardingAmt || 0), 0);
        const netMargin = paidDeals.reduce((acc, d) => acc + (d.ad2shipMargin || 0), 0);

        // Tiered Monthly Incentive Slab (Ad2ship Net Margin)
        // >= ₹1,00,000 -> 10%
        // >= ₹80,000 and < ₹1,00,000 -> 5%
        // < ₹80,000 -> 0%
        let targetTier = '0%';
        let targetIncentivePercentage = 0;
        let targetIncentiveAmount = 0;

        if (netMargin >= 100000) {
          targetTier = '10%';
          targetIncentivePercentage = 10;
          targetIncentiveAmount = Math.round(netMargin * 0.10);
        } else if (netMargin >= 80000) {
          targetTier = '5%';
          targetIncentivePercentage = 5;
          targetIncentiveAmount = Math.round(netMargin * 0.05);
        }

        // Order-Linked Performance Bonus: Any paid video driving >= 100 orders gets 10% bonus on its margin
        const qualifyingBonusDeals = paidDeals.filter(d => (d.ordersGenerated || d.ordersCount || 0) >= 100);
        const orderBonusAmount = qualifyingBonusDeals.reduce((acc, d) => {
          const dealMargin = d.ad2shipMargin || 0;
          return acc + Math.round(dealMargin * 0.10);
        }, 0);

        const totalTakeHomeIncentive = targetIncentiveAmount + orderBonusAmount;
        const individualMonthlyTarget = 120000;
        const targetAchievedPercent = individualMonthlyTarget > 0 ? Math.min(100, Math.round((netMargin / individualMonthlyTarget) * 100)) : 0;

        // Legacy Task Metrics (100% preserved)
        const tasks = await Task.find({ employeeId: empId });
        const totalAssigned = tasks.length;
        const completed = tasks.filter(t => t.status === 'Verified' || t.status === 'Submitted').length;
        const pending = tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;
        const delayed = tasks.filter(t => t.status === 'Delayed').length;
        const missed = tasks.filter(t => t.status === 'Missed' || t.status === 'Rejected').length;
        const completionRate = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0;
        const onTimeCount = tasks.filter(t => 
          (t.status === 'Verified' || t.status === 'Submitted') && 
          t.publishedDate && t.deadline && new Date(t.publishedDate) <= new Date(t.deadline)
        ).length;
        const onTimeRate = completed > 0 ? Math.round((onTimeCount / completed) * 100) : (totalAssigned > 0 ? 100 : 0);

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
          incentiveSummary: {
            netMargin,
            individualMonthlyTarget,
            targetAchievedPercent,
            targetTier,
            targetIncentivePercentage,
            targetIncentiveAmount,
            qualifyingBonusDealsCount: qualifyingBonusDeals.length,
            orderBonusAmount,
            totalTakeHomeIncentive,
            totalRevenue,
            totalInfluencerCost,
            barterCount,
            paidCount,
            totalCollabs
          },
          qualifyingDeals: qualifyingBonusDeals.map(d => ({
            id: d._id,
            brandName: d.brandName,
            influencerName: d.influencerName,
            ordersGenerated: d.ordersGenerated || d.ordersCount || 0,
            ad2shipMargin: d.ad2shipMargin,
            bonusEarned: Math.round((d.ad2shipMargin || 0) * 0.10)
          })),
          metrics: {
            totalAssigned,
            completed,
            pending,
            delayed,
            missed,
            completionRate,
            onTimeRate,
            brandsManaged: assignments.length
          }
        };
      })
    );

    return res.status(200).json({ 
      success: true, 
      count: performanceReport.length, 
      data: performanceReport,
      message: performanceReport.length === 0 ? 'No records found' : 'Performance report fetched successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to calculate performance metrics', error });
  }
});

// GET /api/v1/performance/:employeeId
router.get('/:employeeId', authenticateToken, checkPermission('performance.view'), async (req: AuthRequest, res: Response) => {
  try {
    const emp = await Employee.findById(req.params.employeeId);
    if (!emp) return res.status(404).json({ success: false, message: 'No record exists for this employee' });

    const tasks = await Task.find({ employeeId: emp._id }).populate('brandId', 'brandName');
    const totalAssigned = tasks.length;
    const completed = tasks.filter(t => t.status === 'Verified' || t.status === 'Submitted').length;
    const pending = tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;
    const delayed = tasks.filter(t => t.status === 'Delayed').length;
    const missed = tasks.filter(t => t.status === 'Missed' || t.status === 'Rejected').length;

    const completionRate = totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0;
    const brands = await EmployeeBrand.find({ employeeId: emp._id, status: 'Active' }).populate('brandId');

    return res.status(200).json({
      success: true,
      message: 'Employee performance data fetched successfully',
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
