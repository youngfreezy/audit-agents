/**
 * Vercel Cron handler for the Moltbook self-improvement loop.
 *
 * Runs every 30 minutes:
 *  1. Read Moltbook feed for URLs/topics to audit
 *  2. Pick a target URL
 *  3. Run an audit (architecture, UX, or growth)
 *  4. Post result to Moltbook + solve verification
 *  5. Update engagement data on recent posts
 *  6. Generate prompt patches when feedback accumulates
 *
 * SECURITY: All Moltbook content is sanitized before any use.
 */

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { analyzePage, formatAnalysisForLLM } from "@/lib/web-analyzer";
import {
  ARCHITECTURE_SYSTEM_PROMPT,
  UX_REVENUE_SYSTEM_PROMPT,
  GROWTH_MONETIZATION_SYSTEM_PROMPT,
} from "@/lib/prompts";
import { sanitize } from "@/lib/sanitize";
import {
  getFeed,
  createPost,
  getPost,
  type MoltbookPost,
} from "@/lib/moltbook-client";
import {
  loadMemory,
  saveMemory,
  addAuditRecord,
  updateEngagement,
  addPromptPatch,
  getPromptPatches,
  getRecentAuditRecords,
} from "@/lib/memory";
import { runDreamCycle, getDreamInsights } from "@/lib/dream";
import type {
  ArchitecturalAuditReport,
  UXRevenueReport,
  GrowthMonetizationReport,
} from "@/lib/types";

export const maxDuration = 120;

// ---------------------------------------------------------------------------
// URL extraction from feed content
// ---------------------------------------------------------------------------

const URL_RE = /https?:\/\/[^\s)>\]"']+/gi;

function extractUrlsFromFeed(posts: MoltbookPost[]): string[] {
  const urls = new Set<string>();
  for (const post of posts) {
    // SECURITY: we only extract URLs here, the actual content
    // is sanitized before any LLM use
    const content = post.content || "";
    const matches = content.match(URL_RE) || [];
    for (const url of matches) {
      // Skip moltbook URLs and common non-auditable domains
      const lower = url.toLowerCase();
      if (
        lower.includes("moltbook.com") ||
        lower.includes("twitter.com") ||
        lower.includes("x.com") ||
        lower.includes("youtube.com") ||
        lower.includes("reddit.com")
      ) {
        continue;
      }
      urls.add(url.replace(/[.,;:!?]+$/, "")); // strip trailing punctuation
    }
  }
  return Array.from(urls);
}

// ---------------------------------------------------------------------------
// Audit execution (reuses the same logic as the API routes)
// ---------------------------------------------------------------------------

type AuditType = "architecture" | "ux-revenue" | "growth";

const AUDIT_TYPES: AuditType[] = ["architecture", "ux-revenue", "growth"];

function pickAuditType(): AuditType {
  // Rotate through types based on recent history
  const recent = getRecentAuditRecords(3);
  const recentTypes = recent.map((r) => r.auditType);

  for (const t of AUDIT_TYPES) {
    if (!recentTypes.includes(t)) return t;
  }
  // All used recently — pick randomly
  return AUDIT_TYPES[Math.floor(Math.random() * AUDIT_TYPES.length)];
}

function getSystemPrompt(auditType: AuditType): string {
  const patches = getPromptPatches();
  const dreams = getDreamInsights();
  switch (auditType) {
    case "architecture":
      return ARCHITECTURE_SYSTEM_PROMPT(patches, dreams);
    case "ux-revenue":
      return UX_REVENUE_SYSTEM_PROMPT(patches, dreams);
    case "growth":
      return GROWTH_MONETIZATION_SYSTEM_PROMPT(patches, dreams);
  }
}

function getUserMessage(auditType: AuditType, context: string): string {
  switch (auditType) {
    case "architecture":
      return (
        "Perform a comprehensive architectural audit of the following system.\n\n" +
        context
      );
    case "ux-revenue":
      return (
        "Analyze this product and deliver your verdict: Will it get paid users?\n\n" +
        "Be brutally honest. Use specific evidence from the product itself.\n\n" +
        context
      );
    case "growth":
      return (
        "Analyze this product's growth potential and monetization strategy. " +
        "Be brutally honest. Use specific evidence from the product itself.\n\n" +
        context
      );
  }
}

async function runAudit(
  url: string,
  auditType: AuditType
): Promise<{
  report: ArchitecturalAuditReport | UXRevenueReport | GrowthMonetizationReport;
  score: number;
  summary: string;
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not configured");

  const analysis = await analyzePage(url);
  const context = [
    `# Audit Target: ${url}`,
    "",
    formatAnalysisForLLM(analysis),
  ]
    .join("\n")
    .slice(0, 180000);

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    system: getSystemPrompt(auditType),
    messages: [{ role: "user", content: getUserMessage(auditType, context) }],
  });

  const rawText =
    response.content[0].type === "text" ? response.content[0].text : "";
  let jsonStr = rawText.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.split("\n").slice(1).join("\n");
    if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3);
  }

  const report = JSON.parse(jsonStr);

  const score =
    report.overall_score ?? report.overall_ux_score ?? 0;
  const summary = report.summary ?? "";

  return { report, score, summary };
}

// ---------------------------------------------------------------------------
// Format audit result as a Moltbook post
// ---------------------------------------------------------------------------

function formatPostContent(
  url: string,
  auditType: AuditType,
  score: number,
  summary: string,
  report: Record<string, unknown>
): string {
  const typeLabel = {
    architecture: "Architecture Audit",
    "ux-revenue": "UX & Revenue Audit",
    growth: "Growth & Monetization Audit",
  }[auditType];

  const parts = [
    `${typeLabel}: ${url}`,
    `Score: ${score}/100`,
    "",
    summary,
  ];

  // Add top findings/risks
  const risks =
    (report.top_risks as Array<{ title: string; severity: string }>) || [];
  const improvements =
    (report.top_improvements as string[]) ||
    (report.top_growth_actions as string[]) ||
    [];

  if (risks.length > 0) {
    parts.push("", "Key Risks:");
    for (const r of risks.slice(0, 3)) {
      parts.push(`- [${r.severity}] ${r.title}`);
    }
  }

  if (improvements.length > 0) {
    parts.push("", "Top Recommendations:");
    for (const imp of improvements.slice(0, 3)) {
      parts.push(`- ${imp}`);
    }
  }

  const strengths = (report.strengths as string[]) || [];
  if (strengths.length > 0) {
    parts.push("", "Strengths:");
    for (const s of strengths.slice(0, 3)) {
      parts.push(`- ${s}`);
    }
  }

  // Truncate to reasonable post length
  return parts.join("\n").slice(0, 2000);
}

// ---------------------------------------------------------------------------
// Engagement tracking & prompt patch generation
// ---------------------------------------------------------------------------

async function updateRecentEngagement(): Promise<void> {
  const records = getRecentAuditRecords(10);
  for (const record of records) {
    if (!record.postId) continue;
    try {
      const post = await getPost(record.postId);
      updateEngagement(
        record.postId,
        post.upvotes ?? 0,
        post.downvotes ?? 0,
        post.comments?.length ?? 0
      );
    } catch (e) {
      console.warn(
        `[cron] Failed to fetch engagement for post ${record.postId}:`,
        e
      );
    }
  }
}

async function maybeGeneratePromptPatch(): Promise<void> {
  const memory = loadMemory();
  const records = memory.auditRecords.slice(-20);

  // Count negative signals: posts with more downvotes than upvotes,
  // or comments containing criticism
  let negativeSignals = 0;
  let positiveSignals = 0;
  const feedbackTopics: string[] = [];

  for (const r of records) {
    const { upvotes, downvotes, comments } = r.engagement;
    if (downvotes > upvotes) {
      negativeSignals += downvotes - upvotes;
      feedbackTopics.push(
        `Post on ${r.url} (score: ${r.overallScore}) got ${downvotes} downvotes vs ${upvotes} upvotes`
      );
    } else if (upvotes > downvotes) {
      positiveSignals += upvotes - downvotes;
    }
    if (comments > 0) {
      negativeSignals += 1; // Comments often contain calibration feedback
      feedbackTopics.push(`Post on ${r.url} received ${comments} comments`);
    }
  }

  const totalSignals = negativeSignals + positiveSignals;
  if (totalSignals < 5) {
    console.log(
      `[cron] Not enough signals for prompt patch (${totalSignals} < 5)`
    );
    return;
  }

  // If negative signals dominate, generate a calibration patch
  if (negativeSignals > positiveSignals) {
    // Fetch actual comment content for analysis
    const commentTexts: string[] = [];
    for (const r of records.slice(-5)) {
      if (!r.postId || r.engagement.comments === 0) continue;
      try {
        const post = await getPost(r.postId);
        for (const c of post.comments || []) {
          // SECURITY: sanitize all external content
          const clean = sanitize(c.content || "", { maxLength: 200 });
          if (clean) commentTexts.push(clean);
        }
      } catch {
        // skip
      }
    }

    const patchReason = [
      `${negativeSignals} negative signals vs ${positiveSignals} positive.`,
      feedbackTopics.slice(0, 3).join("; "),
      commentTexts.length > 0
        ? `Sample feedback: ${commentTexts.slice(0, 3).join(" | ")}`
        : "",
    ]
      .filter(Boolean)
      .join(" ");

    // Generate a calibration adjustment
    const patch = generateCalibrationPatch(
      negativeSignals,
      positiveSignals,
      commentTexts
    );

    addPromptPatch(patch, patchReason, totalSignals);
    console.log(`[cron] Added prompt patch: ${patch.slice(0, 100)}...`);
  }
}

function generateCalibrationPatch(
  negativeSignals: number,
  positiveSignals: number,
  feedbackSamples: string[]
): string {
  const ratio = negativeSignals / Math.max(positiveSignals, 1);

  if (ratio > 3) {
    return (
      "Calibration: Recent community feedback indicates scores are significantly " +
      "miscalibrated. Be more conservative with high scores and more generous " +
      "with acknowledging effort in early-stage products."
    );
  }

  if (ratio > 1.5) {
    return (
      "Calibration: Community feedback suggests scoring could be more nuanced. " +
      "Ensure scores reflect realistic expectations for the product's stage " +
      "and market context."
    );
  }

  // Generic feedback-based patch
  const themes = feedbackSamples.length > 0
    ? ` Themes from feedback: ${feedbackSamples.slice(0, 2).join("; ")}.`
    : "";

  return (
    "Calibration: Incorporate community signals when scoring — " +
    "practical actionability of recommendations matters as much as technical accuracy." +
    themes
  );
}

// ---------------------------------------------------------------------------
// Main cron handler
// ---------------------------------------------------------------------------

export async function GET(req: Request): Promise<NextResponse> {
  // Verify CRON_SECRET
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[cron] CRON_SECRET not configured");
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn("[cron] Unauthorized cron request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Read feed for URLs to audit
    console.log("[cron] Fetching Moltbook feed...");
    const feed = await getFeed();
    const candidateUrls = extractUrlsFromFeed(feed.posts || []);
    console.log(
      `[cron] Found ${candidateUrls.length} candidate URLs from feed`
    );

    // Filter out already-audited URLs
    const memory = loadMemory();
    const auditedUrls = new Set(memory.auditRecords.map((r) => r.url));
    const newUrls = candidateUrls.filter((u) => !auditedUrls.has(u));

    if (newUrls.length === 0) {
      console.log("[cron] No new URLs to audit from feed");
      // Still update engagement on recent posts
      await updateRecentEngagement();
      await maybeGeneratePromptPatch();

      // Track cycle count even when no URLs to audit
      const noUrlMemory = loadMemory();
      const noUrlCycle = (noUrlMemory.cycleCount || 0) + 1;
      noUrlMemory.cycleCount = noUrlCycle;
      saveMemory(noUrlMemory);

      let dreamed = false;
      if (noUrlCycle % 5 === 0) {
        console.log("[cron] Cycle %d — entering dream cycle (no-URL path)...", noUrlCycle);
        try {
          await runDreamCycle();
          dreamed = true;
        } catch (dreamErr) {
          console.error("[cron] Dream cycle failed:", dreamErr);
        }
      }

      return NextResponse.json({
        status: "no_new_urls",
        message: "No new URLs found in feed to audit",
        cycle: noUrlCycle,
        dreamed,
      });
    }

    // 2. Pick a target URL (random from candidates)
    const targetUrl = newUrls[Math.floor(Math.random() * newUrls.length)];
    const auditType = pickAuditType();
    console.log(`[cron] Auditing ${targetUrl} (${auditType})`);

    // 3. Run audit
    const { report, score, summary } = await runAudit(targetUrl, auditType);

    // 4. Format and post to Moltbook
    const postContent = formatPostContent(
      targetUrl,
      auditType,
      score,
      summary,
      report as unknown as Record<string, unknown>
    );

    console.log("[cron] Posting to Moltbook...");
    const post = await createPost(postContent);
    console.log(`[cron] Posted to Moltbook: ${post.id}`);

    // 5. Save to memory
    addAuditRecord({
      postId: post.id,
      url: targetUrl,
      auditType,
      overallScore: score,
      summary: summary.slice(0, 500),
      createdAt: new Date().toISOString(),
      engagement: { upvotes: 0, downvotes: 0, comments: 0 },
    });

    // 6. Update engagement on recent posts
    await updateRecentEngagement();

    // 7. Maybe generate prompt patch from accumulated feedback
    await maybeGeneratePromptPatch();

    // 8. Track cycle count and trigger dream cycle every 5th cycle
    const currentMemory = loadMemory();
    const cycleCount = (currentMemory.cycleCount || 0) + 1;
    currentMemory.cycleCount = cycleCount;
    saveMemory(currentMemory);

    let dreamed = false;
    if (cycleCount % 5 === 0) {
      console.log("[cron] Cycle %d — entering dream cycle (sleep-time compute)...", cycleCount);
      try {
        await runDreamCycle();
        dreamed = true;
        console.log("[cron] Dream cycle complete");
      } catch (dreamErr) {
        const dreamMsg = dreamErr instanceof Error ? dreamErr.message : String(dreamErr);
        console.error("[cron] Dream cycle failed:", dreamMsg);
      }
    }

    return NextResponse.json({
      status: "success",
      url: targetUrl,
      auditType,
      score,
      postId: post.id,
      cycle: cycleCount,
      dreamed,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[cron] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
