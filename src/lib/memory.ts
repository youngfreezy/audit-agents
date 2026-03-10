/**
 * Postgres-backed memory for the Moltbook self-improvement loop.
 *
 * Stores audit results, engagement metrics, prompt patches, dream entries,
 * and discovery preferences in a single JSONB row in Vercel Postgres.
 *
 * Falls back to file-based storage (memory-file.ts) when POSTGRES_URL
 * is not configured (local development).
 */

import { sql } from "@vercel/postgres";
import * as fileMemory from "./memory-file";

// ---------------------------------------------------------------------------
// Re-export types (unchanged)
// ---------------------------------------------------------------------------

export type {
  AuditRecord,
  PromptPatch,
  DiscoveryPreferences,
  DreamEntry,
  MemoryData,
} from "./memory-file";

import type { MemoryData, AuditRecord, DiscoveryPreferences } from "./memory-file";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_PROMPT_PATCHES = 20;
const MIN_SIGNAL_COUNT = 5;
const HUMAN_REVIEW_THRESHOLD = 15;

// ---------------------------------------------------------------------------
// Postgres detection & schema init
// ---------------------------------------------------------------------------

const usePostgres = !!(
  process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING
);

let schemaInitialized = false;

async function ensureSchema(): Promise<void> {
  if (schemaInitialized) return;
  await sql`
    CREATE TABLE IF NOT EXISTS moltbook_memory (
      id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      data JSONB NOT NULL DEFAULT '{}',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
  schemaInitialized = true;
}

function defaultMemory(): MemoryData {
  return {
    auditRecords: [],
    promptPatches: [],
    discoveryPreferences: {
      preferredIndustries: [],
      preferredDomains: [],
      avoidPatterns: [],
    },
    lastUpdated: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Core load / save
// ---------------------------------------------------------------------------

export async function loadMemory(): Promise<MemoryData> {
  if (!usePostgres) return fileMemory.loadMemory();
  await ensureSchema();
  const { rows } = await sql`SELECT data FROM moltbook_memory WHERE id = 1`;
  if (rows.length === 0) return defaultMemory();
  return rows[0].data as MemoryData;
}

export async function saveMemory(memory: MemoryData): Promise<void> {
  if (!usePostgres) {
    fileMemory.saveMemory(memory);
    return;
  }
  await ensureSchema();
  memory.lastUpdated = new Date().toISOString();
  const data = JSON.stringify(memory);
  await sql`
    INSERT INTO moltbook_memory (id, data, updated_at)
    VALUES (1, ${data}::jsonb, now())
    ON CONFLICT (id) DO UPDATE SET data = ${data}::jsonb, updated_at = now()
  `;
}

// ---------------------------------------------------------------------------
// Audit records
// ---------------------------------------------------------------------------

export async function addAuditRecord(record: AuditRecord): Promise<void> {
  const memory = await loadMemory();
  memory.auditRecords.push(record);
  if (memory.auditRecords.length > 200) {
    memory.auditRecords = memory.auditRecords.slice(-200);
  }
  await saveMemory(memory);
}

export async function updateEngagement(
  postId: string,
  upvotes: number,
  downvotes: number,
  comments: number
): Promise<void> {
  const memory = await loadMemory();
  const record = memory.auditRecords.find((r) => r.postId === postId);
  if (record) {
    record.engagement = { upvotes, downvotes, comments };
    await saveMemory(memory);
  }
}

// ---------------------------------------------------------------------------
// Prompt patches
// ---------------------------------------------------------------------------

export async function addPromptPatch(
  patch: string,
  reason: string,
  signalCount: number
): Promise<boolean> {
  if (signalCount < MIN_SIGNAL_COUNT) {
    console.warn(
      `[memory] Rejected prompt patch: signalCount ${signalCount} < ${MIN_SIGNAL_COUNT}`
    );
    return false;
  }

  const memory = await loadMemory();
  const needsReview = memory.promptPatches.length >= HUMAN_REVIEW_THRESHOLD;

  const entry = {
    id: `patch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    patch,
    reason,
    signalCount,
    createdAt: new Date().toISOString(),
    humanReviewed: false,
  };

  memory.promptPatches.push(entry);

  if (memory.promptPatches.length > MAX_PROMPT_PATCHES) {
    const removed = memory.promptPatches.shift();
    console.warn(`[memory] Rotated out oldest prompt patch: ${removed?.id}`);
  }

  if (needsReview) {
    console.warn(
      `[memory] HUMAN REVIEW NEEDED: ${memory.promptPatches.length} prompt patches accumulated.`
    );
  }

  await saveMemory(memory);
  return true;
}

export async function getPromptPatches(): Promise<string[]> {
  const memory = await loadMemory();
  return memory.promptPatches.map((p) => p.patch);
}

// ---------------------------------------------------------------------------
// Audit record queries
// ---------------------------------------------------------------------------

export async function getRecentAuditRecords(
  limit: number = 10
): Promise<AuditRecord[]> {
  const memory = await loadMemory();
  return memory.auditRecords.slice(-limit);
}

// ---------------------------------------------------------------------------
// Discovery preferences
// ---------------------------------------------------------------------------

export async function getDiscoveryPreferences(): Promise<DiscoveryPreferences> {
  const memory = await loadMemory();
  return memory.discoveryPreferences;
}

export async function updateDiscoveryPreferences(
  prefs: Partial<DiscoveryPreferences>
): Promise<void> {
  const memory = await loadMemory();
  Object.assign(memory.discoveryPreferences, prefs);
  await saveMemory(memory);
}
