export interface GmailHeader {
  name?: string | null;
  value?: string | null;
}

export interface GmailMessagePart {
  mimeType?: string | null;
  filename?: string | null;
  headers?: GmailHeader[] | null;
  body?: {
    data?: string | null;
  } | null;
  parts?: GmailMessagePart[] | null;
}

export interface GmailMessage {
  id?: string | null;
  internalDate?: string | null;
  payload?: GmailMessagePart | null;
}

export interface GmailThread {
  id?: string | null;
  messages?: GmailMessage[] | null;
}

export interface NormalizedGmailDocument {
  externalId: string;
  title: string;
  fileType: "gmail_thread";
  url: string;
  rawContent: string;
  updatedAt?: string;
  metadata: {
    source_type: "gmail";
    document_title: string;
    thread_id: string;
    message_count: number;
    participants: string[];
    url: string;
    updated_time?: string;
  };
}

export function decodeBase64Url(value?: string | null): string {
  if (!value) return "";

  const normalised = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalised.padEnd(
    normalised.length + ((4 - (normalised.length % 4)) % 4),
    "="
  );

  return Buffer.from(padded, "base64").toString("utf-8");
}

export function extractHeader(headers: GmailHeader[] | null | undefined, name: string): string {
  const match = headers?.find(
    (header) => header.name?.toLowerCase() === name.toLowerCase()
  );
  return match?.value ?? "";
}

export function extractMessageText(part?: GmailMessagePart | null): string {
  if (!part) return "";

  if (part.mimeType === "text/plain" && part.body?.data) {
    return decodeBase64Url(part.body.data).trim();
  }

  if (part.parts?.length) {
    const plainParts = part.parts
      .filter((child) => child.mimeType === "text/plain")
      .map(extractMessageText)
      .filter(Boolean);

    if (plainParts.length > 0) {
      return plainParts.join("\n\n").trim();
    }

    const nestedParts = part.parts
      .filter((child) => child.mimeType !== "text/html")
      .map(extractMessageText)
      .filter(Boolean);

    if (nestedParts.length > 0) {
      return nestedParts.join("\n\n").trim();
    }

    const htmlParts = part.parts
      .map(extractMessageText)
      .filter(Boolean);

    if (htmlParts.length > 0) {
      return htmlParts.join("\n\n").trim();
    }
  }

  if (part.mimeType === "text/html" && part.body?.data) {
    return htmlToText(decodeBase64Url(part.body.data));
  }

  return "";
}

export function buildGmailThreadDocument(thread: GmailThread): NormalizedGmailDocument {
  const threadId = thread.id ?? "";
  const messages = thread.messages ?? [];
  const firstPayload = messages[0]?.payload;
  const subject = extractHeader(firstPayload?.headers, "Subject") || "Untitled Gmail Thread";
  const participants = collectParticipants(messages);
  const lastMessageDate = getLastMessageDate(messages);
  const url = `https://mail.google.com/mail/u/0/#all/${threadId}`;

  const messageBlocks = messages
    .map((message) => {
      const headers = message.payload?.headers;
      const from = extractHeader(headers, "From") || "Unknown sender";
      const to = extractHeader(headers, "To");
      const cc = extractHeader(headers, "Cc");
      const date = formatMessageDate(message.internalDate, extractHeader(headers, "Date"));
      const text = extractMessageText(message.payload);

      const lines = [`[${date}] ${from}`];
      if (to) lines.push(`To: ${to}`);
      if (cc) lines.push(`Cc: ${cc}`);
      lines.push("");
      lines.push(text || "[No extractable message body]");
      return lines.join("\n");
    })
    .join("\n\n---\n\n");

  const rawContent = [
    `Subject: ${subject}`,
    `Thread participants: ${participants.join(", ") || "Unknown"}`,
    lastMessageDate ? `Last message: ${lastMessageDate}` : "",
    "",
    messageBlocks,
  ]
    .filter((line) => line !== "")
    .join("\n");

  return {
    externalId: threadId,
    title: subject,
    fileType: "gmail_thread",
    url,
    rawContent,
    updatedAt: lastMessageDate,
    metadata: {
      source_type: "gmail",
      document_title: subject,
      thread_id: threadId,
      message_count: messages.length,
      participants,
      url,
      updated_time: lastMessageDate,
    },
  };
}

function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function collectParticipants(messages: GmailMessage[]): string[] {
  const values = new Set<string>();

  for (const message of messages) {
    const headers = message.payload?.headers;
    for (const name of ["From", "To", "Cc"]) {
      const value = extractHeader(headers, name);
      if (!value) continue;
      value
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
        .forEach((entry) => values.add(entry));
    }
  }

  return Array.from(values);
}

function getLastMessageDate(messages: GmailMessage[]): string | undefined {
  const timestamps = messages
    .map((message) => Number(message.internalDate))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (timestamps.length === 0) return undefined;
  return new Date(Math.max(...timestamps)).toISOString();
}

function formatMessageDate(internalDate?: string | null, dateHeader?: string): string {
  const timestamp = Number(internalDate);
  if (Number.isFinite(timestamp) && timestamp > 0) {
    return new Date(timestamp).toISOString();
  }

  const parsed = dateHeader ? Date.parse(dateHeader) : Number.NaN;
  if (Number.isFinite(parsed)) {
    return new Date(parsed).toISOString();
  }

  return "Unknown date";
}
