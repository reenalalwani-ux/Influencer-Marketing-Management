import { Router, Response } from 'express';
import { Brand, EmployeeBrand, Employee } from '../models/allModels';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import { logActivity } from '../middleware/auditLog';

const router = Router();

// GET /api/v1/brands
router.get('/', authenticateToken, checkPermission('brand.view'), async (req: AuthRequest, res: Response) => {
  try {
    let filter: any = {};

    // Filter brands to ONLY those assigned if the user is an employee
    const isEmployeeRole = req.user?.role?.toLowerCase() === 'employee';
    if (isEmployeeRole) {
      const emp = await Employee.findOne({
        $or: [
          { email: req.user?.email },
          { name: req.user?.name }
        ]
      });
      if (emp) {
        const assignments = await EmployeeBrand.find({ employeeId: emp._id, status: 'Active' });
        const assignedBrandIds = assignments.map(a => a.brandId);
        filter = { _id: { $in: assignedBrandIds } };
      } else {
        filter = { _id: { $in: [] } };
      }
    }

    const brands = await Brand.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, count: brands.length, data: brands });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching brands', error });
  }
});

// GET /api/v1/brands/:id
router.get('/:id', authenticateToken, checkPermission('brand.view'), async (req: AuthRequest, res: Response) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });

    // Fetch assigned employees via relationship collection
    const assignedEmployees = await EmployeeBrand.find({ brandId: brand._id, status: 'Active' })
      .populate('employeeId', 'name employeeId email designation department phone');

    return res.json({
      success: true,
      data: {
        ...brand.toObject(),
        assignedEmployees
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching brand details', error });
  }
});

// POST /api/v1/brands
router.post('/', authenticateToken, checkPermission('brand.create'), async (req: AuthRequest, res: Response) => {
  const { brandName, logo, website, industry, contactPerson, email, phone, notes } = req.body;

  if (!brandName || !industry || !contactPerson || !email || !phone) {
    return res.status(400).json({ success: false, message: 'Required brand details missing' });
  }

  try {
    const count = await Brand.countDocuments();
    const brandId = `BRD-${100 + count + 1}`;

    const brand = await Brand.create({
      brandId,
      brandName,
      logo,
      website,
      industry,
      contactPerson,
      email,
      phone,
      notes,
      status: 'Active'
    });

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'System',
      action: 'CREATE_BRAND',
      module: 'Brand Management',
      entity: 'Brand',
      entityId: (brand._id as any).toString(),
      newValue: { brandId, brandName, industry }
    });

    return res.status(201).json({ success: true, message: 'Brand created successfully', data: brand });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create brand', error });
  }
});

// PUT /api/v1/brands/:id
router.put('/:id', authenticateToken, checkPermission('brand.update'), async (req: AuthRequest, res: Response) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found' });

    const oldValue = { ...brand.toObject() };
    Object.assign(brand, req.body);
    await brand.save();

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'System',
      action: 'UPDATE_BRAND',
      module: 'Brand Management',
      entity: 'Brand',
      entityId: (brand._id as any).toString(),
      oldValue,
      newValue: brand.toObject()
    });

    return res.json({ success: true, message: 'Brand updated successfully', data: brand });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update brand', error });
  }
});

export default router;
