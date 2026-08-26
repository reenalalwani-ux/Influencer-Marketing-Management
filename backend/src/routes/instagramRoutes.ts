import { Router, Request, Response } from 'express';
import { InfluencerDirectory } from '../models/allModels';

const router = Router();

/**
 * GET /api/instagram/users
 * GET /api/v1/instagram/users
 * Search Database Influencers
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const category = (req.query.category || req.query.query || req.query.search_query || '') as string;
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize || req.query.limit) || 12;

    const dbQuery: any = {};
    if (category && category.trim()) {
      const q = category.trim();
      dbQuery.$or = [
        { name: { $regex: q, $options: 'i' } },
        { instagramHandle: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ];
    }

    const total = await InfluencerDirectory.countDocuments(dbQuery);
    const dbUsers = await InfluencerDirectory.find(dbQuery)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    const realUsers = dbUsers.map((user) => ({
      username: user.instagramHandle.replace('@', ''),
      fullName: user.name,
      followerCount: user.followersCount || 0,
      profilePic: user.avatar,
      isVerified: Boolean(user.isVerified)
    }));

    return res.json({
      success: true,
      data: realUsers,
      pagination: {
        page,
        pageSize,
        totalItems: total,
        totalPages: Math.max(1, Math.ceil(total / pageSize))
      }
    });
  } catch (error: any) {
    console.error('[Instagram API Error]:', error.message);
    return res.status(500).json({ success: false, message: 'Error fetching database creators' });
  }
});

/**
 * GET /api/v1/instagram/user-info
 * Fetch single database profile info
 */
router.get('/user-info', async (req: Request, res: Response) => {
  try {
    const username = (req.query.username || req.query.handle) as string;

    if (!username || !username.trim()) {
      return res.status(400).json({ success: false, error: 'Query parameter username is required' });
    }

    const cleanUsername = username.trim().replace(/^@/, '');
    const user = await InfluencerDirectory.findOne({
      $or: [
        { instagramHandle: `@${cleanUsername}` },
        { instagramHandle: cleanUsername }
      ]
    }).lean();

    if (!user) {
      return res.status(444).json({ success: false, message: 'Influencer not found in database' });
    }

    return res.json({
      success: true,
      data: {
        username: user.instagramHandle.replace('@', ''),
        fullName: user.name,
        followerCount: user.followersCount || 0,
        profilePic: user.avatar,
        isVerified: Boolean(user.isVerified),
        biography: user.bio,
        categoryName: user.category
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
});

export default router;
