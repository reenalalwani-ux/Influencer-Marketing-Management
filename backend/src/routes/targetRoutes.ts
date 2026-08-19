import { Router, Response } from 'express';
import { Target, Influencer, Employee, EmployeeBrand, Brand } from '../models/allModels';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import { logActivity } from '../middleware/auditLog';

const router = Router();

// Helper to get active team members in Influencer Marketing
export const getActiveInfluencerMembers = async () => {
  return await Employee.find({
    status: 'Active',
    department: 'Influencer Marketing'
  }).sort({ employeeId: 1, name: 1 });
};

// Helper to build date range filter from timeframe, year, month, or target period
export const buildDateFilter = (timeframe?: string, year?: string | number, month?: string | number) => {
  const filter: any = {};
  const now = new Date();
  const currentYear = Number(year) || now.getFullYear();
  const currentMonth = month !== undefined ? Number(month) - 1 : now.getMonth();

  if (timeframe && typeof timeframe === 'string' && timeframe.includes('_')) {
    const parts = timeframe.split('_');
    const monthNames: Record<string, number> = {
      january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
      july: 6, august: 7, september: 8, october: 9, november: 10, december: 11
    };
    const mIdx = monthNames[parts[0].toLowerCase()];
    const yr = Number(parts[1]) || 2026;
    if (mIdx !== undefined) {
      const startOfMonth = new Date(yr, mIdx, 1, 0, 0, 0);
      const endOfMonth = new Date(yr, mIdx + 1, 0, 23, 59, 59);
      filter.transactionDate = { $gte: startOfMonth, $lte: endOfMonth };
    }
  } else if (timeframe === 'today') {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    filter.transactionDate = { $gte: startOfDay, $lte: endOfDay };
  } else if (timeframe === 'monthly' || timeframe === 'Month') {
    const startOfMonth = new Date(currentYear, currentMonth, 1, 0, 0, 0);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
    filter.transactionDate = { $gte: startOfMonth, $lte: endOfMonth };
  } else if (timeframe === 'yearly' || timeframe === 'Year') {
    const startOfYear = new Date(currentYear, 0, 1, 0, 0, 0);
    const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);
    filter.transactionDate = { $gte: startOfYear, $lte: endOfYear };
  }
  return filter;
};

// Helper to auto-calculate target progress and auto-fill team targets from actual Influencer transactions
export const recalculateTargetProgress = async (target: any, customDateFilter?: any) => {
  if (!target) return target;

  let filter: any = {};
  if (customDateFilter && customDateFilter.transactionDate) {
    filter.transactionDate = customDateFilter.transactionDate;
  } else {
    const now = new Date();
    let startDate = target.startDate;
    let endDate = target.endDate;

    if (!startDate || !endDate) {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }
    filter.transactionDate = { $gte: startDate, $lte: endDate };
  }

  if (target.targetType === 'Barter') {
    if (target.autoSync !== false) {
      const activeMembers = await getActiveInfluencerMembers();
      const activeMemberIds = activeMembers.map(m => m._id.toString());
      
      const assignments = await EmployeeBrand.find({ 
        status: 'Active',
        employeeId: { $in: activeMemberIds }
      });
      const assignedBrandIds = assignments.map(a => a.brandId.toString());
      const assignedBrands = await Brand.find({ _id: { $in: assignedBrandIds } });
      
      const totalBarterQuota = assignedBrands.reduce((sum, b) => {
        const quota = b.targetBarterCollabs || (b.brandType === 'New' ? 8 : 7);
        return sum + quota;
      }, 0);

      target.targetAmount = totalBarterQuota || 120;
      target.targetCount = totalBarterQuota || 120;
      target.description = `Auto-calculated monthly barter volume across ${assignedBrands.length} assigned brands (${totalBarterQuota} Collabs).`;
    }

    const barterCount = await Influencer.countDocuments({
      category: 'Barter',
      status: { $in: ['Completed', 'Approved', 'Settled', 'completed', 'approved', 'settled'] },
      ...filter
    });
    target.achievedCount = barterCount;
    target.achievedAmount = barterCount;
  } else {
    // Paid Target: Auto-fill targetAmount based on active team members (N * ₹1,20,000)
    if (target.autoSync !== false) {
      const activeMembers = await getActiveInfluencerMembers();
      const memberCount = Math.max(1, activeMembers.length);
      target.targetAmount = memberCount * 120000;
      target.description = `Monthly AD2ship team profit margin target (₹1.2L per executive across ${memberCount} team members).`;
    }

    // Sum ad2shipMargin from Paid collabs
    const paidRecords = await Influencer.find({
      category: 'Paid',
      status: { $in: ['Completed', 'Approved', 'Settled', 'completed', 'approved', 'settled'] },
      ...filter
    });
    const totalMargin = paidRecords.reduce((acc, curr) => {
      const m = curr.ad2shipMargin || ((curr.brandOnboardingAmt || curr.inAmount || 0) - (curr.influencerOnboardingAmt || curr.outAmount || 0));
      return acc + m;
    }, 0);
    target.achievedAmount = totalMargin;
  }

  await target.save();
  return target;
};

// GET /api/v1/targets/team-breakdown - Live auto-filled breakdown for all active team members (Month-Filtered)
router.get('/team-breakdown', authenticateToken, checkPermission('target.view'), async (req: AuthRequest, res: Response) => {
  try {
    const { timeframe, year, month } = req.query;
    const dateFilter = buildDateFilter(timeframe as string, year as string, month as string);

    const members = await getActiveInfluencerMembers();
    const teamSize = members.length;
    const perMemberTarget = 120000;
    const teamTargetAmount = teamSize * perMemberTarget;

    const allBrands = await Brand.find();
    const allAssignments = await EmployeeBrand.find({ status: 'Active' });
    const allPaidCollabs = await Influencer.find({ category: 'Paid', status: { $in: ['Completed', 'Approved', 'Settled', 'completed', 'approved', 'settled'] }, ...dateFilter }).sort({ transactionDate: -1 });
    const allBarterCollabs = await Influencer.find({ category: 'Barter', status: { $in: ['Completed', 'Approved', 'Settled', 'completed', 'approved', 'settled'] }, ...dateFilter }).sort({ transactionDate: -1 });

    let teamAchievedMargin = 0;
    let teamQualifyingVideosCount = 0;
    let teamTotalBonus = 0;
    let teamBarterTarget = 0;
    let teamAchievedBarterCount = 0;

    const memberBreakdowns = members.map(emp => {
      const assignedBrandIds = allAssignments
        .filter(a => a.employeeId.toString() === emp._id.toString())
        .map(a => a.brandId.toString());

      const assignedBrandDocs = allBrands.filter(b => assignedBrandIds.includes((b._id as any).toString()));
      const assignedBrandNames = assignedBrandDocs.map(b => b.brandName.toLowerCase());

      const empName = emp.name.toLowerCase();

      const memberPaid = allPaidCollabs.filter(c => {
        const brandMatch = c.brandName && assignedBrandNames.includes(c.brandName.toLowerCase());
        const mgrMatch = c.influencerManager && c.influencerManager.toLowerCase().includes(empName);
        return brandMatch || mgrMatch;
      });

      const memberBarter = allBarterCollabs.filter(c => {
        const brandMatch = c.brandName && assignedBrandNames.includes(c.brandName.toLowerCase());
        const mgrMatch = c.influencerManager && c.influencerManager.toLowerCase().includes(empName);
        return brandMatch || mgrMatch;
      });

      const netMargin = memberPaid.reduce((acc, curr) => {
        const m = curr.ad2shipMargin || ((curr.brandOnboardingAmt || curr.inAmount || 0) - (curr.influencerOnboardingAmt || curr.outAmount || 0));
        return acc + m;
      }, 0);

      teamAchievedMargin += netMargin;

      // Auto-calculate Barter Target for this member based on assigned brands
      const individualBarterTarget = assignedBrandDocs.reduce((sum, b) => {
        const quota = b.targetBarterCollabs || (b.brandType === 'New' ? 8 : 7);
        return sum + quota;
      }, 0);

      teamBarterTarget += individualBarterTarget;
      teamAchievedBarterCount += memberBarter.length;

      const barterAchievedPercent = individualBarterTarget > 0 
        ? Math.min(100, Math.round((memberBarter.length / individualBarterTarget) * 100))
        : 0;

      // Slab Calculation: 80k gives 5% incentive, 1L+ gives 10% incentive
      let targetTier: '0%' | '5%' | '10%' = '0%';
      let targetIncentivePercentage = 0;
      if (netMargin >= 100000) {
        targetTier = '10%';
        targetIncentivePercentage = 10;
      } else if (netMargin >= 80000) {
        targetTier = '5%';
        targetIncentivePercentage = 5;
      }

      const targetIncentiveAmount = Math.round((netMargin * targetIncentivePercentage) / 100);

      // 100+ Orders Video Performance Bonus (10% per video margin)
      const qualifyingDeals = memberPaid.filter(c => (c.ordersGenerated || c.ordersCount || 0) >= 100);
      const qualifyingBonusDealsCount = qualifyingDeals.length;
      teamQualifyingVideosCount += qualifyingBonusDealsCount;

      const orderBonusAmount = qualifyingDeals.reduce((acc, curr) => {
        const dealMargin = curr.ad2shipMargin || ((curr.brandOnboardingAmt || curr.inAmount || 0) - (curr.influencerOnboardingAmt || curr.outAmount || 0));
        return acc + Math.round(dealMargin * 0.10);
      }, 0);

      const totalTakeHomeIncentive = targetIncentiveAmount + orderBonusAmount;
      teamTotalBonus += totalTakeHomeIncentive;

      const targetAchievedPercent = Math.min(100, Math.round((netMargin / perMemberTarget) * 100));

      const assignedBrandsData = assignedBrandDocs.map(b => ({
        id: b._id,
        name: b.brandName,
        brandType: b.brandType || 'Running',
        targetBarterCollabs: b.targetBarterCollabs || 7,
        targetPaidCollabs: b.targetPaidCollabs || 3,
        targetTotalCollabs: b.targetTotalCollabs || 10
      }));

      const dealsData = [...memberPaid, ...memberBarter].map(d => ({
        id: d._id,
        transactionDate: d.transactionDate,
        influencerName: d.influencerName,
        brandName: d.brandName,
        category: d.category,
        brandOnboardingAmt: d.brandOnboardingAmt || d.inAmount || 0,
        influencerOnboardingAmt: d.influencerOnboardingAmt || d.outAmount || 0,
        ad2shipMargin: d.ad2shipMargin || ((d.brandOnboardingAmt || d.inAmount || 0) - (d.influencerOnboardingAmt || d.outAmount || 0)),
        ordersGenerated: d.ordersGenerated || d.ordersCount || 0,
        isOrderBonusQualified: (d.ordersGenerated || d.ordersCount || 0) >= 100,
        videoType: d.videoType || 'Single Product Video',
        status: d.status || 'Completed'
      }));

      return {
        employee: {
          id: emp._id,
          employeeId: emp.employeeId,
          name: emp.name,
          email: emp.email,
          department: emp.department,
          designation: emp.designation,
          assignedBrandsCount: assignedBrandDocs.length
        },
        individualTarget: perMemberTarget,
        individualBarterTarget,
        barterAchievedPercent,
        netMargin,
        targetAchievedPercent,
        targetTier,
        targetIncentivePercentage,
        targetIncentiveAmount,
        qualifyingBonusDealsCount,
        orderBonusAmount,
        totalTakeHomeIncentive,
        barterCount: memberBarter.length,
        paidCount: memberPaid.length,
        assignedBrands: assignedBrandsData,
        deals: dealsData
      };
    });

    const teamCompletionPercent = Math.min(100, Math.round((teamAchievedMargin / (teamTargetAmount || 1)) * 100));
    const teamSlab = teamAchievedMargin >= teamTargetAmount ? '10%' : teamAchievedMargin >= (teamSize * 80000) ? '5%' : '0%';
    const teamBarterCompletionPercent = Math.min(100, Math.round((teamAchievedBarterCount / (teamBarterTarget || 1)) * 100));

    return res.status(200).json({
      success: true,
      data: {
        teamSize,
        perMemberTarget,
        teamTargetAmount,
        teamAchievedMargin,
        teamCompletionPercent,
        teamSlab,
        teamBarterTarget,
        teamAchievedBarterCount,
        teamBarterCompletionPercent,
        teamQualifyingVideosCount,
        teamTotalBonus,
        members: memberBreakdowns
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching team target breakdown', error });
  }
});

// GET /api/v1/targets - Fetch all targets
router.get('/', authenticateToken, checkPermission('target.view'), async (req: AuthRequest, res: Response) => {
  try {
    const { timeframe, year, month } = req.query;
    const dateFilter = buildDateFilter(timeframe as string, year as string, month as string);

    const targets = await Target.find().sort({ createdAt: -1 }).populate('createdBy', 'name email role');
    for (const target of targets) {
      await recalculateTargetProgress(target, dateFilter);
    }
    return res.status(200).json({ 
      success: true, 
      count: targets.length, 
      data: targets,
      message: targets.length === 0 ? 'No records found' : 'Targets fetched successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching targets', error });
  }
});

// GET /api/v1/targets/active - Fetch current active target for top banner display
router.get('/active', authenticateToken, checkPermission('target.view'), async (req: AuthRequest, res: Response) => {
  try {
    const { timeframe, year, month } = req.query;
    const dateFilter = buildDateFilter(timeframe as string, year as string, month as string);

    let activeTarget = await Target.findOne({ isActive: true, status: 'Active' }).sort({ updatedAt: -1 }).populate('createdBy', 'name email role');
    
    // Fallback: If no target is explicitly marked isActive, pick the most recent Active target
    if (!activeTarget) {
      activeTarget = await Target.findOne({ status: 'Active' }).sort({ createdAt: -1 }).populate('createdBy', 'name email role');
    }

    if (activeTarget) {
      await recalculateTargetProgress(activeTarget, dateFilter);
    }

    return res.status(200).json({ 
      success: true, 
      data: activeTarget || null,
      message: activeTarget ? 'Active target fetched successfully' : 'No active target found'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching active target', error });
  }
});

// POST /api/v1/targets - Create target (Manager / Admin)
router.post('/', authenticateToken, checkPermission('target.create'), async (req: AuthRequest, res: Response) => {
  try {
    const { title, targetType, targetMetric, targetAmount, achievedAmount, targetCount, achievedCount, currency, period, startDate, endDate, description, isActive, autoSync } = req.body;

    if (!title || targetAmount === undefined || !period) {
      return res.status(400).json({ success: false, message: 'Title, Target Amount, and Period are required.' });
    }

    // If setting as active, deactivate other targets of the same targetType
    if (isActive !== false) {
      await Target.updateMany({ targetType: targetType || 'Paid' }, { isActive: false });
    }

    const newTarget = await Target.create({
      title,
      targetType: targetType || 'Paid',
      targetMetric: targetMetric || (targetType === 'Barter' ? 'Count' : 'Margin'),
      targetAmount: Number(targetAmount),
      achievedAmount: Number(achievedAmount || 0),
      targetCount: Number(targetCount || targetAmount || 0),
      achievedCount: Number(achievedCount || 0),
      currency: currency || (targetType === 'Barter' ? 'Collabs' : '₹'),
      period,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      description,
      status: 'Active',
      isActive: isActive !== false,
      autoSync: autoSync !== false,
      createdBy: req.user?._id
    });

    await recalculateTargetProgress(newTarget);

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'System',
      action: 'CREATE_TARGET',
      module: 'Target Module',
      entity: 'Target',
      entityId: (newTarget._id as any).toString(),
      newValue: newTarget.toObject()
    });

    return res.status(200).json({ success: true, message: 'Target created successfully', data: newTarget });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create target', error });
  }
});

// PUT /api/v1/targets/:id - Update target (Manager / Admin)
router.put('/:id', authenticateToken, checkPermission('target.update'), async (req: AuthRequest, res: Response) => {
  try {
    const target = await Target.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'No record exists for this target' });

    const oldValue = { ...target.toObject() };

    if (req.body.isActive === true) {
      await Target.updateMany({ _id: { $ne: target._id }, targetType: target.targetType }, { isActive: false });
    }

    if (req.body.title !== undefined) target.title = req.body.title;
    if (req.body.targetType !== undefined) target.targetType = req.body.targetType;
    if (req.body.targetMetric !== undefined) target.targetMetric = req.body.targetMetric;
    if (req.body.targetAmount !== undefined) target.targetAmount = Number(req.body.targetAmount);
    if (req.body.achievedAmount !== undefined) target.achievedAmount = Number(req.body.achievedAmount);
    if (req.body.targetCount !== undefined) target.targetCount = Number(req.body.targetCount);
    if (req.body.achievedCount !== undefined) target.achievedCount = Number(req.body.achievedCount);
    if (req.body.currency !== undefined) target.currency = req.body.currency;
    if (req.body.period !== undefined) target.period = req.body.period;
    if (req.body.startDate !== undefined) target.startDate = req.body.startDate ? new Date(req.body.startDate) : undefined;
    if (req.body.endDate !== undefined) target.endDate = req.body.endDate ? new Date(req.body.endDate) : undefined;
    if (req.body.status !== undefined) target.status = req.body.status;
    if (req.body.isActive !== undefined) target.isActive = req.body.isActive;
    if (req.body.autoSync !== undefined) target.autoSync = req.body.autoSync;
    if (req.body.description !== undefined) target.description = req.body.description;

    await recalculateTargetProgress(target);
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

    return res.status(200).json({ success: true, message: 'Target updated successfully', data: target });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update target', error });
  }
});

// PATCH /api/v1/targets/:id/active - Set target as active system banner target
router.patch('/:id/active', authenticateToken, checkPermission('target.update'), async (req: AuthRequest, res: Response) => {
  try {
    const target = await Target.findById(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'No record exists for this target' });

    // Set all targets to isActive: false, then set this one to true
    await Target.updateMany({}, { isActive: false });
    target.isActive = true;
    await recalculateTargetProgress(target);
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

    return res.status(200).json({ success: true, message: 'Set as active system target', data: target });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to set active target', error });
  }
});

// DELETE /api/v1/targets/:id - Delete target
router.delete('/:id', authenticateToken, checkPermission('target.delete'), async (req: AuthRequest, res: Response) => {
  try {
    const target = await Target.findByIdAndDelete(req.params.id);
    if (!target) return res.status(404).json({ success: false, message: 'No record exists for this target' });

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'System',
      action: 'DELETE_TARGET',
      module: 'Target Module',
      entity: 'Target',
      entityId: req.params.id,
      oldValue: target.toObject()
    });

    return res.status(200).json({ success: true, message: 'Target deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete target', error });
  }
});

export default router;
