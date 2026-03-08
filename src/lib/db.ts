import { neon } from '@neondatabase/serverless'

// Lazy — only connects on first query, not at build time
let _sql: ReturnType<typeof neon> | null = null
function getSql(): ReturnType<typeof neon> {
  if (!_sql) {
    const url = process.env.NETLIFY_DATABASE_URL
      || process.env.DATABASE_URL
      || (process.env.DB_HOST
        ? `postgresql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}/${process.env.DB_NAME}?sslmode=require`
        : null)
    if (!url) throw new Error('No database connection configured')
    _sql = neon(url)
  }
  return _sql
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function query(strings: TemplateStringsArray, ...values: any[]): Promise<any[]> {
  const sql = getSql()
  return sql(strings, ...values) as Promise<any[]>
}

// ── Schema bootstrap ──────────────────────────────────────────────────────────

export async function ensureTables() {
  await query`
    CREATE TABLE IF NOT EXISTS "Workflow" (
      id TEXT PRIMARY KEY,
      topic TEXT NOT NULL,
      format TEXT NOT NULL DEFAULT 'documentary',
      duration TEXT NOT NULL DEFAULT '5-10 minutes',
      status TEXT NOT NULL DEFAULT 'in_progress',
      "researchData" JSONB,
      storyline TEXT,
      "thumbnailKey" TEXT,
      "thumbnailUrl" TEXT,
      "videoUrl" TEXT,
      "publishedUrl" TEXT,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await query`
    CREATE TABLE IF NOT EXISTS "ResearchCache" (
      id TEXT PRIMARY KEY,
      "topicHash" TEXT UNIQUE NOT NULL,
      topic TEXT NOT NULL,
      data JSONB NOT NULL,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "expiresAt" TIMESTAMPTZ NOT NULL
    )
  `
}

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36)
}

// ── Workflow ──────────────────────────────────────────────────────────────────

async function workflowFindMany() {
  const rows = await query`SELECT * FROM "Workflow" ORDER BY "updatedAt" DESC LIMIT 50`
  return rows.map(rowToWorkflow)
}

async function workflowFindUnique(args: { where: { id: string } }) {
  const rows = await query`SELECT * FROM "Workflow" WHERE id = ${args.where.id} LIMIT 1`
  return rows[0] ? rowToWorkflow(rows[0]) : null
}

async function workflowCreate(args: { data: Record<string, unknown> }) {
  const d = args.data
  const id = (d.id as string) ?? cuid()
  const rows = await query`
    INSERT INTO "Workflow" (id, topic, format, duration, status, "researchData", storyline, "thumbnailKey", "thumbnailUrl", "videoUrl", "publishedUrl", "createdAt", "updatedAt")
    VALUES (
      ${id},
      ${d.topic as string},
      ${(d.format as string) ?? 'documentary'},
      ${(d.duration as string) ?? '5-10 minutes'},
      ${(d.status as string) ?? 'in_progress'},
      ${d.researchData ? JSON.stringify(d.researchData) : null},
      ${(d.storyline as string) ?? null},
      ${(d.thumbnailKey as string) ?? null},
      ${(d.thumbnailUrl as string) ?? null},
      ${(d.videoUrl as string) ?? null},
      ${(d.publishedUrl as string) ?? null},
      NOW(), NOW()
    )
    RETURNING *
  `
  return rowToWorkflow(rows[0])
}

async function workflowUpdate(args: { where: { id: string }; data: Record<string, unknown> }) {
  const d = args.data
  const rows = await query`
    UPDATE "Workflow" SET
      topic          = COALESCE(${(d.topic as string) ?? null}, topic),
      format         = COALESCE(${(d.format as string) ?? null}, format),
      duration       = COALESCE(${(d.duration as string) ?? null}, duration),
      status         = COALESCE(${(d.status as string) ?? null}, status),
      "researchData" = COALESCE(${d.researchData !== undefined ? JSON.stringify(d.researchData) : null}::jsonb, "researchData"),
      storyline      = COALESCE(${(d.storyline as string) ?? null}, storyline),
      "thumbnailKey" = COALESCE(${(d.thumbnailKey as string) ?? null}, "thumbnailKey"),
      "thumbnailUrl" = COALESCE(${(d.thumbnailUrl as string) ?? null}, "thumbnailUrl"),
      "videoUrl"     = COALESCE(${(d.videoUrl as string) ?? null}, "videoUrl"),
      "publishedUrl" = COALESCE(${(d.publishedUrl as string) ?? null}, "publishedUrl"),
      "updatedAt"    = NOW()
    WHERE id = ${args.where.id}
    RETURNING *
  `
  return rowToWorkflow(rows[0])
}

async function workflowDelete(args: { where: { id: string } }) {
  await query`DELETE FROM "Workflow" WHERE id = ${args.where.id}`
}

// ── ResearchCache ─────────────────────────────────────────────────────────────

async function researchCacheFindUnique(args: { where: { topicHash: string } }) {
  const rows = await query`
    SELECT * FROM "ResearchCache"
    WHERE "topicHash" = ${args.where.topicHash} AND "expiresAt" > NOW()
    LIMIT 1
  `
  return rows[0] ? rowToCache(rows[0]) : null
}

async function researchCacheUpsert(args: { where: { topicHash: string }; create: Record<string, unknown>; update: Record<string, unknown> }) {
  const c = args.create
  const id = (c.id as string) ?? cuid()
  const rows = await query`
    INSERT INTO "ResearchCache" (id, "topicHash", topic, data, "createdAt", "expiresAt")
    VALUES (${id}, ${c.topicHash as string}, ${c.topic as string}, ${JSON.stringify(c.data)}::jsonb, NOW(), ${c.expiresAt as string})
    ON CONFLICT ("topicHash") DO UPDATE SET
      data = EXCLUDED.data,
      "expiresAt" = EXCLUDED."expiresAt"
    RETURNING *
  `
  return rowToCache(rows[0])
}

// ── Row mappers ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToWorkflow(r: any) {
  return {
    id: r.id, topic: r.topic, format: r.format, duration: r.duration,
    status: r.status, researchData: r.researchData ?? null,
    storyline: r.storyline ?? null, thumbnailKey: r.thumbnailKey ?? null,
    thumbnailUrl: r.thumbnailUrl ?? null, videoUrl: r.videoUrl ?? null,
    publishedUrl: r.publishedUrl ?? null,
    createdAt: r.createdAt, updatedAt: r.updatedAt,
  }
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToCache(r: any) {
  return { id: r.id, topicHash: r.topicHash, topic: r.topic, data: r.data, createdAt: r.createdAt, expiresAt: r.expiresAt }
}

// ── Export ────────────────────────────────────────────────────────────────────

export const db = {
  workflow: {
    findMany: workflowFindMany,
    findUnique: workflowFindUnique,
    create: workflowCreate,
    update: workflowUpdate,
    delete: workflowDelete,
  },
  researchCache: {
    findUnique: researchCacheFindUnique,
    upsert: researchCacheUpsert,
  },
}
