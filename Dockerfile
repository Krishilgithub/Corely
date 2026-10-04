# syntax=docker/dockerfile:1

# Dockerfile for Corely (Next.js App Router + Prisma + pgvector).
#
# It builds in three steps so the final image does not keep the npm cache.
#
# Build it:
#   docker build -t corely .
#
# Run it (add your env file when you have one):
#   docker run --rm -p 3000:3000 --env-file .env corely
#
# The app needs a Postgres database with the pgvector extension.
# It does not run one for you. Point DATABASE_URL at your database.


# ---------------------------------------------------------------------------
# Step 1: install packages
# ---------------------------------------------------------------------------
# Debian ("bookworm-slim"), not Alpine. Prisma uses a native engine file here
# because prisma/schema.prisma sets engineType = "library". That engine needs
# OpenSSL, which Debian provides without extra work.
FROM node:22-bookworm-slim AS deps

# OpenSSL is what the Prisma engine needs. ca-certificates lets the app make
# HTTPS calls to OpenAI, Supabase, Notion, Slack and the other providers.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only the package files first. Docker then reuses this whole layer on
# later builds as long as these two files do not change, so you do not
# reinstall every package after every code edit.
COPY package.json package-lock.json ./

# "npm ci" installs the exact versions from package-lock.json.
#
# We install dev packages too, and we keep them in the final image on purpose.
# Three packages the running app needs are listed under devDependencies in
# package.json: @prisma/adapter-pg and pg (lib/db.ts imports both), and tsx
# (npm run worker uses it). Dropping dev packages would break the app at start.
# See the note at the bottom of this file.
RUN npm ci


# ---------------------------------------------------------------------------
# Step 2: build the app
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS builder

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Turn off Next.js usage tracking so the build does not call home.
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Give Node more memory for the build.
# Without this the build dies with "JavaScript heap out of memory" while it
# checks TypeScript types. Node allows about 2 GB by default, and this project
# needs more than that. 4 GB is enough. Make sure Docker itself is allowed at
# least 5 GB, or this step is killed again.
ENV NODE_OPTIONS=--max-old-space-size=4096

# "npm run build" runs "prisma generate" and then "next build".
#
# No database and no API keys are needed here. Every env variable in this
# project has a dummy fallback value, and the one page that reads the database
# (app/dashboard/page.tsx) sets "force-dynamic", so Next.js does not try to
# render it during the build.
RUN npm run build

# Throw away the build leftovers.
# .next/cache is the cache Next.js keeps to make the *next* build faster. The
# running app never reads it, and here it is about 964 MB, so keeping it would
# nearly double the image. .next/trace and .next/types are build notes only.
RUN rm -rf .next/cache .next/trace .next/types


# ---------------------------------------------------------------------------
# Step 3: the image you actually run
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS runner

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy the finished app from the build step.
#
# We copy the whole folder, including node_modules and the source files.
# Two parts of this project load files at run time instead of at build time,
# so trimming the folder would break them:
#   - app/api/sources/upload/route.ts calls require("pdf-parse") and looks up
#     pdfjs-dist/legacy/build/pdf.worker.mjs while handling an upload.
#   - workers/index.ts runs straight from TypeScript through tsx.
COPY --from=builder --chown=node:node /app ./

# Run as a normal user, not root. The node image already has a "node" user.
USER node

EXPOSE 3000

# Start the web app. To run the background worker instead, override this:
#   docker run --rm --env-file .env corely npm run worker
CMD ["npm", "run", "start"]


# ---------------------------------------------------------------------------
# Notes
# ---------------------------------------------------------------------------
#
# 1. Env variables
#    Pass them when you run the container: --env-file .env
#    No rebuild is needed after changing them. Every NEXT_PUBLIC_* value in
#    this project is only read on the server, so none of them get frozen into
#    the browser files during the build.
#
# 2. Database setup
#    A fresh database cannot answer questions until the pgvector bits exist.
#    Run these once against your database, from inside a container:
#      docker run --rm --env-file .env corely npx prisma db push
#      docker run --rm --env-file .env corely npx tsx scripts/init-pgvector.ts
#    The second one is required. "prisma db push" cannot create the embedding
#    column, because prisma/schema.prisma marks it as Unsupported("vector").
#
# 3. Image size
#    The image is about 2.6 GB. Roughly 1.7 GB of that is node_modules. The
#    biggest single packages are @next (274 MB), googleapis (203 MB),
#    @prisma (163 MB), next (156 MB) and react-icons (84 MB).
#
#    To shrink it further, move these three packages from devDependencies to
#    dependencies in package.json, because the running app needs them:
#      @prisma/adapter-pg   imported by lib/db.ts
#      pg                   imported by lib/db.ts
#      tsx                  used by "npm run worker"
#    Once they sit in the right place, step 3 can install with
#    "npm ci --omit=dev" and leave out build-only packages such as typescript.
