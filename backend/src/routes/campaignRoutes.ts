import { Router, Response } from 'express';
import { Campaign, CampaignEmployee } from '../models/allModels';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import { logActivity } from '../middleware/auditLog';

const router = Router();

// GET /api/v1/campaigns
router.get('/', authenticateToken, checkPermission('campaign.view'), async (req: AuthRequest, res: Response) => {
  const { brandId, status } = req.query;
  const filter: any = {};
  if (brandId) filter.brandId = brandId;
  if (status) filter.status = status;

  try {
    const campaigns = await Campaign.find(filter)
      .populate('brandId', 'brandName brandId logo')
      .populate('managerId', 'name employeeId designation')
      .sort({ createdAt: -1 });

    return res.json({ success: true, count: campaigns.length, data: campaigns });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch campaigns', error });
  }
});

// GET /api/v1/campaigns/:id
router.get('/:id', authenticateToken, checkPermission('campaign.view'), async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('brandId', 'brandName brandId logo industry')
      .populate('managerId', 'name employeeId email designation');

    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

    // Fetch assigned campaign employees
    const assignedEmployees = await CampaignEmployee.find({ campaignId: campaign._id, status: 'Active' })
      .populate('employeeId', 'name employeeId email designation department');

    return res.json({
      success: true,
      data: {
        ...campaign.toObject(),
        assignedEmployees
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch campaign details', error });
  }
});

// POST /api/v1/campaigns
router.post('/', authenticateToken, checkPermission('campaign.create'), async (req: AuthRequest, res: Response) => {
  const { brandId, title, description, platforms, startDate, endDate, status, managerId, priority } = req.body;

  if (!brandId || !title || !startDate || !endDate) {
    return res.status(400).json({ success: false, message: 'Brand ID, Title, Start Date, and End Date are required' });
  }

  try {
    const campaign = await Campaign.create({
      brandId,
      title,
      description,
      platforms: platforms || ['Instagram'],
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      status: status || 'Planning',
      managerId: managerId || undefined,
      priority: priority || 'Medium'
    });

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'System',
      action: 'CREATE_CAMPAIGN',
      module: 'Campaign Management',
      entity: 'Campaign',
      entityId: (campaign._id as any).toString(),
      newValue: { title, brandId, status }
    });

    return res.status(201).json({ success: true, message: 'Campaign created successfully', data: campaign });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create campaign', error });
  }
});

// PUT /api/v1/campaigns/:id
router.put('/:id', authenticateToken, checkPermission('campaign.update'), async (req: AuthRequest, res: Response) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

    const oldValue = { ...campaign.toObject() };
    Object.assign(campaign, req.body);
    await campaign.save();

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'System',
      action: 'UPDATE_CAMPAIGN',
      module: 'Campaign Management',
      entity: 'Campaign',
      entityId: (campaign._id as any).toString(),
      oldValue,
      newValue: campaign.toObject()
    });

    return res.json({ success: true, message: 'Campaign updated successfully', data: campaign });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update campaign', error });
  }
});

export default router;
