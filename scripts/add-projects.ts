/**
 * Adds the Projects feature to an existing database.
 *
 * Only adds things. It never drops or rewrites existing tables, columns or
 * indexes, so it is safe to run on a database that has data. Running it twice
 * is fine: every step checks first.
 *
 * Why not `prisma db push`? db push compares the whole schema and can try to
 * drop objects Prisma does not know about, such as the pgvector HNSW index
 * created by scripts/init-pgvector.ts.
 *
 * Run:  npx tsx scripts/add-projects.ts
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const STEPS: Array<[string, string]> = [
  ["documents.metadata column",
   `ALTER TABLE documents ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb`],

  ["projects table",
   `CREATE TABLE IF NOT EXISTS projects (
      id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      name         text NOT NULL,
      key          text,
      description  text,
      aliases      jsonb NOT NULL DEFAULT '[]'::jsonb,
      status       text NOT NULL DEFAULT 'active',
      phase        text,
      owner_id     uuid REFERENCES users(id) ON DELETE SET NULL,
      team_id      uuid REFERENCES teams(id) ON DELETE SET NULL,
      start_date   timestamp(3),
      target_date  timestamp(3),
      summary      text,
      summary_at   timestamp(3),
      created_at   timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at   timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`],
  ["projects unique key",
   `CREATE UNIQUE INDEX IF NOT EXISTS projects_workspace_id_key_key ON projects (workspace_id, key)`],
  ["projects status index",
   `CREATE INDEX IF NOT EXISTS projects_workspace_id_status_idx ON projects (workspace_id, status)`],

  ["project_source_links table",
   `CREATE TABLE IF NOT EXISTS project_source_links (
      id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      project_id   uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      source_id    uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
      scope_type   text NOT NULL,
      scope_id     text NOT NULL,
      scope_name   text NOT NULL,
      child_scopes jsonb NOT NULL DEFAULT '[]'::jsonb,
      created_at   timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`],
  ["project_source_links unique",
   `CREATE UNIQUE INDEX IF NOT EXISTS project_source_links_project_id_source_id_scope_type_scope_id_key
      ON project_source_links (project_id, source_id, scope_type, scope_id)`],

  ["document_projects table",
   `CREATE TABLE IF NOT EXISTS document_projects (
      document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      method      text NOT NULL,
      confidence  double precision NOT NULL DEFAULT 1,
      status      text NOT NULL DEFAULT 'confirmed',
      created_at  timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at  timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT document_projects_pkey PRIMARY KEY (document_id, project_id)
    )`],
  ["document_projects extracted_hash column",
   `ALTER TABLE document_projects ADD COLUMN IF NOT EXISTS extracted_hash text`],
  ["document_projects index",
   `CREATE INDEX IF NOT EXISTS document_projects_project_id_status_idx ON document_projects (project_id, status)`],

  ["org_memories project columns",
   `ALTER TABLE org_memories
      ADD COLUMN IF NOT EXISTS project_id uuid,
      ADD COLUMN IF NOT EXISTS type text,
      ADD COLUMN IF NOT EXISTS source_document_id uuid,
      ADD COLUMN IF NOT EXISTS occurred_at timestamp(3),
      ADD COLUMN IF NOT EXISTS confidence double precision`],
  ["org_memories project foreign key",
   `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'org_memories_project_id_fkey') THEN
        ALTER TABLE org_memories ADD CONSTRAINT org_memories_project_id_fkey
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
      END IF;
    END $$`],
  ["org_memories source document foreign key",
   `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'org_memories_source_document_id_fkey') THEN
        ALTER TABLE org_memories ADD CONSTRAINT org_memories_source_document_id_fkey
          FOREIGN KEY (source_document_id) REFERENCES documents(id) ON DELETE SET NULL;
      END IF;
    END $$`],
  ["org_memories project index",
   `CREATE INDEX IF NOT EXISTS org_memories_project_id_occurred_at_idx ON org_memories (project_id, occurred_at)`],

  // Existing roles get the two new project permissions, so current users can use Projects.
  ["project permissions on existing roles",
   `UPDATE workspace_roles
      SET permissions = permissions || '["projects:read"]'::jsonb
      WHERE NOT (permissions ? 'projects:read')`],
  ["project manage permission for Admin, Developer, Product Manager",
   `UPDATE workspace_roles
      SET permissions = permissions || '["projects:manage"]'::jsonb
      WHERE name IN ('Admin', 'Developer', 'Product Manager') AND NOT (permissions ? 'projects:manage')`],
];

async function main() {
  const { prisma } = await import("../lib/db");
  let failed = 0;
  for (const [label, sql] of STEPS) {
    try {
      await prisma.$executeRawUnsafe(sql);
      console.log(`✅ ${label}`);
    } catch (err) {
      failed++;
      console.error(`❌ ${label}:`, err instanceof Error ? err.message : err);
    }
  }
  await prisma.$disconnect();
  if (failed) {
    console.error(`\n${failed} step(s) failed. Fix the error above and run the script again.`);
    process.exit(1);
  }
  console.log("\nProjects schema is ready.");
}

main();
