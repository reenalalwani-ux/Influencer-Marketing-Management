import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User, Employee, Role } from '../models/allModels';

dotenv.config();

const verifyAndSeedDB = async () => {
  const uri = process.env.MONGODB_URI;
  console.log('[VerifyDB] Connecting to MongoDB Atlas Cloud Database...');

  try {
    await mongoose.connect(uri!);
    console.log('[VerifyDB] Connected to MongoDB Atlas Cloud!');

    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const managerPassword = await bcrypt.hash('Manager@123', 10);

    // 1. Permanently Save/Update Super Admin in Cloud DB
    let admin = await User.findOne({ email: 'admin@influencer.com' });
    if (!admin) {
      admin = await User.create({
        name: 'Super Admin',
        email: 'admin@influencer.com',
        password: adminPassword,
        role: 'Super Admin',
        employeeId: 'EMP-1000',
        status: 'Active'
      });
      console.log('✅ Created Super Admin (admin@influencer.com) in MongoDB Atlas');
    } else {
      admin.password = adminPassword;
      admin.status = 'Active';
      admin.role = 'Super Admin';
      await admin.save();
      console.log('✅ Super Admin (admin@influencer.com) verified & saved in MongoDB Atlas');
    }

    // 2. Permanently Save/Update Marketing Manager in Cloud DB
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
      console.log('✅ Created Marketing Manager (manager@influencer.com) in MongoDB Atlas');
    } else {
      manager.password = managerPassword;
      manager.status = 'Active';
      manager.role = 'Marketing Manager';
      await manager.save();
      console.log('✅ Marketing Manager (manager@influencer.com) verified & saved in MongoDB Atlas');
    }

    // Ensure Employee record for manager@influencer.com exists
    let managerEmp = await Employee.findOne({ email: 'manager@influencer.com' });
    if (!managerEmp) {
      await Employee.create({
        employeeId: 'EMP-9999',
        userId: manager._id,
        name: 'Vikram Sethi',
        email: 'manager@influencer.com',
        phone: '+91 98765 43210',
        department: 'Marketing Management',
        designation: 'Marketing Manager',
        role: 'Marketing Manager',
        joiningDate: new Date(),
        status: 'Active'
      });
      console.log('✅ Created Employee Profile for manager@influencer.com in Atlas');
    } else {
      console.log('✅ Employee Profile for manager@influencer.com verified in Atlas');
    }

    // List all permanently stored users in Atlas
    const allUsers = await User.find({});
    console.log(`\n=======================================================`);
    console.log(`PERSISTED USERS IN MONGODB ATLAS DB (${allUsers.length} total):`);
    allUsers.forEach(u => console.log(`  • Role: [${u.role}] | Email: ${u.email} | Name: ${u.name}`));
    console.log(`=======================================================\n`);

    process.exit(0);
  } catch (err) {
    console.error('Error verifying DB:', err);
    process.exit(1);
  }
};

verifyAndSeedDB();
