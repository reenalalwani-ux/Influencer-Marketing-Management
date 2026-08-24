import { Router, Response } from 'express';
import { Brand, EmployeeBrand, Employee } from '../models/allModels';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import { logActivity } from '../middleware/auditLog';
import { getEmployeeForAuthUser } from '../utils/employeeHelper';

const router = Router();

// GET /api/v1/brands
router.get('/', authenticateToken, checkPermission('brand.view'), async (req: AuthRequest, res: Response) => {
  try {
    let filter: any = {};

    // Filter brands to ONLY those assigned if the user is an employee
    const isEmployeeRole = req.user?.role?.toLowerCase() === 'employee';
    if (isEmployeeRole) {
      const emp = await getEmployeeForAuthUser(req.user);
      if (emp) {
        const assignments = await EmployeeBrand.find({ employeeId: emp._id, status: 'Active' });
        const assignedBrandIds = assignments.map(a => a.brandId);
        filter = { _id: { $in: assignedBrandIds } };
      } else {
        filter = { _id: { $in: [] } };
      }
    }

    const brands = await Brand.find(filter).sort({ createdAt: -1 });

    // Fetch all active employee assignments to attach assigned executive name to each brand
    const assignments = await EmployeeBrand.find({ status: 'Active' })
      .populate('employeeId', 'name email designation');
    
    const assignmentMap: Record<string, any> = {};
    assignments.forEach((a: any) => {
      if (a.brandId && a.employeeId) {
        assignmentMap[a.brandId.toString()] = a.employeeId;
      }
    });

    const enrichedBrands = brands.map(b => ({
      ...b.toObject(),
      assignedExecutive: assignmentMap[(b._id as any).toString()] || null
    }));

    return res.status(200).json({ 
      success: true, 
      count: enrichedBrands.length, 
      data: enrichedBrands,
      message: enrichedBrands.length === 0 ? 'No records found' : 'Brands fetched successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching brands', error });
  }
});

// GET /api/v1/brands/:id
router.get('/:id', authenticateToken, checkPermission('brand.view'), async (req: AuthRequest, res: Response) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: 'No record exists for this brand' });

    // Fetch assigned employees via relationship collection
    const assignedEmployees = await EmployeeBrand.find({ brandId: brand._id, status: 'Active' })
      .populate('employeeId', 'name employeeId email designation department phone');

    return res.status(200).json({
      success: true,
      data: {
        ...brand.toObject(),
        assignedEmployees
      },
      message: 'Brand details fetched successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching brand details', error });
  }
});

// POST /api/v1/brands
router.post('/', authenticateToken, checkPermission('brand.create'), async (req: AuthRequest, res: Response) => {
  const { 
    brandName, logo, website, industry, contactPerson, email, phone, notes,
    brandType = 'Running', targetBarterCollabs, targetPaidCollabs
  } = req.body;

  if (!brandName || !industry || !contactPerson || !email || !phone) {
    return res.status(400).json({ success: false, message: 'Required brand details missing' });
  }

  try {
    const existingBrands = await Brand.find({ brandId: /^BRD-\d+$/ }, { brandId: 1 });
    let maxNum = 100;
    existingBrands.forEach(b => {
      const match = b.brandId?.match(/^BRD-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });

    let nextNum = maxNum + 1;
    let brandId = `BRD-${nextNum}`;
    while (await Brand.exists({ brandId })) {
      nextNum++;
      brandId = `BRD-${nextNum}`;
    }

    const barterCount = targetBarterCollabs !== undefined ? Number(targetBarterCollabs) : (brandType === 'New' ? 8 : 7);
    const paidCount = targetPaidCollabs !== undefined ? Number(targetPaidCollabs) : (brandType === 'New' ? 2 : 3);
    const totalCount = barterCount + paidCount;

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
      brandType,
      targetBarterCollabs: barterCount,
      targetPaidCollabs: paidCount,
      targetTotalCollabs: totalCount,
      status: 'Active'
    });

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'System',
      action: 'CREATE_BRAND',
      module: 'Brand Management',
      entity: 'Brand',
      entityId: (brand._id as any).toString(),
      newValue: { brandId, brandName, industry, brandType }
    });

    return res.status(200).json({ success: true, message: 'Brand created successfully', data: brand });
  } catch (error: any) {
    console.error('Failed to create brand:', error);
    return res.status(500).json({ 
      success: false, 
      message: error?.message || 'Failed to create brand', 
      error: error?.errmsg || error 
    });
  }
});

// PUT /api/v1/brands/:id
router.put('/:id', authenticateToken, checkPermission('brand.update'), async (req: AuthRequest, res: Response) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: 'No record exists for this brand' });

    const oldValue = { ...brand.toObject() };
    Object.assign(brand, req.body);

    if (req.body.targetBarterCollabs !== undefined || req.body.targetPaidCollabs !== undefined) {
      brand.targetTotalCollabs = (brand.targetBarterCollabs || 0) + (brand.targetPaidCollabs || 0);
    }

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

    return res.status(200).json({ success: true, message: 'Brand updated successfully', data: brand });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update brand', error });
  }
});

// DELETE /api/v1/brands/:id
router.delete('/:id', authenticateToken, checkPermission('brand.delete'), async (req: AuthRequest, res: Response) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: 'No record exists for this brand' });

    await EmployeeBrand.deleteMany({ brandId: req.params.id });

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'System',
      action: 'DELETE_BRAND',
      module: 'Brand Management',
      entity: 'Brand',
      entityId: req.params.id,
      oldValue: brand.toObject()
    });

    return res.status(200).json({ success: true, message: 'Brand deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete brand', error });
  }
});

export default router;
