import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/db';
import {
  User, Employee, Brand, EmployeeBrand,
  Task, Notification, AuditLog, Influencer,
  PaymentLog, Target
} from '../models/allModels';

export const clearDemoData = async () => {
  try {
    await connectDB();
    console.log('[Clear] Connected to MongoDB. Wiping database collections...');

    // Delete users except Super Admin and Managers
    const deletedUsers = await User.deleteMany({
      role: { $nin: ['Super Admin', 'Admin', 'Marketing Manager', 'Assistant Manager', 'Assistant Marketing Manager', 'Team Leader'] },
      email: { $ne: 'admin@influencer.com' }
    });

    // Clear all entity collections
    const delEmp = await Employee.deleteMany({});
    const delBrand = await Brand.deleteMany({});
    const delEmpBrand = await EmployeeBrand.deleteMany({});
    const delTask = await Task.deleteMany({});
    const delInf = await Influencer.deleteMany({});
    const delPay = await PaymentLog.deleteMany({});
    const delTgt = await Target.deleteMany({});
    const delNotif = await Notification.deleteMany({});
    const delAudit = await AuditLog.deleteMany({});

    console.log('=======================================================');
    console.log('✨ DATABASE SUCCESSFULLY CLEARED! ✨');
    console.log(`- Preserved Manager & Super Admin User accounts`);
    console.log(`- Removed Users (non-managers): ${deletedUsers.deletedCount}`);
    console.log(`- Removed Employees: ${delEmp.deletedCount}`);
    console.log(`- Removed Brands: ${delBrand.deletedCount}`);
    console.log(`- Removed Brand Assignments: ${delEmpBrand.deletedCount}`);
    console.log(`- Removed Tasks & Content: ${delTask.deletedCount}`);
    console.log(`- Removed Influencer Collaborations: ${delInf.deletedCount}`);
    console.log(`- Removed Payment Logs: ${delPay.deletedCount}`);
    console.log(`- Removed Targets: ${delTgt.deletedCount}`);
    console.log('=======================================================');
    process.exit(0);
  } catch (error) {
    console.error('[Clear] Failed to clear database:', error);
    process.exit(1);
  }
};

clearDemoData();
