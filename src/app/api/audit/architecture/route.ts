import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { analyzePage, formatAnalysisForLLM } from "@/lib/web-analyzer";
import { ARCHITECTURE_SYSTEM_PROMPT } from "@/lib/prompts";
import type { AuditRequest, ArchitecturalAuditReport } from "@/lib/types";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body: AuditRequest = await req.json();
    const { name, urls, description, focusAreas, codebase_summary } = body;

    if (!name || (!urls?.length && !description)) {
      return NextResponse.json(
        { error: "Name and at least one URL or description are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    const analyses = urls?.length
      ? await Promise.all(urls.map((url) => analyzePage(url)))
      : [];

    const contextParts = ["# Audit Target: " + name];
    if (description) contextParts.push("\n## Description\n" + description);
    if (focusAreas?.length)
      contextParts.push(
        "\n## Focus Areas\n" + focusAreas.map((a) => "- " + a).join("\n")
      );
    if (codebase_summary)
      contextParts.push("\n## Codebase Summary\n" + codebase_summary);
    for (const a of analyses) {
      contextParts.push("\n" + formatAnalysisForLLM(a));
    }

    const context = contextParts.join("\n").slice(0, 180000);

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      system: ARCHITECTURE_SYSTEM_PROMPT(),
      messages: [
        {
          role: "user",
          content: "Perform a comprehensive architectural audit of the following system.\n\n" + context,
        },
      ],
    });

    const rawText =
      response.content[0].type === "text" ? response.content[0].text : "";
    let jsonStr = rawText.trim();

    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.split("\n").slice(1).join("\n");
      if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3);
    }

    const report: ArchitecturalAuditReport = JSON.parse(jsonStr);

    return NextResponse.json({ report, analyses });
  } catch (e: unknown) {
    console.error("Architecture audit error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
