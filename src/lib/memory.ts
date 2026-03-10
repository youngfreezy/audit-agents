/**
 * Simple JSON file-based memory for the Moltbook self-improvement loop.
 *
 * Stores audit results, engagement metrics, prompt patches, and
 * discovery preferences. File persisted at data/memory.json.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "data");
const MEMORY_FILE = join(DATA_DIR, "memory.json");

const MAX_PROMPT_PATCHES = 20;
const MIN_SIGNAL_COUNT = 5;
const HUMAN_REVIEW_THRESHOLD = 15;

export interface AuditRecord {
  postId: string;
  url: string;
  auditType: "architecture" | "ux-revenue" | "growth";
  overallScore: number;
  summary: string;
  createdAt: string;
  engagement: {
    upvotes: number;
    downvotes: number;
    comments: number;
  };
}

export interface PromptPatch {
  id: string;
  patch: string;
  reason: string;
  signalCount: number;
  createdAt: string;
  humanReviewed: boolean;
}

export interface DiscoveryPreferences {
  preferredIndustries: string[];
  preferredDomains: string[];
  avoidPatterns: string[];
}

export interface MemoryData {
  auditRecords: AuditRecord[];
  promptPatches: PromptPatch[];
  discoveryPreferences: DiscoveryPreferences;
  lastUpdated: string;
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

function ensureDataDir(): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function loadMemory(): MemoryData {
  ensureDataDir();
  if (!existsSync(MEMORY_FILE)) {
    return defaultMemory();
  }
  try {
    const raw = readFileSync(MEMORY_FILE, "utf-8");
    return JSON.parse(raw) as MemoryData;
  } catch (e) {
    console.error("[memory] Failed to load memory file, using defaults:", e);
    return defaultMemory();
  }
}

export function saveMemory(memory: MemoryData): void {
  ensureDataDir();
  memory.lastUpdated = new Date().toISOString();
  writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2), "utf-8");
}

export function addAuditRecord(record: AuditRecord): void {
  const memory = loadMemory();
  memory.auditRecords.push(record);
  // Keep last 200 records
  if (memory.auditRecords.length > 200) {
    memory.auditRecords = memory.auditRecords.slice(-200);
  }
  saveMemory(memory);
}

export function updateEngagement(
  postId: string,
  upvotes: number,
  downvotes: number,
  comments: number
): void {
  const memory = loadMemory();
  const record = memory.auditRecords.find((r) => r.postId === postId);
  if (record) {
    record.engagement = { upvotes, downvotes, comments };
    saveMemory(memory);
  }
}

/**
 * Add a prompt patch. Only accepts patches with signalCount >= 5.
 * Oldest patches are rotated out when max (20) is reached.
 * Patches are append-only; a human review flag is set when count
 * exceeds the threshold.
 */
export function addPromptPatch(
  patch: string,
  reason: string,
  signalCount: number
): boolean {
  if (signalCount < MIN_SIGNAL_COUNT) {
    console.warn(
      `[memory] Rejected prompt patch: signalCount ${signalCount} < ${MIN_SIGNAL_COUNT}`
    );
    return false;
  }

  const memory = loadMemory();

  const needsReview = memory.promptPatches.length >= HUMAN_REVIEW_THRESHOLD;

  const entry: PromptPatch = {
    id: `patch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    patch,
    reason,
    signalCount,
    createdAt: new Date().toISOString(),
    humanReviewed: false,
  };

  memory.promptPatches.push(entry);

  // Rotate oldest if over max
  if (memory.promptPatches.length > MAX_PROMPT_PATCHES) {
    const removed = memory.promptPatches.shift();
    console.warn(`[memory] Rotated out oldest prompt patch: ${removed?.id}`);
  }

  if (needsReview) {
    console.warn(
      `[memory] HUMAN REVIEW NEEDED: ${memory.promptPatches.length} prompt patches accumulated. ` +
        `Review data/memory.json to verify patch quality.`
    );
  }

  saveMemory(memory);
  return true;
}

/**
 * Returns accumulated prompt patches as an array of strings
 * for injection into system prompts.
 */
export function getPromptPatches(): string[] {
  const memory = loadMemory();
  return memory.promptPatches.map((p) => p.patch);
}

export function getRecentAuditRecords(limit: number = 10): AuditRecord[] {
  const memory = loadMemory();
  return memory.auditRecords.slice(-limit);
}

export function getDiscoveryPreferences(): DiscoveryPreferences {
  const memory = loadMemory();
  return memory.discoveryPreferences;
}

export function updateDiscoveryPreferences(
  prefs: Partial<DiscoveryPreferences>
): void {
  const memory = loadMemory();
  Object.assign(memory.discoveryPreferences, prefs);
  saveMemory(memory);
}
