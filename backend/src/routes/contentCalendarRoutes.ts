import { Router, Response } from 'express';
import { ContentCalendar, Brand, Employee, EmployeeBrand } from '../models/allModels';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import { logActivity } from '../middleware/auditLog';

const router = Router();

// GET /api/v1/content-calendar
router.get('/', authenticateToken, checkPermission('task.view'), async (req: AuthRequest, res: Response) => {
  try {
    const { brandId, brandName, year, month, search, designer, fortnight } = req.query;
    const filter: any = {};

    // 0. Employee Role Brand Filtering
    const isEmployeeRole = req.user?.role?.toLowerCase() === 'employee';
    if (isEmployeeRole) {
      const emp = await Employee.findOne({
        $or: [
          { email: req.user?.email },
          { name: req.user?.name }
        ]
      });
      if (emp) {
        const assignments = await EmployeeBrand.find({ employeeId: emp._id, status: 'Active' }).populate('brandId');
        const assignedBrandIds = assignments.map(a => a.brandId?._id || a.brandId);
        const assignedBrandNames = assignments.map(a => (a.brandId as any)?.brandName).filter(Boolean);

        if (!brandId && !brandName) {
          filter.$or = [
            { brandId: { $in: assignedBrandIds } },
            { brandName: { $in: assignedBrandNames } }
          ];
        }
      } else {
        filter.brandId = { $in: [] };
      }
    }

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
      let start = new Date(currentYear, currentMonth, 1, 0, 0, 0);
      let end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

      if (fortnight === '1st-15th') {
        end = new Date(currentYear, currentMonth, 15, 23, 59, 59);
      } else if (fortnight === '16th-End') {
        start = new Date(currentYear, currentMonth, 16, 0, 0, 0);
      }

      filter.postDate = { $gte: start, $lte: end };
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

// DELETE /api/v1/content-calendar/clear-all — delete all calendar entries for a specific brand + period at once
router.delete('/clear-all', authenticateToken, checkPermission('task.delete'), async (req: AuthRequest, res: Response) => {
  try {
    const { brandName, year, month, fortnight } = req.query;

    const filter: any = {};
    if (brandName && brandName !== 'All') {
      filter.brandName = brandName;
    }

    const now = new Date();
    const currentYear = Number(year) || now.getFullYear();
    const currentMonth = month !== undefined ? Number(month) - 1 : now.getMonth();

    if (year || month !== undefined) {
      let start = new Date(currentYear, currentMonth, 1, 0, 0, 0);
      let end = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

      if (fortnight === '1st-15th') {
        end = new Date(currentYear, currentMonth, 15, 23, 59, 59);
      } else if (fortnight === '16th-End') {
        start = new Date(currentYear, currentMonth, 16, 0, 0, 0);
      }

      filter.postDate = { $gte: start, $lte: end };
    }

    const result = await ContentCalendar.deleteMany(filter);

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'User',
      action: 'CLEAR_ALL_CONTENT_CALENDAR',
      module: 'Content Calendar Module',
      entity: 'ContentCalendar',
      newValue: { brandName, deletedCount: result.deletedCount, year: currentYear, month: currentMonth + 1 }
    });

    return res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} content calendar entries`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error clearing content calendar', error });
  }
});

// POST /api/v1/content-calendar/create-cycle — Generate/Initialize a 15-day or monthly content calendar cycle
router.post('/create-cycle', authenticateToken, checkPermission('task.create'), async (req: AuthRequest, res: Response) => {
  try {
    const { brandId, brandName, year, month, fortnight, frequency, platform, assignedDesignerId, assignedDesignerName, defaultPostType } = req.body;

    if (!brandName && !brandId) {
      return res.status(400).json({ success: false, message: 'Brand is required' });
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

    const currentYear = Number(year) || new Date().getFullYear();
    const currentMonth = month !== undefined ? Number(month) - 1 : new Date().getMonth();

    // Determine start and end day numbers
    let startDay = 1;
    let endDay = new Date(currentYear, currentMonth + 1, 0).getDate();

    if (fortnight === '1st-15th') {
      startDay = 1;
      endDay = 15;
    } else if (fortnight === '16th-End') {
      startDay = 16;
    }

    // Determine step frequency (1 for Daily, 2 for Alternate days)
    const step = frequency === 'Alternate' ? 2 : (frequency === 'Single' ? 99 : 1);

    const createdEntries = [];
    const postTypes = ['Intro Post', 'Product Reel', 'Brand Carousel', 'Behind The Scenes', 'Customer Review', 'Feature Highlight', 'Special Offer'];

    let postTypeIdx = 0;
    for (let day = startDay; day <= endDay; day += step) {
      const dateObj = new Date(currentYear, currentMonth, day, 12, 0, 0);
      const dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      const postType = defaultPostType || postTypes[postTypeIdx % postTypes.length];

      const entry = await ContentCalendar.create({
        brandId: brandId || undefined,
        brandName: finalBrandName,
        postDate: dateObj,
        dayOfWeek,
        typeOfPost: postType,
        platform: platform || 'Instagram',
        referenceLink: '',
        mediaLink: '',
        assignedDesignerId: assignedDesignerId || undefined,
        assignedDesignerName: finalDesignerName,
        status: 'Pending',
        notes: `Cycle ${fortnight || 'Full Month'} post for ${day}/${currentMonth + 1}/${currentYear}`,
        createdBy: req.user?._id
      });

      createdEntries.push(entry);
      postTypeIdx++;
      if (frequency === 'Single') break;
    }

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'User',
      action: 'CREATE_CONTENT_CALENDAR_CYCLE',
      module: 'Content Calendar Module',
      entity: 'ContentCalendar',
      newValue: { brandName: finalBrandName, year: currentYear, month: currentMonth + 1, fortnight, count: createdEntries.length }
    });

    return res.status(201).json({
      success: true,
      message: `Successfully created ${createdEntries.length} calendar posts for ${finalBrandName} (${fortnight || 'Full Month'})`,
      count: createdEntries.length,
      data: createdEntries
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error creating content calendar cycle', error });
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

// POST /api/v1/content-calendar/share — generate a shareable public token for a brand+month calendar
router.post('/share', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { brandName, year, month } = req.body;
    if (!brandName) {
      return res.status(400).json({ success: false, message: 'brandName is required' });
    }

    // Build a deterministic token from brand + year + month so same share link is reused
    const tokenPayload = `${brandName}|${year || new Date().getFullYear()}|${month || new Date().getMonth() + 1}`;
    const token = Buffer.from(tokenPayload).toString('base64url');

    return res.json({
      success: true,
      token,
      message: 'Share token generated successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error generating share token', error });
  }
});

// GET /api/v1/content-calendar/public/:token — public read-only access, no auth required
router.get('/public/:token', async (req, res: Response) => {
  try {
    const { token } = req.params;

    // Decode token to get brand + year + month
    let tokenPayload: string;
    try {
      tokenPayload = Buffer.from(token, 'base64url').toString('utf8');
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid share token' });
    }

    const parts = tokenPayload.split('|');
    if (parts.length < 3) {
      return res.status(400).json({ success: false, message: 'Malformed share token' });
    }

    const [brandName, yearStr, monthStr] = parts;
    const year = Number(yearStr);
    const month = Number(monthStr) - 1; // 0-indexed month

    const startOfMonth = new Date(year, month, 1, 0, 0, 0);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

    const items = await ContentCalendar.find({
      brandName: { $regex: new RegExp(`^${brandName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      postDate: { $gte: startOfMonth, $lte: endOfMonth }
    })
      .populate('brandId', 'brandName')
      .populate('assignedDesignerId', 'name designation')
      .sort({ postDate: 1 });

    return res.json({
      success: true,
      data: items,
      meta: {
        brandName,
        year,
        month: month + 1,
        monthName: new Date(year, month, 1).toLocaleString('en-US', { month: 'long' }),
        generatedAt: new Date()
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching shared calendar', error });
  }
});

export default router;
