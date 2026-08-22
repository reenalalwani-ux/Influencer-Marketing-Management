import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function cleanDummy() {
  await mongoose.connect(process.env.MONGODB_URI || '');
  console.log('Connected to MongoDB');
  const Influencer = mongoose.model('Influencer', new mongoose.Schema({}, { strict: false }), 'influencers');
  
  const res = await Influencer.deleteMany({ influencerName: 'Barter Creator' });
  console.log(`Deleted ${res.deletedCount} dummy Barter Creator records.`);

  await mongoose.disconnect();
}

cleanDummy().catch(console.error);
