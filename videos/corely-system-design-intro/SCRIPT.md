# SCRIPT — corely-system-design-intro

**Voice:** af_heart (Kokoro, local)
**Voice settings:** default
**Voice direction:** Calm, clear, friendly. A senior engineer explaining the system to a new teammate. Plain words, no hype.

---

## Line 1 — The answer is somewhere (Frame 1)

**Time:** 0.0 – 6.0s
**Delivery:** Even pace; small pause at each dash.

    What did we decide last month? The answer is somewhere — in Slack, in Notion, in an email thread.

## Line 2 — One memory you can ask (Frame 2)

**Time:** 6.0 – 13.0s
**Delivery:** Even pace; small pause at each dash.

    Corely connects those tools into one memory. Ask in plain English — and get an answer with sources.

## Line 3 — Step 1: Connect and sync (Frame 3)

**Time:** 13.0 – 21.0s
**Delivery:** Even pace; small pause at each dash.

    First, Corely connects six sources with OAuth — keeps the tokens encrypted — and skips anything unchanged.

## Line 4 — Step 2: Chunk and embed (Frame 4)

**Time:** 21.0 – 30.0s
**Delivery:** Even pace; small pause at each dash.

    Next, it splits each document into chunks — turns each chunk into numbers that capture its meaning — and stores them in Postgres with pgvector.

## Line 5 — Step 3: Ask and retrieve (Frame 5)

**Time:** 30.0 – 38.0s
**Delivery:** Even pace; small pause at each dash.

    When you ask, Corely checks what you're allowed to see — then finds the eight chunks closest in meaning.

## Line 6 — Step 4: Score freshness (Frame 6)

**Time:** 38.0 – 45.0s
**Delivery:** Even pace; small pause at each dash.

    Each match gets a freshness score. A Slack message goes stale fast. A Notion doc stays trusted much longer.

## Line 7 — Step 5: Stream a cited answer (Frame 7)

**Time:** 45.0 – 54.0s
**Delivery:** Even pace; small pause at each dash.

    Then GPT-4o streams the answer live, with citations. If nothing matches well enough — Corely says it doesn't know, instead of guessing.

## Line 8 — One simple stack (Frame 8)

**Time:** 54.0 – 59.0s
**Delivery:** Even pace; small pause at each dash.

    And it's all one Next.js app, one Postgres database, packaged in Docker.

## Line 9 — Corely (Frame 9)

**Time:** 59.0 – 63.0s
**Delivery:** Even pace; small pause at each dash.

    Corely. Your team's memory — with sources.
