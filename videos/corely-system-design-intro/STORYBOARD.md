---
format: 1920x1080
duration: 60s
message: "Corely turns your team's scattered tools into one memory you can ask, with cited, fresh answers"
arc: how-to-process
audience: Engineers, teammates and managers new to Corely
mode: autonomous
music: none
---

## Video direction

- **palette system** (from `frame.md`): warm cream `bg` ground on every frame; cobalt `primary` is the only accent (eyebrows, numerals, lit pipeline steps, connector lines, citation chips, progress bar). Headlines `text` near-black, body `text-muted`. Cards are `card-tinted` (4% cobalt fill, 20% cobalt border, 14px radius, no shadow). `negative` red appears only as inline text on the "Stale" chip (frame 6) and "no match" (frame 7); `positive` green only on "Fresh". Atmosphere (dot grid, concentric rings) only on frames 1, 2 and 9.
- **type**: Space Grotesk for display, numerals and chrome (eyebrows uppercase 0.08em cobalt); Inter for body. Vector numbers use Space Grotesk tabular numerals (no new font).
- **consistent stage (frames 3-7)**: a pipeline rail across the top band — five `step-circle`s labelled CONNECT · CHUNK & EMBED · RETRIEVE · FRESHNESS · ANSWER joined by a hairline. The current step is solid cobalt; done steps fade to 0.55 opacity; future steps are outline only. The rail sits at the same position in every one of these frames, so the push-slide LEFT seams read as one continuous walk along the pipeline. Each step's diagram sits in the stage area below the rail (y ~ 22%-80%).
- **motion grammar + reveal model**: long-tail `power3` settles everywhere; no bounce, no overshoot. Each piece enters when the voiceover names it — never front-load. Holds are still; subtle jitter at most. Connector lines and icons self-draw (`svg-path-draw`).
- **rhythm / held frames**: frame 2 ends on a held read of the answer card (breather after the hook). Frame 6 holds the two bars still so the contrast lands. Frame 9 is the calm closing hold.
- **negative list**: no purple-blue "AI" gradients, no bokeh, no drop shadows, no second accent color, no real brand logos (tool names are text chips), no browser chrome, no cursors. No slideshow failure (everything dumped then frozen) and no screensaver failure (everything floating independently). No infinite loops or randomness — dot fields use fixed, index-derived positions.
- **caption band**: keep primary content in the top ~83%.

## Frame 1 — The answer is somewhere

- scene: A plain question types in, then six tool names scatter around it like lost notes
- voiceover: "What did we decide last month? The answer is somewhere — in Slack, in Notion, in an email thread."
- duration: 5.419s
- transition_in: cut
- status: animated
- src: compositions/frames/01-hook.html
- type: hook
- persuasion: Pain validation + rhetorical question
- beat: recognition + mild frustration
- focal: the question line "What did we decide last month?"
- roles: question = foreground subject · three scattered source cards (Slack message, Notion page, email thread) = supporting · faint cobalt dot grid = background (dim ~35%)
- sfx: typing, pop
- blueprint: kinetic-type-beats (Adapt)

narrativeRole: Opens the gap every team feels — knowledge exists but is scattered across tools.
keyMessage: Your team already knows the answer; it is just spread across too many places.

Adapt (kinetic-type-beats): keep the statement-build signature (a line that builds beat by beat); the payoff is three scattered cards instead of a logo.
Scene 1 (0.0–2.0s): cream ground with a faint 3×3 cobalt dot grid (atmosphere). "What did we decide last month?" builds word by word in `h1` near-black, centered at y ~ 42% (per-word staggered reveal → `dynamic-content-sequencing`).
Scene 2 (2.0–3.1s): the question eases up and shrinks to `h2` in the upper third; "The answer is somewhere —" fades up beneath it in `body` muted.
Scene 3 (3.1–5.4s): three slightly tilted `card-tinted` snippets land around the question, one on each spoken name — a Slack message card ("#product · let's go with…") left at ~3.3s, a Notion page card ("Q3 decisions") right at ~3.9s, an email thread card ("Re: Re: final call?") lower-center at ~4.6s (spring-pop entrance, smooth settle → `spring-pop-entrance`). Scattered asymmetric layout, 3 depth layers; then a still hold.

## Frame 2 — One memory you can ask

- scene: The six tool nodes spring into a ring around a central "Corely" hub; a cited answer card settles under it
- voiceover: "Corely connects those tools into one memory. Ask in plain English — and get an answer with sources."
- duration: 5.973s
- transition_in: crossfade
- status: animated
- src: compositions/frames/02-intro.html
- type: product_intro
- persuasion: Concept announcement + frame-then-fill
- beat: clarity + relief
- focal: the central "Corely" hub
- roles: Corely hub (cobalt circle + wordmark) = foreground subject · six tool chips on a ring (Notion, Gmail, Google Drive, GitHub, Slack, Linear) = supporting · connector lines = supporting · concentric rings = background (dim ~30%) · ask pill + answer card = foreground (late)
- sfx: whoosh-short, chime
- blueprint: constellation-hub (Reproduce)

narrativeRole: Lands the value claim (the message) in beat 2, and names Corely as the hub.
keyMessage: Corely is one place to ask, and every answer shows where it came from.

Reproduce: nodes spring into a ring, then the camera pushes in onto the core.
Scene 1 (0.0–2.0s): six tag-pill tool chips (text labels, no logos) spring from the center out to an even ring (cluster→outward expansion → `center-outward-expansion`); thin cobalt connector lines draw from each chip to the center. Centered, ring ~55% of frame height, faint concentric rings behind.
Scene 2 (2.0–2.9s): on "one memory", the center fills as a solid cobalt circle with "Corely" in cream Space Grotesk 700 (spring-pop entrance, smooth); a soft cobalt-tint glow sits behind it.
Scene 3 (2.9–4.3s): on "Ask in plain English", the camera pushes in toward the hub and the ring chips soften and dim; a pill-shaped ask bar appears under the hub and types "What did we decide about pricing?" (type-on with caret → `discrete-text-sequence`).
Scene 4 (4.3–6.0s): on "with sources", a `card-tinted` answer card slides up beneath the ask bar with one line of answer text and two cobalt citation chips "[1] Notion" "[2] Slack". Held read to the end.

## Frame 3 — Step 1: Connect and sync

- scene: Pipeline stage, node 1 lights — six source chips flow through an encrypted lock into a "dedupe" filter that drops an unchanged doc
- voiceover: "First, Corely connects six sources with OAuth — keeps the tokens encrypted — and skips anything unchanged."
- duration: 6.613s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/03-connect.html
- type: feature_showcase
- persuasion: Signposting + causal chain
- beat: orientation + focus
- blueprint: compose
- focal: the dedupe filter that drops the unchanged document
- roles: pipeline rail (step 1 lit) = supporting chrome · six source chips = foreground (left) · OAuth line + lock icon = supporting · "SHA-256 content hash" filter card = foreground subject · document tiles = supporting
- sfx: click-soft, key-press, whoosh-short

narrativeRole: Starts the pipeline: how knowledge gets in, safely and without duplicates.
keyMessage: Sources connect once with OAuth; syncs bring in only what changed (SHA-256 dedupe).

Compose: a left-to-right flow diagram on the shared pipeline stage.
Scene 1 (0.0–1.2s): the pipeline rail draws in across the top (shared stage); step circle 01 CONNECT fills cobalt (smooth pop) while eyebrow "STEP 1 · CONNECT & SYNC" appears under the rail.
Scene 2 (1.2–2.8s): on "six sources with OAuth", six tool chips stack in a left column (staggered reveal, one by one); a cobalt line draws from the column toward the center with a small "OAuth" tag pill on it (→ `svg-path-draw`).
Scene 3 (2.8–4.1s): on "keeps the tokens encrypted", a lock icon self-draws on the line with the label "AES-encrypted tokens" (→ `svg-path-draw`).
Scene 4 (4.1–6.6s): on "skips anything unchanged", four document tiles travel along the line into a center `card-tinted` filter labelled "SHA-256 content hash"; three pass through to the right labelled "new / changed"; the fourth, tagged "unchanged", dims to 40% and drops out of the flow. Asymmetric 30/40/30 flow, hold.

## Frame 4 — Step 2: Chunk and embed

- scene: Same pipeline stage, node 2 lights — a document slices into 400-word chunks, each chunk turns into a column of numbers, and drops into a Postgres + pgvector cylinder
- voiceover: "Next, it splits each document into chunks — turns each chunk into numbers that capture its meaning — and stores them in Postgres with pgvector."
- duration: 9.173s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/04-embed.html
- type: feature_showcase
- persuasion: Concretization + progressive disclosure
- beat: comprehension + "aha"
- blueprint: compose
- focal: a chunk turning into a column of numbers
- roles: pipeline rail (step 2 lit) = supporting chrome · document card = foreground (left) · four chunk cards = foreground · number columns = foreground subject · "Postgres + pgvector" database card = foreground (right)
- sfx: whoosh-short, click, pop

narrativeRole: Explains embeddings in plain terms — meaning becomes numbers that a database can search.
keyMessage: Every chunk becomes a 1536-number vector stored in one Postgres database.

Compose: a three-stage transform, left to right — document → chunks → vectors → database.
Scene 1 (0.0–1.2s): step 01 fades to done (0.55), 02 CHUNK & EMBED fills cobalt; eyebrow "STEP 2 · CHUNK & EMBED". A document card sits in the left third.
Scene 2 (1.2–3.5s): on "splits each document into chunks", the document card slices horizontally into four stacked chunk cards that spread apart slightly; a small label reads "400 words · 50 overlap" (staggered reveal).
Scene 3 (3.5–6.1s): on "numbers that capture its meaning", each chunk card flips and decodes into a narrow column of numbers like "0.021 / −0.113 / 0.087 / …" (3D char flip-decode → `hacker-flip-3d`), with a cobalt numeral label "1536 numbers per chunk" and a muted line "text-embedding-3-small".
Scene 4 (6.1–9.2s): on "Postgres with pgvector", the four columns slide right into a rounded database card (cylinder outline drawn with `svg-path-draw`) labelled "Postgres + pgvector" with the sub-label "HNSW cosine index". Hold still.

## Frame 5 — Step 3: Ask and retrieve

- scene: Same stage, node 3 lights — a question types into an Ask bar, passes a permission shield, then eight closest chunks light up out of a field of dots
- voiceover: "When you ask, Corely checks what you're allowed to see — then finds the eight chunks closest in meaning."
- duration: 5.397s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/05-retrieve.html
- type: feature_showcase
- persuasion: Demonstration + progressive disclosure
- beat: fascination
- focal: the eight nearest dots lighting up around the query
- roles: pipeline rail (step 3 lit) = supporting chrome · ask bar = foreground (early) · permission shield badge = supporting · a field of ~40 chunk dots = background-to-foreground · query point + 8 lit neighbours + link lines = foreground subject
- sfx: typing, whoosh-short, ping
- blueprint: prompt-type-submit-generate (Adapt)

narrativeRole: Shows retrieval: permission-scoped vector search, not keyword search.
keyMessage: Search is by meaning, and only over sources you have permission to read (top 8, similarity above 0.55).

Adapt: keep the "watch me ask, watch it answer" signature (a query types and submits); the answer here is a retrieval picture, not text.
Scene 1 (0.0–0.7s): step 02 fades to done, 03 RETRIEVE fills cobalt; eyebrow "STEP 3 · RETRIEVE".
Scene 2 (0.7–2.0s): a pill ask bar, upper-left of the stage, types "What did we decide about pricing?" (type-on with caret → `discrete-text-sequence`) and submits with a small press (→ `press-release-spring`).
Scene 3 (2.0–3.1s): on "what you're allowed to see", a field of about 40 small cobalt-tint dots (fixed positions) fills the stage; a shield badge "Permission filter" appears and about a third of the dots fade to 15% (sources this user cannot read).
Scene 4 (3.1–5.4s): on "eight chunks closest in meaning", a solid query point lands at the center of the field; the eight nearest visible dots turn solid cobalt one by one with hairline links to the query point; a tag pill reads "top 8 · similarity > 0.55". Centered field ~55% of frame, hold.

## Frame 6 — Step 4: Score freshness

- scene: Same stage, node 4 lights — two freshness bars drain over a day axis: Slack drops fast, Notion barely moves
- voiceover: "Each match gets a freshness score. A Slack message goes stale fast. A Notion doc stays trusted much longer."
- duration: 6.933s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/06-freshness.html
- type: feature_showcase
- persuasion: Comparison of two options
- beat: foresight + surprise
- focal: the Slack bar draining fast beside the steady Notion bar
- roles: pipeline rail (step 4 lit) = supporting chrome · day counter = supporting · two bar-tracks with cobalt fills = foreground subject · score numerals + "Stale"/"Fresh" chips = foreground · formula line = supporting
- sfx: click-soft, impact-bass-1
- blueprint: dataviz-countup (Adapt)

narrativeRole: Shows the unusual idea in Corely — answers know how old their sources are.
keyMessage: Confidence decays per day by source type: Slack 2.0 points/day, Notion 0.2.

Adapt: keep the count-up signature (a number climbs while bars respond); the counter is days, and the bars drain instead of fill.
Scene 1 (0.0–1.2s): step 03 fades to done, 04 FRESHNESS fills cobalt; eyebrow "STEP 4 · FRESHNESS SCORE"; a muted formula line "score = 100 − days × rate" appears under it.
Scene 2 (1.2–3.6s): on "A Slack message goes stale fast", a full bar-track labelled "Slack · −2.0 / day" appears; a day counter "0 → 30 days" counts up (→ `counting-dynamic-scale`) while the Slack fill drains from 100 to 40 (→ `stat-bars-and-fills`); its score numeral counts down to 40 and a red inline chip "Stale" appears.
Scene 3 (3.6–5.3s): on "A Notion doc stays trusted", a second bar "Notion · −0.2 / day" appears beneath it and the same 30 days replays quickly: it drains only to 94; a green inline chip "Fresh" appears. Bar Ranking layout, left-aligned, bars ~60% of frame width.
Scene 4 (5.3–6.9s): held still — the 40 vs 94 contrast reads.

## Frame 7 — Step 5: Stream a cited answer

- scene: Same stage, node 5 lights — an answer streams in word by word with numbered citation chips; then a second empty query hits a 0.55 gate and returns "I don't know"
- voiceover: "Then GPT-4o streams the answer live, with citations. If nothing matches well enough — Corely says it doesn't know, instead of guessing."
- duration: 8.96s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/07-answer.html
- type: benefit_highlight
- persuasion: Demonstration + counterexample
- beat: confidence + trust
- focal: the streaming answer card with citation chips
- roles: pipeline rail (step 5 lit) = supporting chrome · answer card with streamed text = foreground subject · citation chips = foreground · "gpt-4o · streamed" tag = supporting · second query + 0.55 gate + "no knowledge" card = foreground (late)
- sfx: typing, error
- blueprint: prompt-type-submit-generate (Adapt)

narrativeRole: Pays off the pipeline: a live, cited answer — plus the hallucination guard.
keyMessage: Answers stream with sources; with no strong match the model is never called.

Adapt: keep the streaming-answer signature; add a second, failing query as the counterexample.
Scene 1 (0.0–1.0s): step 04 fades to done, 05 ANSWER fills cobalt; eyebrow "STEP 5 · ANSWER".
Scene 2 (1.0–4.2s): on "streams the answer live", a large `card-tinted` answer card (left 60%) fills word by word: "The team chose usage-based pricing [1], and confirmed it in #pricing [2]." (per-word reveal → `dynamic-content-sequencing`). On "with citations", two citation chips pop under it: "[1] Notion · Pricing memo · Fresh 94" and "[2] Slack · #pricing · Aged 72". A tag pill "gpt-4o · streamed" sits top-right of the card.
Scene 3 (4.2–6.2s): on "If nothing matches well enough", the answer card dims to 50%; on the right a small ask pill reads "What is the office wifi password?" and drops onto a gate line labelled "similarity > 0.55?"; the gate stays closed with a short red inline "no match".
Scene 4 (6.2–9.0s): on "says it doesn't know", a calm card appears on the right: "I don't have enough information about that." with a muted chip "model not called". Split layout 60/40, hold.

## Frame 8 — One simple stack

- scene: The whole pipeline zooms out into a tidy architecture map — one Next.js app, one Postgres database, OpenAI, optional Redis — inside a Docker box
- voiceover: "And it's all one Next.js app, one Postgres database, packaged in Docker."
- duration: 4.949s
- transition_in: crossfade
- status: animated
- src: compositions/frames/08-stack.html
- type: social_proof
- persuasion: Distillation + zoom-out reveal
- beat: mastery
- focal: the single "Next.js 15 app" box that holds everything
- roles: miniature pipeline rail = foreground (opening macro) · Next.js app box with three inner rows (Dashboard · 59 API routes · Connectors) = foreground subject · "Postgres + pgvector" card = foreground · "OpenAI" card = supporting · dashed "Redis · optional" card = supporting · dashed Docker outer frame = supporting
- sfx: whoosh-cinematic
- blueprint: zoom-out-workspace-reveal (Adapt)

narrativeRole: Zooms out from the flow to the whole system, showing how simple the footprint is.
keyMessage: The architecture is small: one app, one database, one container setup.

Adapt: keep the one continuous decelerating zoom-out signature; the "workspace" revealed is the architecture map.
Scene 1 (0.0–1.4s): open tight on the five-step pipeline rail (all steps done); one continuous decelerating zoom-out (→ `multi-phase-camera`) reveals the rail sits inside a rounded box labelled "Next.js 15 app · one Node process" with three inner rows: "Dashboard", "59 API routes", "Connectors".
Scene 2 (1.4–3.0s): on "one Postgres database", a database card "Postgres + pgvector · Supabase" draws in to the right with a cobalt link line; a smaller "OpenAI · embeddings + gpt-4o" card and a dashed "Redis · optional" card appear beside it.
Scene 3 (3.0–4.9s): on "packaged in Docker", a dashed outer frame draws around the app and Redis, tagged "docker compose" (→ `svg-path-draw`). Centered map ~70% of frame, hold.

## Frame 9 — Corely

- scene: Clean lockup — "Corely" wordmark, tagline "Your team's memory. With sources." on cream
- voiceover: "Corely. Your team's memory — with sources."
- duration: 2.411s
- transition_in: blur-crossfade
- status: animated
- src: compositions/frames/09-outro.html
- type: branding
- persuasion: Callback + distillation
- beat: "now I get it" + satisfaction
- focal: the "Corely" wordmark
- roles: wordmark = foreground subject · tagline = foreground · six small converging dots = supporting · concentric rings = background (dim ~30%)
- sfx: sparkle
- blueprint: logo-assemble-lockup (Reproduce)

narrativeRole: Lands the thesis in one line and calls back to the hub from frame 2.
keyMessage: Corely is your team's memory, and it always shows its sources.

Reproduce: six dots (the six sources) converge and the mark comes to exist.
Scene 1 (0.0–0.8s): faint concentric rings on cream; six small cobalt dots glide in from ring positions and merge at the center into the cobalt accent-line, and "Corely" resolves above it in `h1` near-black (smooth settle).
Scene 2 (0.8–1.9s): on "Your team's memory — with sources", the tagline reveals word by word in `h3` muted, with "with sources" in cobalt.
Scene 3 (1.9–2.4s): held lockup; the whole frame fades gently to cream at the very end (the video's only exit).
