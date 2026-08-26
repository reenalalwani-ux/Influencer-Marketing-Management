import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { InfluencerDirectory } from '../models/allModels';
import { scrapeInstagramProfile } from '../services/instagramMetadataScraper';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const runEnrichment = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI is not defined');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for InfluencerDirectory live metadata enrichment...');

    const allDirectoryItems = await InfluencerDirectory.find({});
    console.log(`Found ${allDirectoryItems.length} stored creators in directory.`);

    let updatedCount = 0;
    const batchSize = 4;

    for (let i = 0; i < allDirectoryItems.length; i += batchSize) {
      const batch = allDirectoryItems.slice(i, i + batchSize);

      await Promise.allSettled(
        batch.map(async (doc) => {
          try {
            const cleanHandle = doc.instagramHandle.replace('@', '').trim();
            if (!cleanHandle) return;

            const profile = await scrapeInstagramProfile(cleanHandle);
            if (profile && profile.followersCount > 0) {
              doc.followersCount = profile.followersCount;
              doc.followingCount = profile.followingCount || doc.followingCount;
              doc.postsCount = profile.postsCount || doc.postsCount;
              doc.engagementRate = profile.engagementRate || doc.engagementRate;
              doc.avgLikes = profile.avgLikes || doc.avgLikes;
              doc.avgComments = profile.avgComments || doc.avgComments;

              if (profile.fullName && profile.fullName !== cleanHandle) {
                doc.name = profile.fullName;
              }
              if (profile.avatar && profile.avatar.startsWith('http')) {
                doc.avatar = profile.avatar;
              }
              if (profile.isVerified) {
                doc.isVerified = true;
              }

              await doc.save();
              updatedCount++;
              console.log(`✅ Refreshed @${cleanHandle}: ${profile.followersCount.toLocaleString()} followers, Name: "${profile.fullName}"`);
            }
          } catch (itemErr: any) {
            console.error(`Error processing @${doc.instagramHandle}:`, itemErr.message);
          }
        })
      );

      if (i + batchSize < allDirectoryItems.length) {
        await new Promise(resolve => setTimeout(resolve, 600));
      }
    }

    console.log(`🎉 Successfully enriched ${updatedCount} influencer profiles with live followers, names, and avatars!`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error('Enrichment error:', err);
    process.exit(1);
  }
};

runEnrichment();
