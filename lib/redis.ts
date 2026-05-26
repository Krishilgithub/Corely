import { Queue } from "bullmq";

function parseRedisUrl(url: string) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || "127.0.0.1",
      port: parseInt(parsed.port || "6379", 10),
      password: parsed.password || undefined,
      tls: parsed.protocol === "rediss:" ? {} : undefined,
    };
  } catch {
    return { host: "127.0.0.1", port: 6379 };
  }
}

// BullMQ connection options — plain object, NOT an IORedis instance.
// BullMQ bundles its own IORedis internally; using an external IORedis
// instance causes version conflicts.
export const bullMQConnection = {
  ...parseRedisUrl(process.env.REDIS_URL ?? "redis://127.0.0.1:6379"),
  maxRetriesPerRequest: null, // Required by BullMQ
  enableReadyCheck: false,
};

// The main job queue for source ingestion
export const sourceQueue = new Queue("corely-sources", {
  connection: bullMQConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});

// Silence background queue connection errors if Redis is not running
sourceQueue.on("error", () => {
  // Silent or minimal log to prevent uncaught exceptions in Node
});
