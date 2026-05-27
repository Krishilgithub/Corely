import Redis from "ioredis";

const redis = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL, { 
      maxRetriesPerRequest: 1,
      commandTimeout: 500,
      retryStrategy: () => null, // don't retry if connection fails
    }) 
  : null;

if (redis) {
  redis.on("error", () => {
    // Prevent unhandled error crashes if Redis is offline
  });
}

export async function rateLimit(
  identifier: string,
  limit: number,
  windowSecs: number
): Promise<{ success: boolean; remaining: number }> {
  if (!redis) {
    return { success: true, remaining: limit };
  }

  try {
    const key = `rate_limit:${identifier}`;
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, windowSecs);
    }

    return {
      success: current <= limit,
      remaining: Math.max(0, limit - current),
    };
  } catch {
    // Graceful fallback if Redis throws an error (e.g. connection refused)
    return { success: true, remaining: limit };
  }
}
