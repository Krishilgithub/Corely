import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth-server";
import { chunkText } from "@/modules/ai/chunker";
import { generateEmbedding } from "@/lib/embeddings";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { user, workspace } = await auth();
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const title = file.name;
    const fileType = (file.name.split('.').pop() || "txt").toLowerCase();
    
    let rawContent = "";
    if (fileType === "pdf") {
      // --- Polyfill missing DOM APIs for pdf.js in Node ---
      if (typeof globalThis.DOMMatrix === "undefined") {
        globalThis.DOMMatrix = class DOMMatrix {
          a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
          constructor() {}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
      }
      if (typeof globalThis.ImageData === "undefined") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        globalThis.ImageData = class ImageData {} as any;
      }
      if (typeof globalThis.Path2D === "undefined") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        globalThis.Path2D = class Path2D {} as any;
      }
      // ----------------------------------------------------
      const arrayBuffer = await file.arrayBuffer();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfImport = require("pdf-parse");
      const PDFParseClass = pdfImport.PDFParse || (typeof pdfImport === "function" ? pdfImport : pdfImport.default);
      
      try {
        PDFParseClass.setWorker(require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs"));
      } catch (e) {
        console.warn("[Upload] Failed to set local pdf.js worker:", e);
      }
      const parser = new PDFParseClass({ data: Buffer.from(arrayBuffer) });
      const parsed = await parser.getText();
      rawContent = parsed.text;
      await parser.destroy();
    } else if (fileType === "docx" || fileType === "doc") {
      const arrayBuffer = await file.arrayBuffer();
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mammoth = require("mammoth");
      const result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
      rawContent = result.value;
    } else {
      rawContent = await file.text();
    }

    const content = rawContent.replace(/\0/g, ''); // Strip null bytes for Postgres

    // Find or create the manual_upload source for this workspace
    let source = await prisma.source.findFirst({
      where: { workspaceId: workspace.id, type: "manual_upload" }
    });

    if (!source) {
      source = await prisma.source.create({
        data: {
          workspaceId: workspace.id,
          userId: user.id,
          type: "manual_upload",
          name: "Manual Uploads",
          status: "synced",
          itemsIndexed: 0,
          lastSyncedAt: new Date(),
          config: { permissions: "everyone" }
        }
      });
    }

    // Create a new document with the file content
    const externalId = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const document = await prisma.document.create({
      data: {
        workspaceId: workspace.id,
        sourceId: source.id,
        externalId,
        title,
        fileType,
        rawContent: content,
        indexedAt: new Date(),
      }
    });

    // Chunk the text and generate embeddings.
    // Count failures so we never report a success that did not happen.
    const chunks = chunkText(content, title);
    let failedChunks = 0;

    for (const chunk of chunks) {
      try {
        const embedding = await generateEmbedding(chunk.content);
        const { error } = await supabaseAdmin.from("document_chunks").insert({
          document_id: document.id,
          source_id: source.id,
          workspace_id: workspace.id,
          content: chunk.content,
          chunk_index: chunk.chunkIndex,
          token_count: chunk.tokenCount,
          embedding: embedding,
          metadata: {
            document_title: title,
            file_type: fileType,
            source_type: "manual_upload",
          }
        });
        if (error) {
          failedChunks++;
          console.error("Failed to insert chunk into Supabase:", error);
        }
      } catch (err) {
        failedChunks++;
        console.error("Failed to embed or store chunk:", err);
      }
    }

    // Nothing was stored, so the file is not searchable. Remove the document and report the error.
    if (chunks.length > 0 && failedChunks === chunks.length) {
      await supabaseAdmin.from("document_chunks").delete().eq("document_id", document.id);
      await prisma.document.delete({ where: { id: document.id } });
      return NextResponse.json(
        { error: "The file could not be indexed. No text chunks were saved. Please try again." },
        { status: 502 }
      );
    }

    // Update items indexed on the source
    await prisma.source.update({
      where: { id: source.id },
      data: {
        itemsIndexed: { increment: 1 },
        lastSyncedAt: new Date(),
      }
    });

    // Some chunks failed: the file is saved but only partly searchable.
    const warning = failedChunks > 0
      ? `Only ${chunks.length - failedChunks} of ${chunks.length} text chunks were indexed. Parts of this file will not show up in search.`
      : null;

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully",
      chunksIndexed: chunks.length - failedChunks,
      chunksTotal: chunks.length,
      warning,
    });
  } catch (err) {
    console.error("[Manual Upload Error]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload failed" }, { status: 500 });
  }
}
