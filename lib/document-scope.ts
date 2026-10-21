import { prisma } from "./db";
import type { Prisma } from "@prisma/client";

/**
 * Where a document lives inside its tool. Projects link to these scopes
 * (for example "Slack channel #atlas" or "GitHub repo acme/atlas"), and every
 * document inside a linked scope belongs to that project.
 */
export type ScopeType =
  | "channel"          // Slack channel
  | "page"             // Notion page (the page itself; parents are walked at match time)
  | "folder"           // Google Drive folder (immediate parent folders)
  | "repo"             // GitHub repository (owner/name)
  | "linear_team"      // Linear team
  | "linear_project"   // Linear project
  | "source";          // a whole source (every document in it); used for links only

export type DocumentScope = { type: ScopeType; id: string; name?: string };

export type DocumentMetadata = {
  provider: string;
  scopes: DocumentScope[];
  /** Notion only: the parent page or database id, used to find ancestors. */
  parentId?: string | null;
};

export function scopeMetadata(
  provider: string,
  scopes: Array<DocumentScope | null | undefined | false>,
  extra: Partial<DocumentMetadata> = {}
): DocumentMetadata {
  return { provider, scopes: scopes.filter(Boolean) as DocumentScope[], ...extra };
}

/**
 * Connectors skip documents whose content has not changed. Documents synced
 * before scopes existed would then never get them, so this writes the
 * metadata on its own. It keeps the original updatedAt, so the freshness
 * score of the document does not change.
 */
export async function ensureDocumentMetadata(documentId: string, metadata: DocumentMetadata) {
  const current = await prisma.document.findUnique({
    where: { id: documentId },
    select: { metadata: true, updatedAt: true },
  });
  if (!current) return;
  if (JSON.stringify(current.metadata) === JSON.stringify(metadata)) return;
  await prisma.document.update({
    where: { id: documentId },
    data: { metadata: metadata as unknown as Prisma.InputJsonValue, updatedAt: current.updatedAt },
  });
}
