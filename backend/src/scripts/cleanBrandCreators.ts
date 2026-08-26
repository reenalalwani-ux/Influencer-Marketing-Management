import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { InfluencerDirectory, Influencer } from '../models/allModels';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const cleanHandleFromUrl = (raw: string): string | null => {
  if (!raw || !raw.trim()) return null;
  let str = raw.trim();

  // If it's an Instagram reel or post link
  if (str.includes('/reel/') || str.includes('/p/')) {
    const match = str.match(/instagram\.com\/([^\/]+)\/(?:reel|p)\//i);
    if (match && match[1] && !['reel', 'p', 'explore', 'reels'].includes(match[1].toLowerCase())) {
      return match[1].toLowerCase();
    }
    return null;
  }

  // If it's a profile URL like https://www.instagram.com/tanisshaa.09/reels/
  if (str.startsWith('http://') || str.startsWith('https://')) {
    const cleanUrl = str.split('?')[0];
    const parts = cleanUrl.split('/').filter(Boolean);
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i].toLowerCase();
      if (!['reels', 'reel', 'p', 'explore', 'instagram.com', 'www.instagram.com', 'http:', 'https:'].includes(part)) {
        return part;
      }
    }
    return null;
  }

  const clean = str.replace(/^@/, '').replace(/[\s#]+/g, '').trim().toLowerCase();
  if (!clean || clean.length < 2 || clean.includes('http') || clean.includes('/') || clean.includes('creator')) {
    return null;
  }
  return clean;
};

const runCleanup = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI is not defined');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for InfluencerDirectory cleanup...');

    // Delete fake brand creator entries
    const deleteRes = await InfluencerDirectory.deleteMany({
      $or: [
        { instagramHandle: { $regex: 'creator', $options: 'i' } },
        { instagramHandle: { $regex: 'http', $options: 'i' } },
        { name: { $regex: 'creator', $options: 'i' } },
        { name: { $regex: 'http', $options: 'i' } }
      ]
    });

    console.log(`🗑️ Deleted ${deleteRes.deletedCount} fake brand creator entries from InfluencerDirectory.`);

    // Import real influencers from past collab records
    const collabRecords = await Influencer.find({}).lean();
    console.log(`Found ${collabRecords.length} total collaboration records.`);

    let importedCount = 0;
    const seenHandles = new Set<string>();

    for (const rec of collabRecords as any[]) {
      const rawHandle = rec.influencerInstagramId || rec.profileLink || rec.influencerName || '';
      const cleanHandle = cleanHandleFromUrl(rawHandle);

      if (!cleanHandle || seenHandles.has(cleanHandle)) continue;
      seenHandles.add(cleanHandle);

      // Check if already in Directory
      const existing = await InfluencerDirectory.findOne({
        instagramHandle: new RegExp(`^@?${cleanHandle}$`, 'i')
      });

      let name = (rec.influencerName && !rec.influencerName.startsWith('http') && !rec.influencerName.toLowerCase().includes('creator'))
        ? rec.influencerName.trim()
        : cleanHandle;

      name = name.charAt(0).toUpperCase() + name.slice(1);

      if (!existing) {
        await InfluencerDirectory.create({
          instagramHandle: `@${cleanHandle}`,
          name,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff&size=200&bold=true`,
          category: rec.category === 'Barter' || rec.category === 'Paid' ? 'Fashion' : (rec.category || 'Fashion'),
          followersCount: 0,
          engagementRate: 0,
          phone: rec.phone || '',
          profileLink: `https://instagram.com/${cleanHandle}`,
          status: 'Available',
          rating: 5,
          source: 'Past Collab',
          pastCollabsCount: 1,
          notes: `Worked on collabs for ${rec.brandName || 'N/A'}`
        });
        importedCount++;
      } else {
        // Fix handle or name if it was dirty
        if (existing.name.startsWith('http') || existing.name.toLowerCase().includes('creator')) {
          existing.name = name;
          await existing.save();
        }
      }
    }

    console.log(`✅ Added/Refreshed ${importedCount} real influencer profiles.`);

    const remaining = await InfluencerDirectory.find({}).lean();
    console.log(`Total clean influencers in Directory: ${remaining.length}`);
    console.log(remaining.map((r: any) => ({ handle: r.instagramHandle, name: r.name })));

    await mongoose.disconnect();
    process.exit(0);
  } catch (err: any) {
    console.error('Cleanup error:', err);
    process.exit(1);
  }
};

runCleanup();
