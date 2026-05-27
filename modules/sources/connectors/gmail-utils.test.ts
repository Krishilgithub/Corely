import assert from "node:assert/strict";
import test from "node:test";
import {
  buildGmailThreadDocument,
  decodeBase64Url,
  extractHeader,
  extractMessageText,
} from "./gmail-utils";

test("decodeBase64Url decodes Gmail base64url payloads", () => {
  assert.equal(decodeBase64Url("SGVsbG8td29ybGQ_"), "Hello-world?");
});

test("extractHeader returns a case-insensitive header value", () => {
  assert.equal(
    extractHeader(
      [
        { name: "Subject", value: "Renewal approval" },
        { name: "From", value: "finance@example.com" },
      ],
      "subject"
    ),
    "Renewal approval"
  );
});

test("extractMessageText prefers text/plain parts and strips html fallback", () => {
  const plain = Buffer.from("Plain decision text").toString("base64url");
  const html = Buffer.from("<div>HTML <b>decision</b>&nbsp;text</div>").toString("base64url");

  assert.equal(
    extractMessageText({
      mimeType: "multipart/alternative",
      parts: [
        { mimeType: "text/html", body: { data: html } },
        { mimeType: "text/plain", body: { data: plain } },
      ],
    }),
    "Plain decision text"
  );

  assert.equal(
    extractMessageText({
      mimeType: "text/html",
      body: { data: html },
    }),
    "HTML decision text"
  );
});

test("buildGmailThreadDocument normalizes messages into one cited thread document", () => {
  const body = Buffer.from("Approved at $120k annual.").toString("base64url");
  const doc = buildGmailThreadDocument({
    id: "thread-1",
    messages: [
      {
        id: "msg-1",
        internalDate: String(Date.parse("2026-05-27T09:30:00Z")),
        payload: {
          headers: [
            { name: "Subject", value: "Renewal pricing approval" },
            { name: "From", value: "finance@example.com" },
            { name: "To", value: "ceo@example.com" },
          ],
          mimeType: "text/plain",
          body: { data: body },
        },
      },
    ],
  });

  assert.equal(doc.externalId, "thread-1");
  assert.equal(doc.title, "Renewal pricing approval");
  assert.equal(doc.fileType, "gmail_thread");
  assert.equal(doc.metadata.source_type, "gmail");
  assert.equal(doc.metadata.message_count, 1);
  assert.match(doc.rawContent, /Subject: Renewal pricing approval/);
  assert.match(doc.rawContent, /finance@example.com/);
  assert.match(doc.rawContent, /Approved at \$120k annual\./);
});
