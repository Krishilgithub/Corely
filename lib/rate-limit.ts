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

// In-memory fallback when Redis is offline
const memoryStore = new Map<string, { count: number; resetAt: number }>();

export async function rateLimit(
  identifier: string,
  limit: number,
  windowSecs: number
): Promise<{ success: boolean; remaining: number }> {
  // Try Redis first
  if (redis) {
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
      // Redis failed — fall through to in-memory fallback
    }
  }

  // In-memory fallback (fails CLOSED — enforces limits even without Redis)
  const now = Date.now();
  const key = identifier;
  const entry = memoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowSecs * 1000 });
    return { success: true, remaining: limit - 1 };
  }

  entry.count++;
  return {
    success: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
  };
}
