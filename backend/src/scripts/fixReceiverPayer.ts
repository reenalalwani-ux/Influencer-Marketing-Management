import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });
import { connectDB } from '../config/db';
import { Influencer } from '../models/allModels';

async function fix() {
  await connectDB();
  const influencers = await Influencer.find({});
  let updated = 0;

  for (const inf of influencers) {
    let rec = inf.moneyReceivedBy || '';
    let pay = inf.paymentDoneBy || '';

    const textToScan = [inf.remark, inf.notes, inf.reason, inf.influencerManager].filter(Boolean).join(' ');

    const recMatch = textToScan.match(/(?:recieved|received|got|in)\s+(?:by\s+)?([a-zA-Z0-9_\s.]+)/i);
    const doneMatch = textToScan.match(/(?:done|paid|given|out|transferred)\s+(?:by\s+)?([a-zA-Z0-9_\s.]+)/i);

    if (recMatch && recMatch[1] && !rec) rec = recMatch[1].trim();
    if (doneMatch && doneMatch[1] && !pay) pay = doneMatch[1].trim();

    if (!rec && !pay && inf.influencerManager) {
      const clean = inf.influencerManager.replace(/^(?:recieved|received|done|paid)\s+by\s+/i, '').replace(/^by\s+/i, '').trim();
      if (clean && clean.length < 30 && !clean.includes('—')) {
        if (inf.brandOnboardingAmt || inf.inAmount) rec = clean;
        if (inf.influencerOnboardingAmt || inf.outAmount) pay = clean;
      }
    }

    if (rec !== inf.moneyReceivedBy || pay !== inf.paymentDoneBy || (inf.influencerManager && (inf.influencerManager.toLowerCase().includes('recie') || inf.influencerManager.toLowerCase().includes('done by')))) {
      inf.moneyReceivedBy = rec;
      inf.paymentDoneBy = pay;

      if (inf.influencerManager && (inf.influencerManager.toLowerCase().includes('recie') || inf.influencerManager.toLowerCase().includes('done by'))) {
        inf.influencerManager = rec || pay || 'Rahul';
      }

      await inf.save();
      updated++;
    }
  }

  console.log(`✅ Fixed ${updated} records with moneyReceivedBy and paymentDoneBy`);
  process.exit(0);
}

fix();
