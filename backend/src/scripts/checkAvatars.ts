import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { InfluencerDirectory } from '../models/allModels';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const check = async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
  const items = await InfluencerDirectory.find({
    instagramHandle: { $in: ['@bhartigurnani_', '@lifewidsimmi', '@tanisshaa.09', '@kajaaaal__'] }
  }).lean();

  console.log('AVATAR VALUES IN MONGO ATLAS:', items.map((i: any) => ({
    handle: i.instagramHandle,
    name: i.name,
    avatar: i.avatar
  })));

  await mongoose.disconnect();
};

check();
