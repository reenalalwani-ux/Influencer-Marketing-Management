import { Router, Response } from 'express';
import { ContentCalendar, Brand, Employee } from '../models/allModels';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import { logActivity } from '../middleware/auditLog';

const router = Router();

// GET /api/v1/content-calendar
router.get('/', authenticateToken, checkPermission('task.view'), async (req: AuthRequest, res: Response) => {
  try {
    const { brandId, brandName, year, month, search, designer } = req.query;
    const filter: any = {};

    if (brandId && brandId !== 'All') {
      filter.brandId = brandId;
    } else if (brandName && brandName !== 'All') {
      filter.brandName = brandName;
    }

    if (designer && designer !== 'All') {
      filter.assignedDesignerName = designer;
    }

    const now = new Date();
    const currentYear = Number(year) || now.getFullYear();
    const currentMonth = month !== undefined ? Number(month) - 1 : now.getMonth();

    if (year || month !== undefined) {
      const startOfMonth = new Date(currentYear, currentMonth, 1, 0, 0, 0);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
      filter.postDate = { $gte: startOfMonth, $lte: endOfMonth };
    }

    if (search) {
      filter.$or = [
        { typeOfPost: { $regex: search, $options: 'i' } },
        { brandName: { $regex: search, $options: 'i' } },
        { assignedDesignerName: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    const items = await ContentCalendar.find(filter)
      .populate('brandId', 'brandName logo')
      .populate('assignedDesignerId', 'name designation')
      .sort({ postDate: 1 });

    return res.json({ success: true, data: items });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching content calendar', error });
  }
});

// POST /api/v1/content-calendar
router.post('/', authenticateToken, checkPermission('task.create'), async (req: AuthRequest, res: Response) => {
  try {
    const { brandId, brandName, postDate, typeOfPost, platform, referenceLink, mediaLink, assignedDesignerId, assignedDesignerName, status, notes } = req.body;

    if (!typeOfPost || !postDate) {
      return res.status(400).json({ success: false, message: 'Post date and type of post are required' });
    }

    let finalBrandName = brandName || 'Kala Kurti';
    if (brandId && !brandName) {
      const b = await Brand.findById(brandId);
      if (b) finalBrandName = b.brandName;
    }

    let finalDesignerName = assignedDesignerName || '';
    if (assignedDesignerId && !assignedDesignerName) {
      const emp = await Employee.findById(assignedDesignerId);
      if (emp) finalDesignerName = emp.name;
    }

    const dateObj = new Date(postDate);
    const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });

    const newEntry = await ContentCalendar.create({
      brandId: brandId || undefined,
      brandName: finalBrandName,
      postDate: dateObj,
      dayOfWeek,
      typeOfPost,
      platform: platform || 'Instagram',
      referenceLink: referenceLink || '',
      mediaLink: mediaLink || '',
      assignedDesignerId: assignedDesignerId || undefined,
      assignedDesignerName: finalDesignerName,
      status: status || 'Pending',
      notes: notes || '',
      createdBy: req.user?._id
    });

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'User',
      action: 'CREATE_CONTENT_CALENDAR_ENTRY',
      module: 'Content Calendar Module',
      entity: 'ContentCalendar',
      entityId: (newEntry._id as any).toString(),
      newValue: { brandName: finalBrandName, typeOfPost, postDate: newEntry.postDate }
    });

    return res.status(201).json({ success: true, message: 'Content calendar entry created', data: newEntry });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error creating content calendar entry', error });
  }
});

// PUT /api/v1/content-calendar/:id
router.put('/:id', authenticateToken, checkPermission('task.update'), async (req: AuthRequest, res: Response) => {
  try {
    const { brandId, brandName, postDate, typeOfPost, platform, referenceLink, mediaLink, assignedDesignerId, assignedDesignerName, status, notes } = req.body;

    const item = await ContentCalendar.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Content calendar entry not found' });
    }

    if (brandId !== undefined) item.brandId = brandId || undefined;
    if (brandName) item.brandName = brandName;
    if (postDate) {
      item.postDate = new Date(postDate);
      item.dayOfWeek = item.postDate.toLocaleDateString('en-US', { weekday: 'long' });
    }
    if (typeOfPost) item.typeOfPost = typeOfPost;
    if (platform) item.platform = platform;
    if (referenceLink !== undefined) item.referenceLink = referenceLink;
    if (mediaLink !== undefined) item.mediaLink = mediaLink;
    if (assignedDesignerId !== undefined) item.assignedDesignerId = assignedDesignerId || undefined;
    if (assignedDesignerName !== undefined) item.assignedDesignerName = assignedDesignerName;
    if (status) item.status = status;
    if (notes !== undefined) item.notes = notes;

    await item.save();

    return res.json({ success: true, message: 'Content calendar entry updated', data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error updating content calendar entry', error });
  }
});

// DELETE /api/v1/content-calendar/:id
router.delete('/:id', authenticateToken, checkPermission('task.delete'), async (req: AuthRequest, res: Response) => {
  try {
    await ContentCalendar.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Content calendar entry deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error deleting content calendar entry', error });
  }
});

export default router;
