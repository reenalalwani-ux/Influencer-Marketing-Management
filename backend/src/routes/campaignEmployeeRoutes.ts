import { Router, Response } from 'express';
import { CampaignEmployee, Notification, Campaign } from '../models/allModels';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import { logActivity } from '../middleware/auditLog';

const router = Router();

// GET /api/v1/campaign-employees
router.get('/', authenticateToken, checkPermission('campaign.view'), async (req: AuthRequest, res: Response) => {
  const { campaignId, employeeId } = req.query;
  const filter: any = {};
  if (campaignId) filter.campaignId = campaignId;
  if (employeeId) filter.employeeId = employeeId;

  try {
    const list = await CampaignEmployee.find(filter)
      .populate('campaignId', 'title status brandId')
      .populate('employeeId', 'name employeeId designation department')
      .populate('assignedBy', 'name role');

    return res.json({ success: true, count: list.length, data: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching campaign assignments', error });
  }
});

// POST /api/v1/campaign-employees/assign
router.post('/assign', authenticateToken, checkPermission('campaign.assign'), async (req: AuthRequest, res: Response) => {
  const { campaignId, employeeId, role, startDate, endDate } = req.body;

  if (!campaignId || !employeeId) {
    return res.status(400).json({ success: false, message: 'Campaign and Employee IDs are required' });
  }

  try {
    const existing = await CampaignEmployee.findOne({ campaignId, employeeId, status: 'Active' });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Employee is already assigned to this campaign' });
    }

    const assignment = await CampaignEmployee.create({
      campaignId,
      employeeId,
      role: role || 'Content Creator',
      assignedBy: req.user?._id,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : undefined,
      status: 'Active'
    });

    const campaign = await Campaign.findById(campaignId);
    const populated = await CampaignEmployee.findById(assignment._id).populate('employeeId', 'userId name');
    const empDoc = populated?.employeeId as any;

    if (empDoc && empDoc.userId) {
      await Notification.create({
        userId: empDoc.userId,
        title: 'Assigned to Campaign',
        message: `You have been assigned to campaign "${campaign?.title || 'Marketing Campaign'}".`,
        type: 'Assignment',
        relatedId: (campaignId as string)
      });
    }

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'System',
      action: 'ASSIGN_CAMPAIGN_EMPLOYEE',
      module: 'Employee-Campaign Assignment',
      entity: 'CampaignEmployee',
      entityId: (assignment._id as any).toString(),
      newValue: { campaignId, employeeId, role }
    });

    return res.status(201).json({ success: true, message: 'Employee assigned to campaign', data: assignment });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to assign employee to campaign', error });
  }
});

export default router;
