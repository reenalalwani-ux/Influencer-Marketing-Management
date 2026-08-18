import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Employee, User } from '../models/allModels';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { checkPermission } from '../middleware/rbac';
import { logActivity } from '../middleware/auditLog';

const router = Router();

// GET /api/v1/employees
router.get('/', authenticateToken, checkPermission('employee.view'), async (req: AuthRequest, res: Response) => {
  try {
    const employees = await Employee.find().populate('reportingManagerId', 'name employeeId designation').sort({ createdAt: -1 });
    return res.status(200).json({ 
      success: true, 
      count: employees.length, 
      data: employees,
      message: employees.length === 0 ? 'No records found' : 'Employees fetched successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching employees', error });
  }
});

// GET /api/v1/employees/:id
router.get('/:id', authenticateToken, checkPermission('employee.view'), async (req: AuthRequest, res: Response) => {
  try {
    const employee = await Employee.findById(req.params.id).populate('reportingManagerId', 'name employeeId email designation');
    if (!employee) return res.status(404).json({ success: false, message: 'No record exists for this employee' });
    return res.status(200).json({ success: true, data: employee, message: 'Employee fetched successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error fetching employee', error });
  }
});

// POST /api/v1/employees
router.post('/', authenticateToken, checkPermission('employee.create'), async (req: AuthRequest, res: Response) => {
  const { name, email, phone, department, designation, role, reportingManagerId, joiningDate, password } = req.body;

  if (!name || !email || !phone || !department || !designation || !role) {
    return res.status(400).json({ success: false, message: 'Required employee fields missing' });
  }

  if (!email || !email.trim().toLowerCase().endsWith('@ad2ship.com')) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error: Employee work email must use @ad2ship.com domain address.'
    });
  }

  try {
    const existingEmp = await Employee.findOne({ email: email.toLowerCase() });
    if (existingEmp) {
      return res.status(400).json({ success: false, message: 'Employee email already exists' });
    }

    // Auto-generate employeeId
    const count = await Employee.countDocuments();
    const employeeId = `EMP-${1000 + count + 1}`;

    // Create User login account
    const hashedPassword = await bcrypt.hash(password || 'Employee@123', 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      employeeId,
      status: 'Active'
    });

    const employee = await Employee.create({
      employeeId,
      userId: user._id,
      name,
      email: email.toLowerCase(),
      phone,
      department,
      designation,
      role,
      reportingManagerId: reportingManagerId || undefined,
      joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
      status: 'Active'
    });

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'System',
      action: 'CREATE_EMPLOYEE',
      module: 'Employee Management',
      entity: 'Employee',
      entityId: (employee._id as any).toString(),
      newValue: { employeeId, name, email, role, department }
    });

    return res.status(200).json({ success: true, message: 'Employee created successfully', data: employee });
  } catch (error) {
    console.error('Create employee error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create employee', error });
  }
});

// PUT /api/v1/employees/:id
router.put('/:id', authenticateToken, checkPermission('employee.update'), async (req: AuthRequest, res: Response) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: 'No record exists for this employee' });

    const oldValue = { ...employee.toObject() };
    const { name, phone, department, designation, role, reportingManagerId, status } = req.body;

    if (name) employee.name = name;
    if (phone) employee.phone = phone;
    if (department) employee.department = department;
    if (designation) employee.designation = designation;
    if (role) employee.role = role;
    if (reportingManagerId !== undefined) employee.reportingManagerId = reportingManagerId || undefined;
    if (status) employee.status = status;

    await employee.save();

    // Update corresponding user record if role/status/name changed
    await User.findOneAndUpdate(
      { email: employee.email },
      { name: employee.name, role: employee.role, status: employee.status }
    );

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'System',
      action: 'UPDATE_EMPLOYEE',
      module: 'Employee Management',
      entity: 'Employee',
      entityId: (employee._id as any).toString(),
      oldValue,
      newValue: employee.toObject()
    });

    return res.status(200).json({ success: true, message: 'Employee updated successfully', data: employee });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to update employee', error });
  }
});

// DELETE /api/v1/employees/:id
router.delete('/:id', authenticateToken, checkPermission('employee.delete'), async (req: AuthRequest, res: Response) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ success: false, message: 'No record exists for this employee' });

    await User.findOneAndDelete({ email: employee.email });
    await Employee.findByIdAndDelete(req.params.id);

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'System',
      action: 'DELETE_EMPLOYEE',
      module: 'Employee Management',
      entity: 'Employee',
      entityId: req.params.id,
      oldValue: employee.toObject()
    });

    return res.status(200).json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to delete employee', error });
  }
});

export default router;
