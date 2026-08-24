import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Employee, Role } from '../models/allModels';
import { generateToken, authenticateToken, AuthRequest, COOKIE_NAME, JWT_SECRET } from '../middleware/auth';
import { logActivity } from '../middleware/auditLog';
import { sendOTPEmail, sendManagerApprovalEmail } from '../services/emailService';
import { getEmployeeForAuthUser } from '../utils/employeeHelper';

const router = Router();

// Cookie options — secure:true only in production (HTTPS)
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? ('none' as const) : ('lax' as const),
  maxAge: 24 * 60 * 60 * 1000
};


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
      return res.status(404).json({ success: false, message: 'No registered user found with this email address. Please sign up first.' });
    }

    const isManagerRole = ['Super Admin', 'Admin', 'Marketing Manager', 'Assistant Manager', 'Assistant Marketing Manager'].includes(user.role);

    if (user.status === 'Active' || isManagerRole) {
      // Mark email as verified on OTP login so future manager lookups include this user
      let changed = false;
      if (!user.isApproved || user.status !== 'Active') {
        user.isApproved = true;
        user.status = 'Active';
        changed = true;
        await Employee.findOneAndUpdate({ email: user.email }, { isApproved: true, status: 'Active' });
      }
      if (!user.emailVerified) {
        user.emailVerified = true;
        changed = true;
      }
      if (changed) await user.save();
    } else if (user.status === 'Pending Verification') {
      // User signed up but hasn't verified their email OTP yet — redirect them to sign-up OTP step
      return res.status(403).json({
        success: false,
        status: 'Pending Verification',
        message: 'Please verify your email first. Check your inbox for the verification OTP sent during sign-up.'
      });
    } else if (user.status === 'Pending Approval' || !user.isApproved) {
      return res.status(403).json({
        success: false,
        status: 'Pending Approval',
        message: 'Your email address is verified, but your account is awaiting Manager approval. Please contact your Manager.'
      });
    }

    if (user.status === 'Inactive') {
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

    return res.status(200).json({
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
      return res.status(404).json({ success: false, message: 'No record exists for this user account' });
    }

    const isManagerRole = ['Super Admin', 'Admin', 'Marketing Manager', 'Assistant Manager', 'Assistant Marketing Manager'].includes(user.role);

    if (user.status === 'Active' || isManagerRole) {
      // Mark email as verified (so future manager email lookups include this user)
      let changed = false;
      if (!user.isApproved || user.status !== 'Active') {
        user.isApproved = true;
        user.status = 'Active';
        changed = true;
        await Employee.findOneAndUpdate({ email: user.email }, { isApproved: true, status: 'Active' });
      }
      if (!user.emailVerified) {
        user.emailVerified = true;
        changed = true;
      }
      if (changed) await user.save();
    } else if (user.status === 'Pending Approval' || !user.isApproved) {
      return res.status(403).json({
        success: false,
        status: 'Pending Approval',
        message: 'Your email address is verified, but your account is awaiting Manager approval.'
      });
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

    // Save token to database
    user.activeToken = token;
    user.tokenIssuedAt = new Date();
    await user.save();

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

    // Set JWT as HttpOnly cookie
    res.cookie(COOKIE_NAME, token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully. Logged in!',
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

// POST /api/v1/auth/signup (Passwordless Sign Up Request & OTP Generation)
router.post('/signup', async (req: AuthRequest, res: Response) => {
  const { name, email, phone, department, designation } = req.body;

  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Full name and company email address are required' });
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
      if (existingUser.isApproved && existingUser.status === 'Active') {
        return res.status(400).json({
          success: false,
          message: 'Account already registered and active. Please log in with OTP.'
        });
      }

      if (existingUser.status === 'Pending Approval' || (existingUser.emailVerified && !existingUser.isApproved)) {
        return res.status(200).json({
          success: true,
          status: 'Pending Approval',
          message: 'Email address verified! Your account registration request is currently awaiting Manager approval.'
        });
      }

      // Re-send OTP if pending verification
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      existingUser.otpCode = otpCode;
      existingUser.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
      await existingUser.save();

      sendOTPEmail(existingUser.email, otpCode, existingUser.name).catch((err) => {
        console.error('[Background Email Dispatch Error]', err);
      });

      return res.status(200).json({
        success: true,
        message: `OTP sent to ${existingUser.email}. Please verify your email to submit for Manager approval.`,
        email: existingUser.email,
        status: 'Pending Verification'
      });
    }

    // Auto-generate Employee ID
    const existingEmps = await Employee.find({ employeeId: /^EMP-\d+$/ }, { employeeId: 1 });
    let maxEmpNum = 1000;
    existingEmps.forEach(e => {
      const match = e.employeeId?.match(/^EMP-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxEmpNum) maxEmpNum = num;
      }
    });
    let nextEmpNum = maxEmpNum + 1;
    let generatedEmpId = `EMP-${nextEmpNum}`;
    while (await Employee.exists({ employeeId: generatedEmpId })) {
      nextEmpNum++;
      generatedEmpId = `EMP-${nextEmpNum}`;
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      role: 'Employee',
      employeeId: generatedEmpId,
      status: 'Pending Verification',
      emailVerified: false,
      isApproved: false,
      otpCode,
      otpExpiresAt
    });

    await Employee.create({
      employeeId: generatedEmpId,
      userId: newUser._id,
      name,
      email: email.toLowerCase(),
      phone: phone || '+91 98765 43210',
      department: department || 'Influencer Marketing',
      designation: designation || 'Influencer Executive',
      role: 'Employee',
      joiningDate: new Date(),
      status: 'Pending Verification',
      emailVerified: false,
      isApproved: false
    });

    sendOTPEmail(newUser.email, otpCode, newUser.name).catch((err) => {
      console.error('[Background Email Dispatch Error]', err);
    });

    return res.status(200).json({
      success: true,
      message: `OTP sent to ${newUser.email}. Please verify to complete account registration request.`,
      email: newUser.email,
      status: 'Pending Verification'
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error during signup' });
  }
});

// POST /api/v1/auth/verify-signup-otp (Verifies OTP & Submits to Manager for Approval)
router.post('/verify-signup-otp', async (req: AuthRequest, res: Response) => {
  const { email, otpCode } = req.body;

  if (!email || !otpCode) {
    return res.status(400).json({ success: false, message: 'Email and OTP code are required' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No registration request found for this email address' });
    }

    if (!user.otpCode || user.otpCode !== otpCode.trim()) {
      return res.status(400).json({ success: false, message: 'Invalid OTP code. Please try again.' });
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ success: false, message: 'OTP code has expired. Please request a new OTP.' });
    }

    // Mark email as verified and account as awaiting Manager approval
    user.emailVerified = true;
    user.status = 'Pending Approval';
    user.isApproved = false;
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    const empRecord = await Employee.findOneAndUpdate(
      { email: user.email },
      { emailVerified: true, status: 'Pending Approval', isApproved: false },
      { new: true }
    );

    // Find REAL Marketing Managers to notify (by role + status, excluding dummy seed emails)
    const DUMMY_SEED_EMAILS = ['admin@ad2ship.com', 'manager@ad2ship.com', 'manager@influencer.com', 'admin@influencer.com'];

    // Auto-mark any active Marketing Manager as emailVerified (handles pre-existing accounts)
    await User.updateMany(
      { role: { $regex: /^marketing manager$/i }, status: 'Active', email: { $nin: DUMMY_SEED_EMAILS } },
      { $set: { emailVerified: true } }
    );

    const managerUsers = await User.find({
      role: { $regex: /^marketing manager$/i },
      status: 'Active',
      email: { $nin: DUMMY_SEED_EMAILS }
    });

    const managerEmails = managerUsers
      .map(m => m.email.toLowerCase().trim())
      .filter(email => !DUMMY_SEED_EMAILS.includes(email));

    console.log(`[Manager Email Dispatch] Found ${managerEmails.length} manager(s) to notify:`, managerEmails);

    if (managerEmails.length > 0) {
      sendManagerApprovalEmail(managerEmails, {
        name: user.name,
        email: user.email,
        phone: empRecord?.phone,
        department: empRecord?.department
      }).catch(err => {
        console.error('[Manager Email Background Error]', err);
      });
    } else {
      console.warn('[Manager Email Dispatch] No active Marketing Managers found to notify!');
    }

    await logActivity({
      userId: user._id,
      userName: user.name,
      action: 'REGISTER_EMAIL_VERIFIED',
      module: 'Authentication',
      entity: 'User',
      entityId: (user._id as any).toString()
    });

    return res.status(200).json({
      success: true,
      status: 'Pending Approval',
      message: 'Email address verified successfully! Your account registration request has been submitted to the Manager for approval.'
    });
  } catch (error: any) {
    console.error('Verify signup OTP error:', error);
    return res.status(500).json({ success: false, message: 'Server error during signup OTP verification' });
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
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({ success: false, message: 'Account is deactivated' });
    }

    const token = generateToken((user._id as any).toString(), user.role);

    // Save token to database
    user.activeToken = token;
    user.tokenIssuedAt = new Date();
    await user.save();

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

    // Set JWT as HttpOnly cookie
    res.cookie(COOKIE_NAME, token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
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

// POST /api/v1/auth/logout
router.post('/logout', async (req: AuthRequest, res: Response) => {
  const token = req.cookies?.[COOKIE_NAME] || (() => {
    const authHeader = req.headers['authorization'];
    return authHeader && authHeader.split(' ')[1];
  })();

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
      await User.findByIdAndUpdate(decoded.id, { activeToken: null, tokenIssuedAt: null });
    } catch (e) {
      // Ignore token verification errors during logout
    }
  }

  // Clear the HttpOnly cookie — browser deletes it immediately
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// GET /api/v1/auth/me
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const [roleDoc, employee] = await Promise.all([
    Role.findOne({ name: req.user.role }).lean(),
    getEmployeeForAuthUser(req.user)
  ]);
  const permissions = roleDoc ? roleDoc.permissions : [];

  return res.status(200).json({
    success: true,
    message: 'Current user profile fetched successfully',
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

    let employee = await getEmployeeForAuthUser(req.user);

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

    return res.status(200).json({
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

  const isMatch = await bcrypt.compare(currentPassword, req.user.password || '');
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

  return res.status(200).json({ success: true, message: 'Password updated successfully' });
});

export default router;
