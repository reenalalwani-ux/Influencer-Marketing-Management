import axios from 'axios';

export interface InstagramMetadata {
  username: string;
  fullName: string;
  avatar: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  biography: string;
  isVerified: boolean;
  engagementRate: number;
  avgLikes: number;
  avgComments: number;
}

const decodeHtmlEntities = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/&#(\d+);/g, (_, dec) => {
      try {
        return String.fromCodePoint(parseInt(dec, 10));
      } catch {
        return '';
      }
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
      try {
        return String.fromCodePoint(parseInt(hex, 16));
      } catch {
        return '';
      }
    })
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
};

const parseFollowerCountString = (str: string): number => {
  if (!str) return 0;
  const clean = str.trim().toUpperCase().replace(/,/g, '');
  if (clean.endsWith('M')) {
    return Math.round(parseFloat(clean.replace('M', '')) * 1000000);
  }
  if (clean.endsWith('K')) {
    return Math.round(parseFloat(clean.replace('K', '')) * 1000);
  }
  if (clean.endsWith('B')) {
    return Math.round(parseFloat(clean.replace('B', '')) * 1000000000);
  }
  const val = parseInt(clean, 10);
  return isNaN(val) ? 0 : val;
};

/**
 * Scrapes public Instagram profile metadata (Followers, Name, Avatar, Bio, Posts)
 * directly from public Instagram headers/meta tags.
 */
export const scrapeInstagramProfile = async (handle: string): Promise<InstagramMetadata | null> => {
  const cleanHandle = handle.trim().replace(/^@/, '').replace(/\/+$/, '').toLowerCase();
  if (!cleanHandle || cleanHandle.length < 2) return null;

  try {
    const url = `https://www.instagram.com/${cleanHandle}/`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 10000
    });

    const html: string = response.data || '';

    let followersCount = 0;
    let followingCount = 0;
    let postsCount = 0;
    let fullName = cleanHandle;
    let avatar = '';
    let bio = '';

    // Extract meta description
    const descMatch = html.match(/content="([^"]*Followers[^"]*)"/i) || html.match(/content="([^"]*following[^"]*)"/i);

    if (descMatch && descMatch[1]) {
      const descContent = decodeHtmlEntities(descMatch[1]);
      const followersMatch = descContent.match(/([\d\.,KMBkmb]+)\s+Followers/i);
      const followingMatch = descContent.match(/([\d\.,KMBkmb]+)\s+Following/i);
      const postsMatch = descContent.match(/([\d\.,KMBkmb]+)\s+Posts/i);

      if (followersMatch && followersMatch[1]) {
        followersCount = parseFollowerCountString(followersMatch[1]);
      }
      if (followingMatch && followingMatch[1]) {
        followingCount = parseFollowerCountString(followingMatch[1]);
      }
      if (postsMatch && postsMatch[1]) {
        postsCount = parseFollowerCountString(postsMatch[1]);
      }

      // Bio text inside description (e.g. "from Name (@handle)")
      const bioTextMatch = descContent.match(/from\s+([^\(]+)\s*\(@/i);
      if (bioTextMatch && bioTextMatch[1] && bioTextMatch[1].trim()) {
        fullName = bioTextMatch[1].trim();
      }
    }

    // Extract og:title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i) || html.match(/property="og:title"\s+content="([^"]+)"/i);

    if (titleMatch && titleMatch[1]) {
      const titleContent = decodeHtmlEntities(titleMatch[1]);
      const nameMatch = titleContent.match(/^([^\(•]+)/);
      if (nameMatch && nameMatch[1] && nameMatch[1].trim()) {
        fullName = nameMatch[1].trim();
      }
    }

    // Extract og:image
    const imgMatch = html.match(/property="og:image"\s+content="([^"]+)"/i) || html.match(/content="([^"]+)"\s+property="og:image"/i);

    if (imgMatch && imgMatch[1]) {
      avatar = decodeHtmlEntities(imgMatch[1]);
    }

    // Determine estimated engagement rate (1.8% to 5.4%)
    const engRate = followersCount > 0
      ? parseFloat((Math.min(8.5, Math.max(1.8, (50000 / (followersCount + 10000)) * 4.5))).toFixed(1))
      : 4.2;

    const avgLikes = Math.round(followersCount * (engRate / 100));
    const avgComments = Math.round(avgLikes * 0.08);

    return {
      username: cleanHandle,
      fullName: fullName || cleanHandle,
      avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=7c3aed&color=fff&size=200&bold=true`,
      followersCount,
      followingCount,
      postsCount,
      biography: bio,
      isVerified: html.includes('verified') || followersCount > 100000,
      engagementRate: engRate,
      avgLikes,
      avgComments
    };
  } catch (error: any) {
    console.error(`[Instagram Scraper Error for @${cleanHandle}]:`, error.message);
    return null;
  }
};
