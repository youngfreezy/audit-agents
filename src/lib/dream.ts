/**
 * Dream cycle — sleep-time compute / memory consolidation for the Moltbook loop.
 *
 * Periodically (every ~5 cron cycles) the agent enters a "dream" state where it:
 *  1. Reviews recent audit records and engagement data
 *  2. Reflects on what worked vs didn't (via LLM call)
 *  3. Consolidates insights into compressed, durable learnings
 *  4. Prunes stale or contradictory prompt patches
 *  5. Stores consolidated insights in memory for future prompt injection
 *
 * Dreams are deeper reflection, not reactive signal processing.
 *
 * SECURITY: All LLM dream outputs are sanitized before storage.
 */

import Anthropic from "@anthropic-ai/sdk";
import { sanitize } from "@/lib/sanitize";
import {
  loadMemory,
  saveMemory,
  getRecentAuditRecords,
  getPromptPatches,
  type MemoryData,
  type AuditRecord,
  type PromptPatch,
} from "@/lib/memory";

const MAX_DREAM_LOGS = 10;

export interface DreamEntry {
  id: string;
  insights: string[];
  createdAt: string;
}

/**
 * Run a dream cycle — deep reflection on recent activity.
 *
 * Loads recent audit records + engagement, calls Claude for reflection,
 * sanitizes the output, stores consolidated insights, and prunes
 * contradictory prompt patches.
 */
export async function runDreamCycle(): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[dream] ANTHROPIC_API_KEY not configured — skipping dream cycle");
    return;
  }

  const memory = loadMemory();
  const recentRecords = getRecentAuditRecords(20);

  if (recentRecords.length === 0) {
    console.log("[dream] No recent audit records — skipping dream cycle");
    return;
  }

  // Build context for the reflection prompt
  const recordSummaries = recentRecords.map((r) => {
    const net = r.engagement.upvotes - r.engagement.downvotes;
    return (
      `- ${r.auditType} audit of ${r.url}: score=${r.overallScore}, ` +
      `votes=${net} (up=${r.engagement.upvotes}, down=${r.engagement.downvotes}), ` +
      `comments=${r.engagement.comments}` +
      (r.summary ? ` — "${r.summary.slice(0, 100)}"` : "")
    );
  });

  const patches = getPromptPatches();
  const patchContext =
    patches.length > 0
      ? `\n\nCurrent prompt patches:\n${patches.map((p, i) => `${i + 1}. ${p}`).join("\n")}`
      : "\n\nNo active prompt patches.";

  const previousDreams = getDreamInsights(memory);
  const dreamHistory =
    previousDreams.length > 0
      ? `\n\nPrevious consolidated insights:\n${previousDreams.map((d, i) => `${i + 1}. ${d}`).join("\n")}`
      : "";

  const reflectionPrompt = `Review these recent audits and their community reception. What patterns do you see? Which audit dimensions resonated most? What should I focus on? Compress your insights into 3-5 bullet points.

Recent audit activity:
${recordSummaries.join("\n")}
${patchContext}
${dreamHistory}

Respond with ONLY a JSON array of 3-5 insight strings. Example:
["insight 1", "insight 2", "insight 3"]

Do not include any text outside the JSON array.`;

  try {
    console.log("[dream] Starting dream cycle — reflecting on %d recent audits...", recentRecords.length);

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system:
        "You are a reflective meta-analyst. Your job is to find patterns in audit performance data " +
        "and community reception, then compress your analysis into concise, actionable bullet points. " +
        "Be specific and evidence-based. Output only a JSON array of strings.",
      messages: [{ role: "user", content: reflectionPrompt }],
    });

    const rawText =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse the JSON array from the response
    let jsonStr = rawText.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.split("\n").slice(1).join("\n");
      if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3);
      jsonStr = jsonStr.trim();
    }

    const rawInsights: unknown = JSON.parse(jsonStr);
    if (!Array.isArray(rawInsights)) {
      console.error("[dream] LLM did not return a JSON array — skipping");
      return;
    }

    // Sanitize each insight before storage
    const insights: string[] = rawInsights
      .filter((item): item is string => typeof item === "string")
      .slice(0, 5)
      .map((insight) => sanitize(insight, { maxLength: 300 }))
      .filter((s) => s.length > 0);

    if (insights.length === 0) {
      console.warn("[dream] All insights were empty after sanitization — skipping");
      return;
    }

    // Store the dream entry
    const dreamEntry: DreamEntry = {
      id: `dream_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      insights,
      createdAt: new Date().toISOString(),
    };

    if (!memory.dreamLog) {
      memory.dreamLog = [];
    }
    memory.dreamLog.push(dreamEntry);

    // Cap at MAX_DREAM_LOGS, remove oldest
    while (memory.dreamLog.length > MAX_DREAM_LOGS) {
      const removed = memory.dreamLog.shift();
      console.log("[dream] Rotated out oldest dream entry: %s", removed?.id);
    }

    // Prune prompt patches that contradict dream insights
    _pruneContradictoryPatches(memory, insights);

    saveMemory(memory);

    console.log(
      "[dream] Dream cycle complete — stored %d insights, %d total dream entries",
      insights.length,
      memory.dreamLog.length
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[dream] Dream cycle failed:", msg);
  }
}

/**
 * Get the latest dream insights for injection into prompts.
 * Returns an array of insight strings from the most recent dream.
 */
export function getDreamInsights(memory?: MemoryData): string[] {
  const mem = memory || loadMemory();
  if (!mem.dreamLog || mem.dreamLog.length === 0) return [];

  // Return insights from the most recent dream
  const latest = mem.dreamLog[mem.dreamLog.length - 1];
  return latest.insights;
}

/**
 * Prune prompt patches that are contradicted by dream insights.
 *
 * A patch is considered contradictory if a dream insight explicitly
 * suggests the opposite direction (e.g., dream says "be more lenient"
 * but patch says "be more conservative"). Uses simple keyword overlap.
 *
 * Dreams cannot override the 5+ signal threshold — they only prune
 * patches that already exist.
 */
function _pruneContradictoryPatches(
  memory: MemoryData,
  insights: string[]
): void {
  if (!memory.promptPatches || memory.promptPatches.length === 0) return;
  if (insights.length === 0) return;

  const insightText = insights.join(" ").toLowerCase();
  const originalCount = memory.promptPatches.length;

  // Define contradiction pairs
  const contradictions: [string, string][] = [
    ["more conservative", "more generous"],
    ["more generous", "more conservative"],
    ["more lenient", "more strict"],
    ["more strict", "more lenient"],
    ["too harsh", "too lenient"],
    ["too lenient", "too harsh"],
    ["raise scores", "lower scores"],
    ["lower scores", "raise scores"],
  ];

  memory.promptPatches = memory.promptPatches.filter((patch) => {
    const patchLower = patch.patch.toLowerCase();
    for (const [insightSignal, patchSignal] of contradictions) {
      if (insightText.includes(insightSignal) && patchLower.includes(patchSignal)) {
        console.log(
          "[dream] Pruning contradictory patch %s: dream says '%s' but patch says '%s'",
          patch.id,
          insightSignal,
          patchSignal
        );
        return false;
      }
    }
    return true;
  });

  const pruned = originalCount - memory.promptPatches.length;
  if (pruned > 0) {
    console.log("[dream] Pruned %d contradictory prompt patches", pruned);
  }
}
