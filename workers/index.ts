import "dotenv/config";
import IORedis from "ioredis";

console.log("🚀 [Worker] Corely background worker started");

let standbyInterval: NodeJS.Timeout | null = null;
let isStandby = false;

// Parse the connection options to build a quick test client
const redisUrl = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";

// We use a custom retryStrategy that returns null to prevent ioredis from retrying/reconnecting
const testClient = new IORedis(redisUrl, {
  maxRetriesPerRequest: 0, 
  connectTimeout: 1000,   
  retryStrategy: () => null, // Do not reconnect on failure
});

// Handle the error event cleanly
testClient.on("error", () => {
  if (!isStandby) {
    isStandby = true;
    try {
      testClient.disconnect();
    } catch {}
    startStandbyMode("Redis is offline");
  }
});

testClient.on("connect", () => {
  if (!isStandby) {
    try {
      testClient.disconnect();
    } catch {}
    startRealWorker();
  }
});

// Timeout safeguard: if neither connect nor error fires within 1.5 seconds, enter standby
const timeout = setTimeout(() => {
  if (!isStandby) {
    isStandby = true;
    try {
      testClient.disconnect();
    } catch {}
    startStandbyMode("Connection timeout");
  }
}, 1500);

function startStandbyMode(reason: string) {
  clearTimeout(timeout);
  console.log(`ℹ️ [Worker] Running in Standby Mode — Direct In-Memory Sync is active. (${reason})`);
  
  // Heartbeat to keep Node.js process alive cleanly
  standbyInterval = setInterval(() => {
    // Silent heartbeat
  }, 60000);
}

async function startRealWorker() {
  clearTimeout(timeout);
  console.log("🔌 [Worker] Connected to Redis. Starting BullMQ queue processor...");

  try {
    // Dynamically import BullMQ and our local queue config/modules only if Redis is online
    const { Worker } = await import("bullmq");
    const { bullMQConnection } = await import("../lib/redis");
    const { syncGoogleDrive } = await import("../modules/sources/connectors/google-drive");

    const worker = new Worker(
      "corely-sources",
      async (job) => {
        console.log(`[Worker] 📦 Processing job "${job.name}" id=${job.id}`, job.data);

        switch (job.name) {
          case "sync-google-drive": {
            const { sourceId } = job.data as { sourceId: string; workspaceId: string };
            await syncGoogleDrive(sourceId);
            break;
          }
          case "sync-notion": {
            const { sourceId } = job.data as { sourceId: string; workspaceId: string };
            const { syncNotion } = await import("../modules/sources/connectors/notion");
            await syncNotion(sourceId);
            break;
          }
          default:
            console.warn(`[Worker] ⚠️ Unknown job name: ${job.name}`);
        }
      },
      {
        connection: bullMQConnection,
        concurrency: 2,
      }
    );

    worker.on("completed", (job) => {
      console.log(`[Worker] ✅ Job "${job.name}" id=${job.id} completed`);
    });

    worker.on("failed", (job, err) => {
      console.error(`[Worker] ❌ Job "${job?.name}" id=${job?.id} failed:`, err.message);
    });

    worker.on("error", (err) => {
      console.error("[Worker] ❌ Worker error:", err);
    });

    // Graceful shutdown
    const shutdown = async () => {
      console.log("[Worker] Shutting down gracefully...");
      await worker.close();
      if (standbyInterval) {
        clearInterval(standbyInterval);
      }
      process.exit(0);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);

  } catch (err) {
    console.error("[Worker] ❌ Failed to start real worker:", err);
  }
}

