import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function main() {
  console.log("🚀 Loading Prisma Database Client...");
  const { prisma } = await import("../lib/db");
  
  console.log("🚀 Loading Google Drive Connector module...");
  const { syncGoogleDrive } = await import("../modules/sources/connectors/google-drive");

  // Fetch all Google Drive sources
  const sources = await prisma.source.findMany({
    where: { type: "google_drive" },
  });

  if (sources.length === 0) {
    console.log("ℹ️ No Google Drive sources found in database.");
    return;
  }

  console.log(`Found ${sources.length} Google Drive sources. Re-triggering indexing...`);

  for (const source of sources) {
    console.log(`Syncing Source: "${source.name}" (ID: ${source.id})...`);
    
    // Set status to syncing
    await prisma.source.update({
      where: { id: source.id },
      data: { status: "syncing", errorMessage: null },
    });

    try {
      await syncGoogleDrive(source.id);
      console.log(`✅ Source "${source.name}" indexed and embedded successfully!`);
    } catch (err) {
      console.error(`❌ Failed to index source "${source.name}":`, err);
      await prisma.source.update({
        where: { id: source.id },
        data: { status: "error", errorMessage: String(err) },
      });
    }
  }

  console.log("✨ All database vector re-indexing completed!");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("❌ Re-indexing script crashed:", err);
  process.exit(1);
});
