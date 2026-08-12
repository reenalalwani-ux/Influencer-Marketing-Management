import bcrypt from 'bcryptjs';
import {
  Permission, Role, User, Employee, Brand, EmployeeBrand,
  Task, Notification, AuditLog, Setting, Target
} from '../models/allModels';
import { PERMISSIONS, ROLE_DEFAULT_PERMISSIONS, ROLES, PLATFORMS, CONTENT_TYPES, TASK_STATUSES, PRIORITIES, DEPARTMENTS, DESIGNATIONS } from '../config/constants';

export const seedDatabase = async () => {
  try {
    // Ensure Super Admin & Manager are ALWAYS persisted in DB
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const managerPassword = await bcrypt.hash('Manager@123', 10);

    let admin = await User.findOne({ email: 'admin@influencer.com' });
    if (!admin) {
      await User.create({
        name: 'Super Admin',
        email: 'admin@influencer.com',
        password: adminPassword,
        role: 'Super Admin',
        employeeId: 'EMP-1000',
        status: 'Active'
      });
      console.log('[Seed] Created Super Admin (admin@influencer.com) in MongoDB Atlas');
    }

    let manager = await User.findOne({ email: 'manager@influencer.com' });
    if (!manager) {
      manager = await User.create({
        name: 'Vikram Sethi',
        email: 'manager@influencer.com',
        password: managerPassword,
        role: 'Marketing Manager',
        employeeId: 'EMP-9999',
        status: 'Active'
      });
      console.log('[Seed] Created Marketing Manager (manager@influencer.com) in MongoDB Atlas');
    }

    // Seed initial active target if none exists
    const targetCount = await Target.countDocuments();
    if (targetCount === 0) {
      await Target.create({
        title: 'August 2026 Influencer Revenue Target',
        targetAmount: 100000,
        achievedAmount: 68500,
        currency: '$',
        period: 'August 2026',
        startDate: new Date('2026-08-01'),
        endDate: new Date('2026-08-31'),
        status: 'Active',
        isActive: true,
        description: 'Monthly influencer campaign revenue target for Q3 2026.',
        createdBy: manager?._id || admin?._id
      });
      console.log('[Seed] Initial Active Target ($100,000) seeded in database.');
    }

    // Always sync permissions & roles so existing database records receive new permissions (e.g. Target Module)
    for (const code of PERMISSIONS) {
      const [moduleName] = code.split('.');
      await Permission.updateOne(
        { code },
        {
          $setOnInsert: {
            code,
            name: code.replace('.', ' ').toUpperCase(),
            module: moduleName.toUpperCase(),
            description: `Permission to execute ${code}`
          }
        },
        { upsert: true }
      );
    }

    for (const [roleName, permissions] of Object.entries(ROLE_DEFAULT_PERMISSIONS)) {
      await Role.updateOne(
        { name: roleName },
        {
          $set: { permissions },
          $setOnInsert: {
            name: roleName,
            description: `Default system role for ${roleName}`,
            isSystemRole: true
          }
        },
        { upsert: true }
      );
    }

    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log(`[Seed] MongoDB Cloud Database connected with ${userCount} active users (Roles & Permissions synced).`);
      return;
    }

    console.log('[Seed] Starting database initialization & seeding...');

    // 1. Seed Permissions
    for (const code of PERMISSIONS) {
      const [moduleName] = code.split('.');
      await Permission.create({
        code,
        name: code.replace('.', ' ').toUpperCase(),
        module: moduleName.toUpperCase(),
        description: `Permission to execute ${code}`
      });
    }

    // 2. Seed Roles
    const roleDocs: Record<string, any> = {};
    for (const [roleName, permissions] of Object.entries(ROLE_DEFAULT_PERMISSIONS)) {
      const r = await Role.create({
        name: roleName,
        description: `Default system role for ${roleName}`,
        permissions,
        isSystemRole: true
      });
      roleDocs[roleName] = r;
    }

    // 3. Seed Password
    const userPassword = await bcrypt.hash('User@123', 10);

    // 4. Seed Users
    const superAdminUser = await User.create({
      name: 'Super Admin',
      email: 'admin@influencer.com',
      password: adminPassword,
      role: ROLES.SUPER_ADMIN,
      employeeId: 'EMP-1000',
      status: 'Active'
    });

    const managerUser = await User.create({
      name: 'Vikram Sethi',
      email: 'manager@influencer.com',
      password: managerPassword,
      role: ROLES.MARKETING_MANAGER,
      employeeId: 'EMP-1001',
      status: 'Active'
    });

    const rahulUser = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul@influencer.com',
      password: userPassword,
      role: ROLES.EMPLOYEE,
      employeeId: 'EMP-1002',
      status: 'Active'
    });

    const priyaUser = await User.create({
      name: 'Priya Patel',
      email: 'priya@influencer.com',
      password: userPassword,
      role: ROLES.EMPLOYEE,
      employeeId: 'EMP-1003',
      status: 'Active'
    });

    const amitUser = await User.create({
      name: 'Amit Verma',
      email: 'amit@influencer.com',
      password: userPassword,
      role: ROLES.EMPLOYEE,
      employeeId: 'EMP-1004',
      status: 'Active'
    });

    // 5. Seed Employees
    const managerEmp = await Employee.create({
      employeeId: 'EMP-1001',
      userId: managerUser._id,
      name: 'Vikram Sethi',
      email: 'manager@influencer.com',
      phone: '+91 98765 43210',
      department: 'Marketing Management',
      designation: 'Marketing Manager',
      role: ROLES.MARKETING_MANAGER,
      joiningDate: new Date('2024-01-15'),
      status: 'Active'
    });

    const rahulEmp = await Employee.create({
      employeeId: 'EMP-1002',
      userId: rahulUser._id,
      name: 'Rahul Sharma',
      email: 'rahul@influencer.com',
      phone: '+91 98765 11111',
      department: 'Influencer Marketing',
      designation: 'Senior Influencer Specialist',
      role: ROLES.EMPLOYEE,
      reportingManagerId: managerEmp._id,
      joiningDate: new Date('2024-03-01'),
      status: 'Active'
    });

    const priyaEmp = await Employee.create({
      employeeId: 'EMP-1003',
      userId: priyaUser._id,
      name: 'Priya Patel',
      email: 'priya@influencer.com',
      phone: '+91 98765 22222',
      department: 'Content Creation',
      designation: 'Content Strategist',
      role: ROLES.EMPLOYEE,
      reportingManagerId: managerEmp._id,
      joiningDate: new Date('2024-04-10'),
      status: 'Active'
    });

    const amitEmp = await Employee.create({
      employeeId: 'EMP-1004',
      userId: amitUser._id,
      name: 'Amit Verma',
      email: 'amit@influencer.com',
      phone: '+91 98765 33333',
      department: 'Influencer Marketing',
      designation: 'Influencer Executive',
      role: ROLES.EMPLOYEE,
      reportingManagerId: managerEmp._id,
      joiningDate: new Date('2024-05-20'),
      status: 'Active'
    });

    // 6. Seed Brands
    const brandNike = await Brand.create({
      brandId: 'BRD-101',
      brandName: 'Nike',
      website: 'https://nike.com',
      industry: 'Sportswear & Athletic Wear',
      contactPerson: 'Sarah Jenkins',
      email: 'sjenkins@nike.com',
      phone: '+1 800 806 6453',
      notes: 'Global sports footwear and apparel brand',
      status: 'Active'
    });

    const brandAdidas = await Brand.create({
      brandId: 'BRD-102',
      brandName: 'Adidas',
      website: 'https://adidas.com',
      industry: 'Sportswear',
      contactPerson: 'Marcus Vance',
      email: 'mvance@adidas.com',
      phone: '+1 800 982 9337',
      notes: 'Three stripes athletics partner',
      status: 'Active'
    });

    const brandPuma = await Brand.create({
      brandId: 'BRD-103',
      brandName: 'Puma',
      website: 'https://puma.com',
      industry: 'Lifestyle & Sports',
      contactPerson: 'Elena Rostova',
      email: 'elena@puma.com',
      phone: '+1 800 555 7862',
      notes: 'Global sports brand focusing on velocity',
      status: 'Active'
    });

    const brandSamsung = await Brand.create({
      brandId: 'BRD-104',
      brandName: 'Samsung',
      website: 'https://samsung.com',
      industry: 'Consumer Electronics & Mobile',
      contactPerson: 'Kenji Sato',
      email: 'kenji@samsung.com',
      phone: '+1 800 726 7864',
      notes: 'Galaxy smartphone and wearables influencer campaigns',
      status: 'Active'
    });

    // 7. Seed Employee-Brand Assignments (`employee_brands`)
    await EmployeeBrand.create({
      employeeId: rahulEmp._id,
      brandId: brandNike._id,
      assignedBy: superAdminUser._id,
      responsibility: 'Lead Influencer Specialist for Nike Reels & Stories',
      priority: 'High',
      status: 'Active'
    });

    await EmployeeBrand.create({
      employeeId: rahulEmp._id,
      brandId: brandAdidas._id,
      assignedBy: superAdminUser._id,
      responsibility: 'Adidas Daily Instagram Postings',
      priority: 'Medium',
      status: 'Active'
    });

    await EmployeeBrand.create({
      employeeId: priyaEmp._id,
      brandId: brandPuma._id,
      assignedBy: superAdminUser._id,
      responsibility: 'Puma YouTube Shorts & Reels Strategy',
      priority: 'High',
      status: 'Active'
    });

    await EmployeeBrand.create({
      employeeId: priyaEmp._id,
      brandId: brandNike._id,
      assignedBy: superAdminUser._id,
      responsibility: 'Nike YouTube Video Campaigns',
      priority: 'Medium',
      status: 'Active'
    });

    await EmployeeBrand.create({
      employeeId: amitEmp._id,
      brandId: brandSamsung._id,
      assignedBy: superAdminUser._id,
      responsibility: 'Samsung Tech Influencer Outreach',
      priority: 'Urgent',
      status: 'Active'
    });

    // 8. Seed Tasks / Daily Postings
    const todayStr = new Date().toISOString().split('T')[0];
    const todayDate = new Date();

    // Today Task 1 (Rahul - Nike Reel) - Submitted / Pending Verification
    await Task.create({
      taskId: 'TSK-10001',
      employeeId: rahulEmp._id,
      brandId: brandNike._id,
      platform: 'Instagram',
      contentType: 'Reel',
      title: 'Nike Air Max Summer Reel Showcase',
      description: 'Publish 30s high-energy outdoor running reel with product tag',
      priority: 'High',
      scheduledDate: todayDate,
      scheduledTime: '10:00 AM',
      deadline: new Date(todayDate.getTime() + 4 * 3600 * 1000),
      status: 'Submitted',
      publishedUrl: 'https://instagram.com/p/C9x81a_nike_running_reel',
      publishedDate: todayDate,
      verificationStatus: 'Pending Verification'
    });

    // Today Task 2 (Rahul - Adidas Story) - Verified
    await Task.create({
      taskId: 'TSK-10002',
      employeeId: rahulEmp._id,
      brandId: brandAdidas._id,
      platform: 'Instagram',
      contentType: 'Story',
      title: 'Adidas Ultraboost Unboxing Story',
      description: 'Swipe-up discount code story series',
      priority: 'Medium',
      scheduledDate: todayDate,
      scheduledTime: '02:00 PM',
      deadline: new Date(todayDate.getTime() + 6 * 3600 * 1000),
      status: 'Verified',
      publishedUrl: 'https://instagram.com/stories/adidas_unboxing_story',
      publishedDate: todayDate,
      verificationStatus: 'Verified',
      verifiedBy: managerUser._id,
      verifiedAt: todayDate,
      comments: 'Great story framing and promo code placement!'
    });

    // Today Task 3 (Priya - Puma Reel) - Pending
    await Task.create({
      taskId: 'TSK-10003',
      employeeId: priyaEmp._id,
      brandId: brandPuma._id,
      platform: 'Instagram',
      contentType: 'Reel',
      title: 'Puma Streetwear Dance Challenge Reel',
      description: 'Choreography showcase reel featuring Puma Nitro shoes',
      priority: 'High',
      scheduledDate: todayDate,
      scheduledTime: '11:00 AM',
      deadline: new Date(todayDate.getTime() + 5 * 3600 * 1000),
      status: 'Pending',
      verificationStatus: 'Unsubmitted'
    });

    // Today Task 4 (Priya - Nike YouTube Short) - Verified
    await Task.create({
      taskId: 'TSK-10004',
      employeeId: priyaEmp._id,
      brandId: brandNike._id,
      platform: 'YouTube',
      contentType: 'Short',
      title: 'Nike Morning Workout Routine Short',
      description: '60s morning athletic mobility session',
      priority: 'Medium',
      scheduledDate: todayDate,
      scheduledTime: '05:00 PM',
      deadline: new Date(todayDate.getTime() + 8 * 3600 * 1000),
      status: 'Verified',
      publishedUrl: 'https://youtube.com/shorts/nike_workout_routine',
      publishedDate: todayDate,
      verificationStatus: 'Verified',
      verifiedBy: managerUser._id,
      verifiedAt: todayDate
    });

    // Tomorrow Task 5 (Amit - Samsung Video)
    const tomorrowDate = new Date(todayDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);

    await Task.create({
      taskId: 'TSK-10005',
      employeeId: amitEmp._id,
      brandId: brandSamsung._id,
      platform: 'YouTube',
      contentType: 'Video',
      title: 'Samsung Galaxy S26 Ultra Camera Test',
      description: 'Comprehensive 4K camera review with influencer tech vloggers',
      priority: 'Urgent',
      scheduledDate: tomorrowDate,
      scheduledTime: '03:00 PM',
      deadline: new Date(tomorrowDate.getTime() + 6 * 3600 * 1000),
      status: 'Pending',
      verificationStatus: 'Unsubmitted'
    });

    // 11. Initial Notifications
    await Notification.create({
      userId: rahulUser._id,
      title: 'Welcome to Influencer System',
      message: 'Your employee profile and brand assignments are ready.',
      type: 'System'
    });

    await Notification.create({
      userId: managerUser._id,
      title: 'Pending URL Verification',
      message: 'Rahul Sharma submitted a published URL for Nike Air Max Reel.',
      type: 'Verification',
      relatedId: 'TSK-10001'
    });

    // 12. Initial Audit Log
    await AuditLog.create({
      userId: superAdminUser._id,
      userName: 'Super Admin',
      action: 'SYSTEM_INITIALIZATION',
      module: 'System',
      entity: 'Database',
      timestamp: new Date()
    });

    // 13. System Settings
    await Setting.create({
      key: 'platforms',
      value: PLATFORMS,
      category: 'System Lookup',
      description: 'Available social media platforms'
    });

    await Setting.create({
      key: 'contentTypes',
      value: CONTENT_TYPES,
      category: 'System Lookup',
      description: 'Supported content types'
    });

    console.log('[Seed] Database successfully populated with initial MVP dataset!');
  } catch (error) {
    console.error('[Seed] Error populating database:', error);
  }
};
