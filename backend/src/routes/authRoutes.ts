import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, Employee, Role } from '../models/allModels';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth';
import { logActivity } from '../middleware/auditLog';
import { sendOTPEmail } from '../services/emailService';

const router = Router();

const isValidCompanyEmail = (email: string) => {
  return typeof email === 'string' && email.trim().toLowerCase().endsWith('@ad2ship.com');
};

// POST /api/v1/auth/request-otp
router.post('/request-otp', async (req: AuthRequest, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Work email address is required' });
  }

  if (!isValidCompanyEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Access Restricted: Only @ad2ship.com company email addresses are allowed to log in.'
    });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No registered user found with this email address' });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({ success: false, message: 'Your account is deactivated' });
    }

    // Generate 6-digit numeric OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    user.otpCode = otpCode;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    // Send security OTP email to user inbox via Brevo / Resend / Google SMTP
    sendOTPEmail(user.email, otpCode, user.name).catch((err) => {
      console.error('[Background Email Dispatch Error]', err);
    });

    return res.json({
      success: true,
      message: `Security OTP sent to ${user.email}. Please check your email inbox.`,
      email: user.email
    });
  } catch (error: any) {
    console.error('Request OTP error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate OTP' });
  }
});

// POST /api/v1/auth/verify-otp
router.post('/verify-otp', async (req: AuthRequest, res: Response) => {
  const { email, otpCode } = req.body;

  if (!email || !otpCode) {
    return res.status(400).json({ success: false, message: 'Email and OTP code are required' });
  }

  if (!isValidCompanyEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Access Restricted: Only @ad2ship.com company email addresses are allowed.'
    });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.otpCode || user.otpCode !== otpCode.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code. Please try again.' });
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP code has expired. Please request a new one.' });
    }

    // Clear OTP after successful verification
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    const token = generateToken((user._id as any).toString(), user.role);
    const roleDoc = await Role.findOne({ name: user.role });
    const permissions = roleDoc ? roleDoc.permissions : [];
    const employee = await Employee.findOne({ email: user.email });

    await logActivity({
      userId: user._id,
      userName: user.name,
      action: 'LOGIN_OTP_VERIFIED',
      module: 'Authentication',
      entity: 'User',
      entityId: (user._id as any).toString()
    });

    return res.json({
      success: true,
      message: 'OTP verified successfully. Logged in!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: employee ? employee.employeeId : user.employeeId,
        permissions,
        employeeDetails: employee
      }
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ success: false, message: 'Server error during OTP verification' });
  }
});

// POST /api/v1/auth/signup
router.post('/signup', async (req: AuthRequest, res: Response) => {
  const { name, email, password, phone, department, designation, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
  }

  if (!isValidCompanyEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Registration Restricted: Only @ad2ship.com company email addresses can create an account.'
    });
  }

  try {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const assignedRole = role || 'Employee';
    const empCount = await Employee.countDocuments();
    const generatedEmpId = `EMP-${100 + empCount + 1}`;

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: assignedRole,
      employeeId: generatedEmpId,
      status: 'Active'
    });

    const newEmployee = await Employee.create({
      employeeId: generatedEmpId,
      userId: newUser._id,
      name,
      email: email.toLowerCase(),
      phone: phone || '+91 98765 43210',
      department: department || 'Influencer Marketing',
      designation: designation || 'Influencer Executive',
      role: assignedRole,
      joiningDate: new Date(),
      status: 'Active'
    });

    const token = generateToken((newUser._id as any).toString(), newUser.role);
    const roleDoc = await Role.findOne({ name: newUser.role });
    const permissions = roleDoc ? roleDoc.permissions : [];

    await logActivity({
      userId: newUser._id,
      userName: newUser.name,
      action: 'REGISTER',
      module: 'Authentication',
      entity: 'User',
      entityId: (newUser._id as any).toString()
    });

    return res.json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        employeeId: generatedEmpId,
        permissions,
        employeeDetails: newEmployee
      }
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error during signup' });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  if (!isValidCompanyEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Access Restricted: Only @ad2ship.com company email addresses are allowed to log in.'
    });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    const token = generateToken((user._id as any).toString(), user.role);

    // Fetch user role & permissions
    const roleDoc = await Role.findOne({ name: user.role });
    const permissions = roleDoc ? roleDoc.permissions : [];

    // Fetch associated employee record if any
    const employee = await Employee.findOne({ email: user.email });

    await logActivity({
      userId: user._id,
      userName: user.name,
      action: 'LOGIN',
      module: 'Authentication',
      entity: 'User',
      entityId: (user._id as any).toString()
    });

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: employee ? employee.employeeId : user.employeeId,
        permissions,
        employeeDetails: employee
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const roleDoc = await Role.findOne({ name: req.user.role });
  const permissions = roleDoc ? roleDoc.permissions : [];
  const employee = await Employee.findOne({ email: req.user.email });

  return res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      employeeId: employee ? employee.employeeId : req.user.employeeId,
      permissions,
      employeeDetails: employee
    }
  });
});

// PUT /api/v1/auth/profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const { name, phone, department, designation } = req.body;

  try {
    if (name) req.user.name = name;
    await req.user.save();

    let employee = await Employee.findOne({ email: req.user.email });
    if (!employee) {
      employee = await Employee.findOne({ userId: req.user._id });
    }

    if (employee) {
      if (name) employee.name = name;
      if (phone) employee.phone = phone;
      if (department) employee.department = department;
      if (designation) employee.designation = designation;
      await employee.save();
    }

    const roleDoc = await Role.findOne({ name: req.user.role });
    const permissions = roleDoc ? roleDoc.permissions : [];

    await logActivity({
      userId: req.user._id,
      userName: req.user.name,
      action: 'UPDATE_PROFILE',
      module: 'Authentication',
      entity: 'User',
      entityId: (req.user._id as any).toString()
    });

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        employeeId: employee ? employee.employeeId : req.user.employeeId,
        permissions,
        employeeDetails: employee
      }
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// POST /api/v1/auth/change-password
router.post('/change-password', authenticateToken, async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!req.user || !currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new password required' });
  }

  const isMatch = await bcrypt.compare(currentPassword, req.user.password);
  if (!isMatch) {
    return res.status(400).json({ success: false, message: 'Incorrect current password' });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  req.user.password = hashed;
  await req.user.save();

  await logActivity({
    userId: req.user._id,
    userName: req.user.name,
    action: 'CHANGE_PASSWORD',
    module: 'Authentication',
    entity: 'User',
    entityId: (req.user._id as any).toString()
  });

  return res.json({ success: true, message: 'Password updated successfully' });
});

export default router;
