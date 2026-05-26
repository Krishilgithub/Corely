import OpenAI from "openai";

const globalForOpenAI = globalThis as unknown as { openai: OpenAI | undefined };

export const openai =
  globalForOpenAI.openai ??
  new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "dummy-key-for-build" });

if (process.env.NODE_ENV !== "production") globalForOpenAI.openai = openai;

/**
 * Generate a 1536-dimension embedding vector for a text string.
 * Uses text-embedding-3-small — cheap, fast, great quality.
 * Falls back to text-embedding-ada-002 if the API key lacks access.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const slicedText = text.slice(0, 8000).trim();
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: slicedText,
    });
    return response.data[0].embedding;
  } catch (err) {
    const errorObj = err as { status?: number; message?: string };
    const errMessage = errorObj?.message || "";
    const isModelOrPermissionError =
      errorObj?.status === 403 ||
      errorObj?.status === 404 ||
      errMessage.includes("model_not_found") ||
      errMessage.includes("does not have access to model") ||
      errMessage.includes("not found") ||
      errMessage.includes("403");

    if (isModelOrPermissionError) {
      console.warn(
        `⚠️ [OpenAI] "text-embedding-3-small" failed (${errMessage}). Falling back to legacy "text-embedding-ada-002"...`
      );
      try {
        const fallbackResponse = await openai.embeddings.create({
          model: "text-embedding-ada-002",
          input: slicedText,
        });
        return fallbackResponse.data[0].embedding;
      } catch (fallbackErr) {
        console.error("❌ [OpenAI] Fallback model \"text-embedding-ada-002\" also failed:", fallbackErr);
        throw fallbackErr;
      }
    }
    throw err;
  }
}

