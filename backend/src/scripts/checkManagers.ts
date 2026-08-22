import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function checkData() {
  await mongoose.connect(process.env.MONGODB_URI || '');
  console.log('Connected to MongoDB');

  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }), 'users');
  const Employee = mongoose.model('Employee', new mongoose.Schema({}, { strict: false }), 'employees');
  const Influencer = mongoose.model('Influencer', new mongoose.Schema({}, { strict: false }), 'influencers');

  const users = await User.find({}, 'name email role');
  console.log('\n--- REGISTERED USERS ---');
  users.forEach(u => console.log(`User: "${(u as any).name}", email: ${(u as any).email}, role: ${(u as any).role}`));

  const employees = await Employee.find({}, 'name email department designation');
  console.log('\n--- REGISTERED EMPLOYEES ---');
  employees.forEach(e => console.log(`Employee: "${(e as any).name}", email: ${(e as any).email}`));

  const barters = await Influencer.find({ category: 'Barter' }).limit(30);
  console.log('\n--- SAMPLE BARTER RECORDS (First 30) ---');
  barters.forEach((b: any, i: number) => {
    console.log(`[${i+1}] SNo: ${b.sNo}, Brand: "${b.brandName}", Manager: "${b.influencerManager}", Team: "${b.brandManagerTeam}", Date: ${b.transactionDate}, OrderDate: ${b.orderDate}`);
  });

  await mongoose.disconnect();
}

checkData().catch(console.error);
