/**
 * Text chunker for document ingestion.
 * Splits text into overlapping chunks to preserve context across chunk boundaries.
 */

export interface TextChunk {
  content: string;
  chunkIndex: number;
  tokenCount: number;
}

const CHUNK_SIZE = 400;     // words per chunk (approx 512 tokens)
const CHUNK_OVERLAP = 50;   // overlapping words for context continuity

/**
 * Split a long text into overlapping chunks suitable for embedding.
 * Each chunk is ~400 words with a 50-word overlap.
 */
export function chunkText(text: string, docTitle?: string): TextChunk[] {
  // Normalise whitespace
  const normalised = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  // Split into paragraphs first, then into words
  const words = normalised.split(/\s+/).filter(Boolean);

  if (words.length === 0) return [];

  const chunks: TextChunk[] = [];
  let i = 0;
  let chunkIndex = 0;

  while (i < words.length) {
    const sliceWords = words.slice(i, i + CHUNK_SIZE);
    const content = sliceWords.join(" ");

    // Skip nearly-empty chunks
    if (content.trim().length < 30) {
      i += CHUNK_SIZE;
      continue;
    }

    chunks.push({
      content: docTitle ? `[${docTitle}]\n${content}` : content,
      chunkIndex,
      tokenCount: sliceWords.length,
    });

    chunkIndex++;
    i += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks;
}
