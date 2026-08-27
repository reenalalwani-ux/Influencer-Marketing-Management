import { Router, Request, Response } from 'express';
import { InfluencerDirectory, Influencer } from '../models/allModels';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logActivity } from '../middleware/auditLog';
import { scrapeInstagramProfile } from '../services/instagramMetadataScraper';

const router = Router();

// ─────────────────────────────────────────────
// RapidAPI Instagram Helpers
// ─────────────────────────────────────────────

/** Format a RapidAPI user search result into our DiscoveredInfluencer shape */
const formatRapidApiSearchResult = (u: any, category: string): any => {
  const handle = (u.username || '').toLowerCase().replace(/^@/, '');
  const followers = u.followerCount || 0;
  const engRate = followers > 0 ? parseFloat((Math.min(9.5, Math.max(1.8, (100000 / (followers + 5000)) * 4.2))).toFixed(2)) : 4.2;
  const catLabel = u.categoryName || category || 'Fashion';

  return {
    instagramHandle: `@${handle}`,
    name: u.fullName || handle,
    avatar: u.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(handle)}&background=7c3aed&color=fff`,
    category: catLabel,
    nicheTags: [catLabel, 'Reels Creator'],
    followersCount: followers,
    followingCount: u.followingCount || 0,
    postsCount: u.mediaCount || 0,
    engagementRate: engRate,
    avgLikes: Math.round(followers * (engRate / 100)),
    avgComments: Math.round(followers * (engRate / 100) * 0.08),
    bio: u.biography || '',
    location: 'India',
    email: '',
    phone: '',
    profileLink: `https://instagram.com/${handle}`,
    isVerified: u.isVerified || false,
    estRatePerPost: followers >= 1000000 ? '₹2L - ₹5L' :
                    followers >= 500000 ? '₹80K - ₹2L' :
                    followers >= 100000 ? '₹25K - ₹80K' :
                    followers >= 50000 ? '₹10K - ₹25K' : '₹5K - ₹10K',
    recentPosts: []
  };
};

// ─────────────────────────────────────────────
// Handle sanitizer
// ─────────────────────────────────────────────

const sanitizeInstagramHandle = (raw: string): string | null => {
  if (!raw || !raw.trim()) return null;
  let str = raw.trim();

  if (str.toLowerCase().includes('creator')) return null;

  if (str.includes('/reel/') || str.includes('/p/')) {
    const match = str.match(/instagram\.com\/([^\/]+)\/(?:reel|p)\//i);
    if (match && match[1] && !['reel', 'p', 'explore', 'reels'].includes(match[1].toLowerCase())) {
      str = match[1];
    } else {
      return null;
    }
  } else if (str.startsWith('http://') || str.startsWith('https://')) {
    const cleanUrl = str.split('?')[0];
    const parts = cleanUrl.split('/').filter(Boolean);
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i].toLowerCase();
      if (!['reels', 'reel', 'p', 'explore', 'instagram.com', 'www.instagram.com', 'http:', 'https:'].includes(part)) {
        str = part;
        break;
      }
    }
  }

  const clean = str.replace(/^@/, '').replace(/[\s#]+/g, '').trim().toLowerCase();
  if (!clean || clean.length < 2 || clean.includes('http') || clean.includes('/') || clean.includes('creator')) {
    return null;
  }
  return clean;
};

// ─────────────────────────────────────────────
// Avatar helper (ui-avatars fallback only)
// ─────────────────────────────────────────────

const getInitialsAvatar = (name: string, handle?: string): string => {
  const label = name || handle || 'Creator';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(label)}&background=7c3aed&color=fff&size=200&bold=true`;
};

// ─────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────

// GET /api/v1/influencer-directory (Fetch stored directory with auto-sync from past collabs)
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { category, minFollowers, maxFollowers, search, status, rating, page = 1, limit = 12, forceSync } = req.query;

    const totalInDir = await InfluencerDirectory.countDocuments();
    const shouldSync = totalInDir === 0 || forceSync === 'true';

    // AUTO-SYNC: Import unique influencers from past collab records
    if (shouldSync) {
      try {
        const pastCollabRecords = await Influencer.find({}).lean();

        const groupedMap = new Map<string, Array<any>>();
        pastCollabRecords.forEach(rec => {
          const rawHandle = rec.influencerInstagramId || rec.influencerName || '';
          if (!rawHandle || !rawHandle.trim()) return;
          const key = rawHandle.trim().replace(/^@/, '').replace(/\s+/g, '').toLowerCase();
          if (!key) return;
          if (!groupedMap.has(key)) groupedMap.set(key, []);
          groupedMap.get(key)!.push(rec);
        });

        for (const [key, records] of groupedMap.entries()) {
          const firstRec = records[0];
          const cleanKey = sanitizeInstagramHandle(key || firstRec.influencerInstagramId || firstRec.influencerName);
          if (!cleanKey) continue;

          const formattedHandle = `@${cleanKey}`;
          let displayName = (firstRec.influencerName && firstRec.influencerName.trim()) ? firstRec.influencerName.trim() : cleanKey;
          if (displayName.startsWith('http') || displayName.includes('instagram.com')) {
            const parts = displayName.split('?')[0].split('/').filter(Boolean);
            const handlePart = parts.pop() || cleanKey;
            displayName = handlePart.replace(/[-_.]/g, ' ').replace(/\s+/g, ' ').trim();
            displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
          }

          const phone = records.find((r: any) => r.phone && r.phone.trim())?.phone || '';
          let rawLink = records.find((r: any) => r.profileLink && r.profileLink.trim())?.profileLink || '';
          if (rawLink && (rawLink.includes(' ') || rawLink.includes('%20'))) {
            rawLink = rawLink.replace(/\s+/g, '').replace(/%20/g, '');
          }
          const profileLink = (rawLink && rawLink.startsWith('http')) ? rawLink : `https://instagram.com/${cleanKey}`;
          const collabsCount = records.length;

          let dirDoc = await InfluencerDirectory.findOne({
            $or: [
              { instagramHandle: new RegExp(`^@?${cleanKey}$`, 'i') },
              { name: new RegExp(`^${displayName.trim()}$`, 'i') }
            ]
          });

          if (!dirDoc) {
            try {
              await InfluencerDirectory.create({
                instagramHandle: formattedHandle,
                name: displayName,
                avatar: getInitialsAvatar(displayName, cleanKey),
                category: firstRec.category === 'Barter' || firstRec.category === 'Paid' ? 'Fashion' : (firstRec.category || 'Fashion'),
                followersCount: 0,
                engagementRate: 0,
                phone,
                profileLink,
                status: 'Available',
                rating: 5,
                source: 'Past Collab',
                pastCollabsCount: collabsCount,
                notes: `Worked on ${collabsCount} ${firstRec.category || ''} collabs (Latest Brand: ${firstRec.brandName || 'N/A'})`
              });
            } catch (createErr: any) {
              // Ignore duplicate handle errors silently
            }
          } else {
            let updated = false;
            if (dirDoc.name.startsWith('http') || dirDoc.name.includes('instagram.com')) {
              dirDoc.name = displayName;
              updated = true;
            }
            if ((dirDoc.pastCollabsCount || 0) < collabsCount) {
              dirDoc.pastCollabsCount = collabsCount;
              updated = true;
            }
            if (!dirDoc.phone && phone) {
              dirDoc.phone = phone;
              updated = true;
            }
            if (updated) await dirDoc.save();
          }
        }
      } catch (syncErr) {
        console.error('[InfluencerDirectory] Auto-sync past collabs error:', syncErr);
      }
    }

    // Query with filters
    const filter: any = {};
    if (category && category !== 'All') filter.category = category;
    if (status && status !== 'All') filter.status = status;
    if (rating) filter.rating = { $gte: Number(rating) };
    if (minFollowers || maxFollowers) {
      filter.followersCount = {};
      if (minFollowers) filter.followersCount.$gte = Number(minFollowers);
      if (maxFollowers) filter.followersCount.$lte = Number(maxFollowers);
    }
    if (search && typeof search === 'string' && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { instagramHandle: searchRegex },
        { bio: searchRegex },
        { location: searchRegex },
        { nicheTags: { $in: [searchRegex] } }
      ];
    }

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [items, total, collabCounts] = await Promise.all([
      InfluencerDirectory.find(filter)
        .sort({ pastCollabsCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      InfluencerDirectory.countDocuments(filter),
      Influencer.aggregate([
        {
          $group: {
            _id: { $toLower: { $ifNull: ['$influencerInstagramId', '$influencerName'] } },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const countMap = new Map<string, number>();
    collabCounts.forEach((c: any) => {
      if (c._id) {
        const key = String(c._id).replace(/^@/, '').replace(/\s+/g, '').toLowerCase();
        countMap.set(key, c.count);
      }
    });

    const enhancedItems = items.map((item) => {
      const cleanKey = (item.instagramHandle || item.name || '').replace(/^@/, '').replace(/\s+/g, '').toLowerCase();
      const liveCount = countMap.get(cleanKey) || 0;
      const pastCollabs = Math.max(item.pastCollabsCount || 0, liveCount);

      // Clean display name if raw URL string stored previously
      let cleanName = item.name || cleanKey;
      if (!cleanName || cleanName.startsWith('http') || cleanName.toLowerCase().includes('instagram.com') || cleanName.toLowerCase().includes('reel')) {
        const raw = item.instagramHandle ? item.instagramHandle.replace(/^@/, '') : cleanKey;
        const clean = (raw || 'Creator').split('?')[0].split('/').filter(Boolean).pop() || 'Creator';
        const formatted = clean.replace(/[\-_.]/g, ' ').replace(/\s+/g, ' ').trim();
        cleanName = formatted ? (formatted.charAt(0).toUpperCase() + formatted.slice(1)) : 'Creator';
      }

      // Clean Instagram profile URL without tracking params
      const profileLink = `https://www.instagram.com/${cleanKey}/`;

      return {
        ...item,
        name: cleanName,
        profileLink,
        followersCount: item.followersCount || 0,
        engagementRate: item.engagementRate || 0,
        pastCollabsCount: pastCollabs
      };
    });

    res.json({
      success: true,
      items: enhancedItems,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Error fetching influencer directory:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch directory' });
  }
});

// POST /api/v1/influencer-directory/sync-live-instagram
// Syncs all creators in the DB with real followers, names, and avatars directly from Instagram
router.post('/sync-live-instagram', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const allItems = await InfluencerDirectory.find({});
    let updatedCount = 0;
    const batchSize = 4;

    for (let i = 0; i < allItems.length; i += batchSize) {
      const batch = allItems.slice(i, i + batchSize);

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
            }
          } catch (itemErr: any) {
            console.error(`[IG Scraper Sync] Error for @${doc.instagramHandle}:`, itemErr.message);
          }
        })
      );

      if (i + batchSize < allItems.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'System User',
      userRole: req.user?.role,
      action: 'SYNC_LIVE_INSTAGRAM',
      module: 'InfluencerDirectory',
      entity: 'InfluencerDirectory',
      entityId: 'ALL',
      details: `Synced live Instagram metadata (followers, names, avatars) for ${updatedCount} creators`
    });

    res.json({
      success: true,
      message: `✅ Successfully fetched live Instagram data for ${updatedCount} creator(s)!`,
      updatedCount
    });
  } catch (err: any) {
    console.error('Error syncing Instagram data:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to sync Instagram data' });
  }
});

// POST /api/v1/influencer-directory/reset-old-data
// Clears old fake follower/engagement data so live Instagram API sync can write correct values
router.post('/reset-old-data', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    // Reset followers to 0 and engagement to 0 for ALL records so old fake values are cleared
    const result = await InfluencerDirectory.updateMany(
      {},
      {
        $set: {
          followersCount: 0,
          engagementRate: 0,
          avgLikes: 0,
          avgComments: 0
        }
      }
    );

    console.log(`[Reset] Cleared fake data for ${result.modifiedCount} influencer records`);

    res.json({
      success: true,
      message: `🗑️ Cleared old follower data for ${result.modifiedCount} creators. Now click "Sync Live IG Data" to fetch real data.`,
      modifiedCount: result.modifiedCount
    });
  } catch (err: any) {
    console.error('Error resetting old data:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to reset data' });
  }
});

// POST /api/v1/influencer-directory (Add / Save influencer to DB)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const {
      instagramHandle, name, avatar, category, nicheTags, followersCount, followingCount,
      postsCount, engagementRate, avgLikes, avgComments, bio, location, email, phone,
      profileLink, isVerified, status, rating, notes, source, modashUserId
    } = req.body;

    if (!instagramHandle || !name) {
      return res.status(400).json({ success: false, message: 'Instagram handle and Name are required' });
    }

    const cleanHandle = instagramHandle.trim().replace(/^@/, '');
    let existing = await InfluencerDirectory.findOne({ instagramHandle: new RegExp(`^@?${cleanHandle}$`, 'i') });

    if (existing) {
      existing.name = name || existing.name;
      if (avatar) existing.avatar = avatar;
      if (category) existing.category = category;
      if (nicheTags) existing.nicheTags = nicheTags;
      if (followersCount !== undefined) existing.followersCount = Number(followersCount);
      if (followingCount !== undefined) existing.followingCount = Number(followingCount);
      if (postsCount !== undefined) existing.postsCount = Number(postsCount);
      if (engagementRate !== undefined) existing.engagementRate = Number(engagementRate);
      if (avgLikes !== undefined) existing.avgLikes = Number(avgLikes);
      if (avgComments !== undefined) existing.avgComments = Number(avgComments);
      if (bio !== undefined) existing.bio = bio;
      if (location !== undefined) existing.location = location;
      if (email !== undefined) existing.email = email;
      if (phone !== undefined) existing.phone = phone;
      if (profileLink !== undefined) existing.profileLink = profileLink;
      if (isVerified !== undefined) existing.isVerified = Boolean(isVerified);
      if (status) existing.status = status;
      if (rating !== undefined) existing.rating = Number(rating);
      if (notes !== undefined) existing.notes = notes;
      if (modashUserId) (existing as any).modashUserId = modashUserId;

      await existing.save();

      await logActivity({
        userId: req.user?._id,
        userName: req.user?.name || 'System User',
        userRole: req.user?.role,
        action: 'UPDATE_INFLUENCER_DIRECTORY',
        module: 'InfluencerDirectory',
        entity: 'InfluencerDirectory',
        entityId: existing._id.toString(),
        details: `Updated influencer @${cleanHandle}`
      });

      return res.json({ success: true, message: `Influencer @${cleanHandle} updated!`, influencer: existing });
    }

    // Automatically fetch live Instagram metadata if followers/avatar are missing
    let liveProfile: any = null;
    try {
      liveProfile = await scrapeInstagramProfile(cleanHandle);
    } catch (scrapeErr) {
      console.warn(`[Create Influencer] Could not scrape IG profile for @${cleanHandle}:`, scrapeErr);
    }

    const finalName = (liveProfile && liveProfile.fullName && liveProfile.fullName !== cleanHandle)
      ? liveProfile.fullName
      : name.trim();

    const finalAvatar = (liveProfile && liveProfile.avatar && liveProfile.avatar.startsWith('http'))
      ? liveProfile.avatar
      : (avatar || getInitialsAvatar(name.trim(), cleanHandle));

    const finalFollowers = (liveProfile && liveProfile.followersCount > 0)
      ? liveProfile.followersCount
      : (Number(followersCount) || 0);

    const finalEngagement = (liveProfile && liveProfile.engagementRate > 0)
      ? liveProfile.engagementRate
      : (Number(engagementRate) || 0);

    const newInfluencer = new InfluencerDirectory({
      instagramHandle: `@${cleanHandle}`,
      name: finalName,
      avatar: finalAvatar,
      category: category || 'Fashion',
      nicheTags: nicheTags || [category || 'Fashion'],
      followersCount: finalFollowers,
      followingCount: liveProfile?.followingCount || Number(followingCount) || 0,
      postsCount: liveProfile?.postsCount || Number(postsCount) || 0,
      engagementRate: finalEngagement,
      avgLikes: liveProfile?.avgLikes || Number(avgLikes) || 0,
      avgComments: liveProfile?.avgComments || Number(avgComments) || 0,
      bio: liveProfile?.biography || bio || '',
      location: location || 'India',
      email: email || '',
      phone: phone || '',
      profileLink: `https://www.instagram.com/${cleanHandle}/`,
      isVerified: liveProfile?.isVerified || Boolean(isVerified),
      status: status || 'Available',
      rating: Number(rating) || 5,
      notes: notes || '',
      source: source || 'Manual Add',
      modashUserId,
      createdBy: req.user?._id
    });

    await newInfluencer.save();

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'System User',
      userRole: req.user?.role,
      action: 'CREATE_INFLUENCER_DIRECTORY',
      module: 'InfluencerDirectory',
      entity: 'InfluencerDirectory',
      entityId: newInfluencer._id.toString(),
      details: `Saved new influencer @${cleanHandle}`
    });

    res.status(201).json({
      success: true,
      message: `Influencer @${cleanHandle} saved to directory!`,
      influencer: newInfluencer
    });
  } catch (error: any) {
    console.error('Error saving influencer:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to save influencer' });
  }
});

// PUT /api/v1/influencer-directory/:id (Update saved influencer)
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const item = await InfluencerDirectory.findByIdAndUpdate(id, req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Influencer not found' });

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'System User',
      userRole: req.user?.role,
      action: 'UPDATE_INFLUENCER_DIRECTORY',
      module: 'InfluencerDirectory',
      entity: 'InfluencerDirectory',
      entityId: id,
      details: `Updated influencer ${item.name}`
    });

    res.json({ success: true, message: 'Influencer updated successfully', influencer: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to update' });
  }
});

// DELETE /api/v1/influencer-directory/:id
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const item = await InfluencerDirectory.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ success: false, message: 'Influencer not found' });

    await logActivity({
      userId: req.user?._id,
      userName: req.user?.name || 'System User',
      userRole: req.user?.role,
      action: 'DELETE_INFLUENCER_DIRECTORY',
      module: 'InfluencerDirectory',
      entity: 'InfluencerDirectory',
      entityId: id,
      details: `Deleted influencer ${item.name}`
    });

    res.json({ success: true, message: 'Influencer removed from directory' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Failed to delete' });
  }
});

// POST /api/v1/influencer-directory/discover
// Currently paused - returns empty result set
router.post('/discover', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { category = 'All', page = 1, pageSize = 12 } = req.body;
    res.json({
      success: true,
      category,
      totalCount: 0,
      pagination: {
        page: Number(page) || 1,
        pageSize: Number(pageSize) || 12,
        totalItems: 0,
        totalPages: 1
      },
      influencers: [],
      source: 'Database'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Discovery search error'
    });
  }
});

export default router;
