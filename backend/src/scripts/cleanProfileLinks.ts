import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { InfluencerDirectory } from '../models/allModels';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const cleanAllLinks = async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const items = await InfluencerDirectory.find({});
  let count = 0;

  for (const doc of items) {
    const cleanHandle = doc.instagramHandle.replace(/^@/, '').replace(/\s+/g, '').trim();
    if (cleanHandle) {
      doc.profileLink = `https://www.instagram.com/${cleanHandle}/`;
      await doc.save();
      count++;
    }
  }

  console.log(`🎉 Cleaned profile URLs for ${count} creators in MongoDB Atlas!`);
  await mongoose.disconnect();
};

cleanAllLinks();
