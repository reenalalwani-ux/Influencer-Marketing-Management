import { Router, Response } from 'express';
import { Role, Permission } from '../models/allModels';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import { PERMISSIONS } from '../config/constants';

const router = Router();

// GET /api/v1/roles
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const roles = await Role.find().sort({ name: 1 });
    return res.json({ success: true, count: roles.length, data: roles });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch roles', error });
  }
});

// GET /api/v1/roles/permissions
router.get('/permissions', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const permissions = await Permission.find().sort({ module: 1, code: 1 });
    return res.json({ success: true, count: permissions.length, data: permissions, availableCodes: PERMISSIONS });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch permissions', error });
  }
});

// POST /api/v1/roles
router.post('/', authenticateToken, checkPermission('settings.update'), async (req: AuthRequest, res: Response) => {
  const { name, description, permissions } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Role name is required' });
  }

  try {
    const existing = await Role.findOne({ name });
    if (existing) return res.status(400).json({ success: false, message: 'Role already exists' });

    const role = await Role.create({
      name,
      description,
      permissions: permissions || [],
      isSystemRole: false
    });

    return res.status(201).json({ success: true, message: 'Role created successfully', data: role });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to create role', error });
  }
});

// PUT /api/v1/roles/:id
router.put('/:id', authenticateToken, checkPermission('settings.update'), async (req: AuthRequest, res: Response) => {
  const { description, permissions } = req.body;

  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found' });

    if (description) role.description = description;
    if (permissions) role.permissions = permissions;
    await role.save();

    return res.json({ success: true, message: 'Role updated successfully', data: role });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update role', error });
  }
});

export default router;
