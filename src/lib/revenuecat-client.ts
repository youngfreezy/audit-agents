const BASE_URL = "https://api.revenuecat.com/v2";

interface ProjectInfo {
  id: string;
  name: string;
}

function headers(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

export async function getProjects(apiKey: string): Promise<ProjectInfo[]> {
  const res = await fetch(`${BASE_URL}/projects`, { headers: headers(apiKey) });
  if (!res.ok) {
    if (res.status === 401) throw new Error("Invalid RevenueCat API key");
    throw new Error(`Failed to fetch projects: ${res.status}`);
  }
  const data = await res.json();
  return (data.items || []).map((p: { id: string; name: string }) => ({
    id: p.id,
    name: p.name,
  }));
}

async function fetchOverview(apiKey: string, projectId: string) {
  try {
    const res = await fetch(
      `${BASE_URL}/projects/${projectId}/metrics/overview`,
      { headers: headers(apiKey) }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchChart(
  apiKey: string,
  projectId: string,
  chartName: string,
  startDate: string,
  endDate: string,
  resolution: string = "day"
) {
  try {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      resolution,
    });
    const res = await fetch(
      `${BASE_URL}/projects/${projectId}/charts/${chartName}?${params}`,
      { headers: headers(apiKey) }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchRevenueCatData(
  apiKey: string,
  projectId: string,
  projectName: string
) {
  const now = today();
  const d90 = daysAgo(90);
  const d365 = daysAgo(365);
  const d180 = daysAgo(180);

  const [
    overview,
    revenueChart,
    mrrChart,
    mrrMovement,
    churnChart,
    trialConversionChart,
    activesChart,
    conversionToPayingChart,
  ] = await Promise.all([
    fetchOverview(apiKey, projectId),
    fetchChart(apiKey, projectId, "revenue", d90, now, "day"),
    fetchChart(apiKey, projectId, "mrr", d365, now, "month"),
    fetchChart(apiKey, projectId, "mrr_movement", d180, now, "month"),
    fetchChart(apiKey, projectId, "churn", d90, now, "day"),
    fetchChart(apiKey, projectId, "trial_conversion_rate", d90, now, "day"),
    fetchChart(apiKey, projectId, "actives", d90, now, "day"),
    fetchChart(apiKey, projectId, "conversion_to_paying", d90, now, "day"),
  ]);

  return {
    projectName,
    projectId,
    overview,
    revenueChart,
    mrrChart,
    mrrMovement,
    churnChart,
    trialConversionChart,
    activesChart,
    conversionToPayingChart,
  };
}

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toISOString().split("T")[0];
}

function formatChartForLLM(
  label: string,
  chart: {
    measures?: { display_name: string; unit: string }[];
    values?: { cohort: number; measure: number; value: number; incomplete: boolean }[];
    summary?: Record<string, Record<string, number>>;
    resolution?: string;
  } | null
): string {
  if (!chart) return `\n## ${label}\nData unavailable.\n`;

  const lines: string[] = [`\n## ${label}`];

  if (chart.resolution) lines.push(`Resolution: ${chart.resolution}`);

  if (chart.measures && chart.values) {
    for (let mi = 0; mi < chart.measures.length; mi++) {
      const m = chart.measures[mi];
      lines.push(`\n### ${m.display_name} (${m.unit})`);

      const points = chart.values
        .filter((v) => v.measure === mi)
        .sort((a, b) => a.cohort - b.cohort);

      if (points.length > 0) {
        lines.push("Date | Value");
        lines.push("--- | ---");
        for (const p of points) {
          const mark = p.incomplete ? " (incomplete)" : "";
          lines.push(`${formatTimestamp(p.cohort)} | ${p.value}${mark}`);
        }
      }
    }
  }

  if (chart.summary) {
    lines.push("\n### Summary");
    for (const [agg, metrics] of Object.entries(chart.summary)) {
      for (const [name, val] of Object.entries(metrics)) {
        lines.push(`${agg} ${name}: ${val}`);
      }
    }
  }

  return lines.join("\n");
}

export function formatRevenueCatDataForLLM(data: {
  projectName: string;
  overview: { metrics?: { id: string; name: string; unit: string; value: number; period: string }[] } | null;
  revenueChart: Parameters<typeof formatChartForLLM>[1];
  mrrChart: Parameters<typeof formatChartForLLM>[1];
  mrrMovement: Parameters<typeof formatChartForLLM>[1];
  churnChart: Parameters<typeof formatChartForLLM>[1];
  trialConversionChart: Parameters<typeof formatChartForLLM>[1];
  activesChart: Parameters<typeof formatChartForLLM>[1];
  conversionToPayingChart: Parameters<typeof formatChartForLLM>[1];
}): string {
  const parts: string[] = [];

  parts.push(`# Subscription Analytics: ${data.projectName}`);
  parts.push(`Analysis Date: ${today()}`);

  if (data.overview?.metrics) {
    parts.push("\n## Overview Metrics (Current Snapshot)");
    for (const m of data.overview.metrics) {
      parts.push(`- ${m.name}: ${m.unit === "$" ? "$" : ""}${m.value}${m.unit === "#" ? "" : ""} (${m.period})`);
    }
  }

  parts.push(formatChartForLLM("Revenue (Last 90 Days)", data.revenueChart));
  parts.push(formatChartForLLM("MRR (Last 12 Months)", data.mrrChart));
  parts.push(formatChartForLLM("MRR Movement (Last 6 Months)", data.mrrMovement));
  parts.push(formatChartForLLM("Churn (Last 90 Days)", data.churnChart));
  parts.push(formatChartForLLM("Trial Conversion Rate (Last 90 Days)", data.trialConversionChart));
  parts.push(formatChartForLLM("Active Subscriptions (Last 90 Days)", data.activesChart));
  parts.push(formatChartForLLM("Conversion to Paying (Last 90 Days)", data.conversionToPayingChart));

  return parts.join("\n").slice(0, 180000);
}

export function extractSparklineData(chart: {
  measures?: { display_name: string }[];
  values?: { cohort: number; measure: number; value: number }[];
} | null, measureIndex: number = 0): number[] {
  if (!chart?.values) return [];
  return chart.values
    .filter((v) => v.measure === measureIndex)
    .sort((a, b) => a.cohort - b.cohort)
    .map((v) => v.value);
}
