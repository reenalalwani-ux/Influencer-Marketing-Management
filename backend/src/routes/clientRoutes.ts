import { Router, Response } from 'express';
import { User, Brand, Task, ContentCalendar, Influencer, AuditLog } from '../models/allModels';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logActivity } from '../middleware/auditLog';

const router = Router();

// Middleware helper to get client's brandId
const getClientBrandId = async (req: AuthRequest): Promise<any> => {
  if (!req.user) return null;
  if (req.user.brandId) return req.user.brandId;
  // Fallback: search for Brand matching client user email or contact email
  const brand = await Brand.findOne({ email: req.user.email.toLowerCase() });
  return brand ? brand._id : null;
};

// GET /api/v1/client/overview
router.get('/overview', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    const brandId = await getClientBrandId(req);
    const fallbackBrand = await Brand.findOne({ status: 'Active' });
    const targetBrandId = brandId || (fallbackBrand ? fallbackBrand._id : null);
    if (!targetBrandId) {
      return res.status(404).json({ success: false, message: 'No active brand found for client portal.' });
    }
    const brandDetails = await Brand.findById(targetBrandId);

    // Query content, tasks, influencers concurrently
    const [calendarPosts, taskPosts, influencersList, recentLogs] = await Promise.all([
      ContentCalendar.find({ brandId: targetBrandId }).sort({ postDate: -1 }).lean(),
      Task.find({ brandId: targetBrandId }).sort({ scheduledDate: -1 }).lean(),
      Influencer.find({ brandId: targetBrandId }).sort({ createdAt: -1 }).lean(),
      AuditLog.find({ entity: 'Brand', entityId: targetBrandId.toString() }).sort({ timestamp: -1 }).limit(10).lean()
    ]);

    // Calculate aggregated metrics
    const totalCalendar = calendarPosts.length;
    const publishedCalendar = calendarPosts.filter(p => p.status === 'Published').length;
    const scheduledCalendar = calendarPosts.filter(p => p.status === 'Approved' || p.status === 'Pending').length;

    const totalTasks = taskPosts.length;
    const publishedTasks = taskPosts.filter(t => t.publishedUrl || t.status === 'Verified' || t.status === 'Completed').length;
    const scheduledTasks = taskPosts.filter(t => t.status === 'Pending' || t.status === 'In Progress').length;

    const totalInfluencerPosts = influencersList.filter(i => i.contentLink).length;
    let totalViews = 0;
    influencersList.forEach(i => {
      totalViews += (i.viewsCount || 0);
    });

    const totalPosts = totalCalendar + totalTasks + totalInfluencerPosts;
    const publishedPosts = publishedCalendar + publishedTasks + totalInfluencerPosts;
    const scheduledPosts = scheduledCalendar + scheduledTasks;
    const activeInfluencers = influencersList.length;

    // Platform Breakdown
    const platformMap: Record<string, number> = {};
    [...calendarPosts, ...taskPosts, ...influencersList].forEach(item => {
      const p = item.platform || 'Instagram';
      platformMap[p] = (platformMap[p] || 0) + 1;
    });

    return res.status(200).json({
      success: true,
      data: {
        brand: brandDetails,
        metrics: {
          totalPosts,
          publishedPosts,
          scheduledPosts,
          activeInfluencers,
          totalViews,
          pendingApprovals: calendarPosts.filter(p => p.clientApprovalStatus === 'Pending' || p.status === 'Pending').length
        },
        platformBreakdown: platformMap,
        recentActivities: recentLogs
      }
    });
  } catch (error: any) {
    console.error('Error fetching client overview:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching client overview' });
  }
});

// GET /api/v1/client/postings
router.get('/postings', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    const brandId = await getClientBrandId(req);
    let targetBrandId = brandId;
    if (!targetBrandId) {
      const fallback = await Brand.findOne({ status: 'Active' });
      targetBrandId = fallback ? fallback._id : null;
    }

    if (!targetBrandId) {
      return res.status(200).json({ success: true, postings: [] });
    }

    const { platform, status, search } = req.query;

    const [calendarItems, taskItems, influencerItems] = await Promise.all([
      ContentCalendar.find({ brandId: targetBrandId }).sort({ postDate: -1 }).lean(),
      Task.find({ brandId: targetBrandId }).populate('employeeId', 'name').sort({ scheduledDate: -1 }).lean(),
      Influencer.find({ brandId: targetBrandId }).sort({ createdAt: -1 }).lean()
    ]);

    // Map all items into a unified ClientPosting object
    let unifiedPostings: any[] = [];

    calendarItems.forEach(item => {
      unifiedPostings.push({
        id: item._id.toString(),
        sourceType: 'ContentCalendar',
        title: item.typeOfPost || 'Social Post',
        platform: item.platform || 'Instagram',
        contentType: item.typeOfPost,
        postDate: item.postDate,
        status: item.status === 'Published' ? 'Published' : (item.status === 'Approved' ? 'Scheduled' : 'Pending Approval'),
        mediaUrl: item.mediaLink || item.referenceLink,
        publishedUrl: item.referenceLink || item.mediaLink,
        notes: item.notes,
        designerName: item.assignedDesignerName,
        clientApprovalStatus: item.clientApprovalStatus || 'Pending',
        clientComments: item.clientComments || ''
      });
    });

    taskItems.forEach(item => {
      unifiedPostings.push({
        id: item._id.toString(),
        sourceType: 'Task',
        title: item.title,
        platform: item.platform || 'Instagram',
        contentType: item.contentType,
        postDate: item.publishedDate || item.scheduledDate,
        status: item.publishedUrl || item.status === 'Verified' || item.status === 'Completed' ? 'Published' : 'Scheduled',
        mediaUrl: item.publishedUrl,
        publishedUrl: item.publishedUrl,
        notes: item.description || item.remarks,
        assigneeName: (item.employeeId as any)?.name || 'Team Specialist',
        clientApprovalStatus: item.clientApprovalStatus || 'Pending',
        clientComments: item.clientComments || ''
      });
    });

    influencerItems.forEach(item => {
      if (item.contentLink || item.status === 'Completed' || item.status === 'Approved') {
        unifiedPostings.push({
          id: item._id.toString(),
          sourceType: 'Influencer',
          title: `${item.influencerName} (@${item.influencerInstagramId || 'influencer'})`,
          platform: item.platform || 'Instagram',
          contentType: item.videoType || 'Influencer Post',
          postDate: item.transactionDate || (item as any).createdAt || new Date(),
          status: 'Published',
          mediaUrl: item.contentLink,
          publishedUrl: item.contentLink,
          notes: item.videoDescription || item.notes,
          influencerName: item.influencerName,
          viewsCount: item.viewsCount || 0,
          ordersGenerated: item.ordersGenerated || 0,
          clientApprovalStatus: 'Approved'
        });
      }
    });

    // Sort by date descending
    unifiedPostings.sort((a, b) => new Date(b.postDate).getTime() - new Date(a.postDate).getTime());

    // Apply query filters
    if (platform && platform !== 'All') {
      unifiedPostings = unifiedPostings.filter(p => p.platform.toLowerCase() === (platform as string).toLowerCase());
    }

    if (status && status !== 'All') {
      unifiedPostings = unifiedPostings.filter(p => p.status.toLowerCase() === (status as string).toLowerCase());
    }

    if (search) {
      const q = (search as string).toLowerCase();
      unifiedPostings = unifiedPostings.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.notes && p.notes.toLowerCase().includes(q)) ||
        (p.platform && p.platform.toLowerCase().includes(q))
      );
    }

    return res.status(200).json({
      success: true,
      count: unifiedPostings.length,
      postings: unifiedPostings
    });
  } catch (error: any) {
    console.error('Error fetching client postings:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching client postings' });
  }
});

// POST /api/v1/client/postings/:sourceType/:id/approve
router.post('/postings/:sourceType/:id/approve', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { sourceType, id } = req.params;
  const { approvalStatus, comments } = req.body; // approvalStatus: 'Approved' | 'Revision Requested'

  if (!approvalStatus || !['Approved', 'Revision Requested'].includes(approvalStatus)) {
    return res.status(400).json({ success: false, message: 'Invalid approval status provided' });
  }

  try {
    if (sourceType === 'ContentCalendar') {
      const item = await ContentCalendar.findById(id);
      if (!item) return res.status(404).json({ success: false, message: 'Content item not found' });

      item.clientApprovalStatus = approvalStatus;
      if (comments) item.clientComments = comments;
      if (approvalStatus === 'Approved') {
        item.status = 'Approved';
      }
      await item.save();
    } else if (sourceType === 'Task') {
      const task = await Task.findById(id);
      if (!task) return res.status(404).json({ success: false, message: 'Task item not found' });

      task.clientApprovalStatus = approvalStatus;
      if (comments) task.clientComments = comments;
      await task.save();
    }

    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      action: `CLIENT_${approvalStatus.toUpperCase().replace(' ', '_')}`,
      module: 'ClientPortal',
      entity: sourceType,
      entityId: id,
      details: comments || `Client marked item as ${approvalStatus}`
    });

    return res.status(200).json({
      success: true,
      message: `Post successfully marked as ${approvalStatus}`
    });
  } catch (error: any) {
    console.error('Error updating approval status:', error);
    return res.status(500).json({ success: false, message: 'Server error updating status' });
  }
});

// GET /api/v1/client/influencers
router.get('/influencers', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    const brandId = await getClientBrandId(req);
    let targetBrandId = brandId;
    if (!targetBrandId) {
      const fallback = await Brand.findOne({ status: 'Active' });
      targetBrandId = fallback ? fallback._id : null;
    }

    if (!targetBrandId) {
      return res.status(200).json({ success: true, influencers: [] });
    }

    const influencers = await Influencer.find({ brandId: targetBrandId }).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      influencers
    });
  } catch (error: any) {
    console.error('Error fetching client influencers:', error);
    return res.status(500).json({ success: false, message: 'Server error fetching influencers' });
  }
});

export default router;
