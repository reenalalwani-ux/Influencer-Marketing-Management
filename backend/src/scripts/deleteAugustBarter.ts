import dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { connectDB } from '../config/db';
import { Influencer, Target } from '../models/allModels';

async function deleteAugustBarter() {
  await connectDB();
  console.log('Connected to MongoDB...');

  const startAug = new Date(2026, 7, 1, 0, 0, 0); // Aug 1, 2026
  const endAug = new Date(2026, 7, 31, 23, 59, 59); // Aug 31, 2026

  // Find all Barter records for August
  const filter = {
    category: 'Barter',
    $or: [
      { connectedDate: { $gte: startAug, $lte: endAug } },
      { transactionDate: { $gte: startAug, $lte: endAug } }
    ]
  };

  const toDeleteCount = await Influencer.countDocuments(filter);
  console.log(`Found ${toDeleteCount} August Barter records to delete.`);

  const result = await Influencer.deleteMany(filter);
  console.log(`Successfully deleted ${result.deletedCount} August Barter records!`);

  // Recalculate active Barter Targets
  const activeTargets = await Target.find({ targetType: 'Barter' });
  for (const target of activeTargets) {
    target.achievedAmount = 0;
    target.achievedCount = 0;
    await target.save();
    console.log(`Reset Target "${target.title}" achieved count to 0.`);
  }

  process.exit(0);
}

deleteAugustBarter().catch((err) => {
  console.error('Error deleting August barter records:', err);
  process.exit(1);
});
