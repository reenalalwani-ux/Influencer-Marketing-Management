import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from '../config/db';
import {
  User, Employee, Brand, EmployeeBrand,
  Task, Notification, AuditLog
} from '../models/allModels';

export const clearDemoData = async () => {
  try {
    await connectDB();
    console.log('[Clear] Connected to database. Clearing sample demo records...');

    // Delete all sample users except Super Admin (admin@influencer.com)
    await User.deleteMany({ email: { $ne: 'admin@influencer.com' } });

    // Clear all sample entity collections
    await Employee.deleteMany({});
    await Brand.deleteMany({});
    await EmployeeBrand.deleteMany({});
    await Task.deleteMany({});
    await Notification.deleteMany({});
    await AuditLog.deleteMany({});

    console.log('=======================================================');
    console.log('✨ Successfully cleared all sample demo data from MongoDB!');
    console.log('🔑 Preserved Super Admin User: admin@influencer.com');
    console.log('=======================================================');
    process.exit(0);
  } catch (error) {
    console.error('[Clear] Failed to clear demo data:', error);
    process.exit(1);
  }
};

clearDemoData();
