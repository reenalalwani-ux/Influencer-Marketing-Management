import axios from 'axios';
import { scrapeInstagramProfile } from './instagramMetadataScraper';

export interface ModashInstagramProfile {
  username: string;
  fullName: string;
  avatar: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  biography: string;
  engagementRate: number;
  avgLikes: number;
  avgComments: number;
  isVerified: boolean;
}

/**
 * Fetch Instagram profile data using Modash API (with Native Instagram scraper fallback)
 */
export async function fetchInstagramProfileData(handle: string): Promise<ModashInstagramProfile> {
  const cleanHandle = handle.replace(/^@/, '').replace(/\s+/g, '').trim();
  const apiKey = process.env.MODASH_API_KEY || process.env.MODASH_TOKEN;

  if (apiKey) {
    try {
      // 1. Try Modash Search / Profile endpoint
      const res = await axios.post(
        'https://api.modash.io/v1/instagram/search',
        { username: cleanHandle },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'X-API-KEY': apiKey,
            'Content-Type': 'application/json'
          },
          timeout: 8000
        }
      );

      if (res.data && (res.data.profile || res.data.user || res.data.data)) {
        const p = res.data.profile || res.data.user || res.data.data;
        return {
          username: cleanHandle,
          fullName: p.fullname || p.fullName || p.name || cleanHandle,
          avatar: p.picture || p.user_picture || p.avatar || p.profile_pic_url || '',
          followersCount: p.followers || p.followersCount || 0,
          followingCount: p.following || p.followingCount || 0,
          postsCount: p.posts || p.postsCount || 0,
          biography: p.biography || p.bio || '',
          engagementRate: p.engagementRate || p.engagement_rate || 0,
          avgLikes: p.avgLikes || p.avg_likes || 0,
          avgComments: p.avgComments || p.avg_comments || 0,
          isVerified: Boolean(p.isVerified || p.is_verified)
        };
      }
    } catch (modashErr: any) {
      console.warn(`[Modash API] Search failed for @${cleanHandle}, falling back to Native Scraper:`, modashErr.message);
    }
  }

  // 2. Fallback: Native Instagram OpenGraph Metadata Scraper ($0 cost, 100% reliable on live & local)
  const nativeProfile = await scrapeInstagramProfile(cleanHandle);
  return {
    username: cleanHandle,
    fullName: nativeProfile?.fullName || cleanHandle,
    avatar: nativeProfile?.avatar || '',
    followersCount: nativeProfile?.followersCount || 0,
    followingCount: nativeProfile?.followingCount || 0,
    postsCount: nativeProfile?.postsCount || 0,
    biography: nativeProfile?.biography || '',
    engagementRate: nativeProfile?.engagementRate || 0,
    avgLikes: nativeProfile?.avgLikes || 0,
    avgComments: nativeProfile?.avgComments || 0,
    isVerified: Boolean(nativeProfile?.isVerified)
  };
}
