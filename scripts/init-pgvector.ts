import { loadEnvConfig } from "@next/env";

// Load all Next.js environment configurations (.env.local, .env, etc.)
loadEnvConfig(process.cwd());

async function main() {
  console.log("🚀 Loading Prisma Database Client dynamically...");
  const { prisma } = await import("../lib/db");

  console.log("🚀 Initializing pgvector settings on Supabase database...");

  // 1. Enable pgvector extension
  try {
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector;`);
    console.log("✅ Extension 'vector' verified/enabled.");
  } catch (err) {
    console.error("⚠️ Failed to enable 'vector' extension:", err);
  }

  // 2. Add embedding column to document_chunks table if it does not exist
  try {
    const columns = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'document_chunks' AND column_name = 'embedding';`
    );

    if (columns.length === 0) {
      await prisma.$executeRawUnsafe(`ALTER TABLE document_chunks ADD COLUMN embedding vector(1536);`);
      console.log("✅ Column 'embedding vector(1536)' added to 'document_chunks' table successfully.");
    } else {
      console.log("ℹ️ Column 'embedding' already exists on 'document_chunks' table.");
    }
  } catch (err) {
    console.error("❌ Failed to add embedding column:", err);
  }

  // 3. Create HNSW Vector Index for ultra-fast cosine similarity lookups
  try {
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON document_chunks
      USING hnsw (embedding vector_cosine_ops)
      WITH (m = 16, ef_construction = 64);
    `);
    console.log("✅ HNSW vector index verified/created on 'document_chunks.embedding' successfully.");
  } catch (err) {
    console.warn("⚠️ HNSW index creation warning (might be using pgvector < 0.5.0, trying fallback index):", err);
    try {
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS idx_chunks_embedding_ivfflat ON document_chunks
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
      `);
      console.log("✅ IVFFlat vector index fallback created successfully.");
    } catch (fallbackErr) {
      console.error("❌ Vector index fallback failed:", fallbackErr);
    }
  }

  // 4. Create the match_chunks RAG pgvector similarity matching function
  try {
    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION match_chunks(
        query_embedding   vector(1536),
        workspace_filter  UUID,
        match_threshold   FLOAT DEFAULT 0.6,
        match_count       INT DEFAULT 5
      )
      RETURNS TABLE (
        id          UUID,
        content     TEXT,
        document_id UUID,
        source_id   UUID,
        metadata    JSONB,
        similarity  FLOAT
      )
      LANGUAGE sql STABLE
      AS $$
        SELECT
          dc.id,
          dc.content,
          dc.document_id,
          dc.source_id,
          dc.metadata,
          1 - (dc.embedding <=> query_embedding) AS similarity
        FROM document_chunks dc
        WHERE
          dc.workspace_id = workspace_filter
          AND 1 - (dc.embedding <=> query_embedding) > match_threshold
        ORDER BY dc.embedding <=> query_embedding
        LIMIT match_count;
      $$;
    `);
    console.log("✅ 'match_chunks' similarity matching RPC search function created/verified successfully.");
  } catch (err) {
    console.error("❌ Failed to create match_chunks similarity search function:", err);
  }

  console.log("✨ Supabase pgvector initialization process completed!");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("❌ Initialization Script crashed:", err);
  process.exit(1);
});
