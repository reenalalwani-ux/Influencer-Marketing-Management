import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

export const redis = redisUrl
  ? new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true
    })
  : null;

if (redis) {
  redis.connect().then(() => {
    console.log('⚡ Connected to Render Redis Cache');
  }).catch((err) => {
    console.warn('⚠️ Redis connection skipped/unavailable:', err.message);
  });
}
