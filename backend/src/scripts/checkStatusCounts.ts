import dotenv from 'dotenv';
import path from 'path';
import mongoose from 'mongoose';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function checkStatus() {
  await mongoose.connect(process.env.MONGODB_URI || '');
  console.log('Connected to MongoDB');

  const Influencer = mongoose.model('Influencer', new mongoose.Schema({}, { strict: false }), 'influencers');

  const barters = await Influencer.find({ category: 'Barter' }, 'sNo brandName influencerManager status isApproved');
  
  const counts: Record<string, number> = {};
  barters.forEach((b: any) => {
    const st = b.status || 'Blank';
    counts[st] = (counts[st] || 0) + 1;
  });

  console.log('\n--- BARTER STATUS DISTRIBUTION ---');
  console.log(counts);

  console.log('\n--- SAMPLE 10 RECORDS ---');
  barters.slice(0, 10).forEach((b: any, idx: number) => {
    console.log(`[${idx+1}] Brand: "${b.brandName}", Manager: "${b.influencerManager}", Status: "${b.status}", Approved: ${b.isApproved}`);
  });

  await mongoose.disconnect();
}

checkStatus().catch(console.error);
