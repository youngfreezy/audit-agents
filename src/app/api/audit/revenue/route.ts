import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  getProjects,
  fetchRevenueCatData,
  formatRevenueCatDataForLLM,
  extractSparklineData,
} from "@/lib/revenuecat-client";
import { REVENUE_INTELLIGENCE_SYSTEM_PROMPT } from "@/lib/prompts";
import type { SubscriptionHealthReport } from "@/lib/types";

export const maxDuration = 120;

interface RevenueRequest {
  apiKey?: string;
  useSampleData?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body: RevenueRequest = await req.json();
    const { apiKey, useSampleData } = body;

    if (!apiKey && !useSampleData) {
      return NextResponse.json(
        { error: "An API key or sample data flag is required" },
        { status: 400 }
      );
    }

    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    // Determine which RC API key to use
    const rcKey = useSampleData
      ? process.env.REVENUECAT_API_KEY
      : apiKey;

    if (!rcKey) {
      return NextResponse.json(
        { error: "RevenueCat API key not available" },
        { status: 400 }
      );
    }

    // Validate key and get project info
    const projects = await getProjects(rcKey);
    if (!projects.length) {
      return NextResponse.json(
        { error: "No projects found for this API key" },
        { status: 400 }
      );
    }

    const project = projects[0];

    // Fetch all chart data in parallel
    const data = await fetchRevenueCatData(rcKey, project.id, project.name);

    // Format for LLM context
    const context = formatRevenueCatDataForLLM(data);

    // Call Claude for analysis
    const client = new Anthropic({ apiKey: anthropicKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      system: REVENUE_INTELLIGENCE_SYSTEM_PROMPT(),
      messages: [
        {
          role: "user",
          content:
            "Analyze the following subscription data and produce a comprehensive subscription health report.\n\n" +
            context,
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

    const report: SubscriptionHealthReport = JSON.parse(jsonStr);

    // Extract sparkline data from raw charts for frontend rendering
    const sparklines = {
      revenue: extractSparklineData(data.revenueChart, 0),
      mrr: extractSparklineData(data.mrrChart, 0),
      churn: extractSparklineData(data.churnChart, 2), // Churn Rate is measure index 2
      trials: extractSparklineData(data.trialConversionChart, 0),
    };

    // Extract overview metrics for KPI cards
    const overview = data.overview?.metrics || [];

    return NextResponse.json({
      report,
      sparklines,
      overview,
      projectName: data.projectName,
    });
  } catch (e: unknown) {
    console.error("Revenue intelligence error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
