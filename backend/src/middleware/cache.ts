import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';

/**
 * Express middleware to cache GET endpoint responses in Redis.
 * If REDIS_URL is not configured (e.g. local dev), it transparently bypasses caching without breaking anything.
 */
export const cacheMiddleware = (ttlSeconds: number = 30) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!redis || req.method !== 'GET') {
      return next();
    }

    const userId = (req as any).user?._id || 'public';
    const cacheKey = `cache:${req.baseUrl}${req.path}:${JSON.stringify(req.query)}:${userId}`;

    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(JSON.parse(cachedData));
      }
    } catch (err) {
      console.error('[Redis GET Error]', err);
    }

    // Intercept res.json to store successful response in Redis before sending
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (redis && res.statusCode === 200 && body && body.success !== false) {
        redis.setex(cacheKey, ttlSeconds, JSON.stringify(body)).catch(err => {
          console.error('[Redis SET Error]', err);
        });
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
};

/**
 * Invalidate cached responses matching a URL pattern (e.g. '/dashboard', '/targets', '/postings')
 */
export const clearCachePattern = async (pattern: string) => {
  if (!redis) return;
  try {
    const keys = await redis.keys(`cache:*${pattern}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (err) {
    console.error('[Redis Invalidate Error]', err);
  }
};
