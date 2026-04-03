"use client";

import type { SubscriptionHealthReport, ScoreBreakdown } from "@/lib/types";
import { ScoreBar, severityColor, severityBg } from "./ScoreBar";

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const h = 30;
  const w = 100;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function KpiCard({
  label,
  value,
  unit,
  sparkData,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  sparkData: number[];
  color: string;
}) {
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4">
      <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-2xl font-bold font-mono">
        {unit === "$" && "$"}{value}{unit === "%" && "%"}
      </div>
      <div className="mt-2">
        <Sparkline data={sparkData} color={color} />
      </div>
    </div>
  );
}

function Section({ breakdown }: { breakdown: ScoreBreakdown }) {
  return (
    <div className="mb-6">
      <ScoreBar score={breakdown.score} label={breakdown.category} />
      <p className="text-sm text-gray-300 mt-2 ml-[172px]">{breakdown.reasoning}</p>
      {breakdown.findings?.length > 0 && (
        <div className="mt-3 ml-[172px] space-y-2">
          {breakdown.findings.map((f, i) => (
            <div key={i} className={"border rounded-lg p-3 " + severityBg(f.severity)}>
              <div className="flex items-center gap-2 mb-1">
                <span className={"text-xs uppercase font-mono " + severityColor(f.severity)}>
                  {f.severity}
                </span>
                <span className="font-medium text-sm">{f.title}</span>
              </div>
              <p className="text-sm text-gray-300 mb-2">{f.description}</p>
              <p className="text-sm text-blue-300">
                <span className="text-gray-500">Fix: </span>{f.recommendation}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface OverviewMetric {
  id: string;
  name: string;
  unit: string;
  value: number;
}

export function RevenueReport({
  report,
  sparklines,
  overview,
  projectName,
}: {
  report: SubscriptionHealthReport;
  sparklines: { revenue: number[]; mrr: number[]; churn: number[]; trials: number[] };
  overview: OverviewMetric[];
  projectName: string;
}) {
  const categories: ScoreBreakdown[] = [
    report.mrr_health,
    report.churn_analysis,
    report.trial_performance,
    report.revenue_optimization,
  ];

  const healthColor =
    report.health_score >= 70
      ? "text-green-400"
      : report.health_score >= 50
        ? "text-yellow-400"
        : "text-red-400";

  const healthBorder =
    report.health_score >= 70
      ? "border-green-700"
      : report.health_score >= 50
        ? "border-yellow-700"
        : "border-red-700";

  const healthBg =
    report.health_score >= 70
      ? "bg-green-950/30"
      : report.health_score >= 50
        ? "bg-yellow-950/30"
        : "bg-red-950/30";

  // Extract overview metrics for KPI cards
  const mrr = overview.find((m) => m.id === "mrr");
  const activeSubs = overview.find((m) => m.id === "active_subscriptions");
  const activeTrials = overview.find((m) => m.id === "active_trials");
  const revenue = overview.find((m) => m.id === "revenue");

  const trendArrow =
    report.mrr_trend.direction === "growing"
      ? "^"
      : report.mrr_trend.direction === "declining"
        ? "v"
        : "~";
  const trendColor =
    report.mrr_trend.direction === "growing"
      ? "text-green-400"
      : report.mrr_trend.direction === "declining"
        ? "text-red-400"
        : "text-yellow-400";

  const riskColor =
    report.churn_risk.level === "low"
      ? "text-green-400"
      : report.churn_risk.level === "medium"
        ? "text-yellow-400"
        : "text-red-400";
  const riskBg =
    report.churn_risk.level === "low"
      ? "bg-green-950/30"
      : report.churn_risk.level === "medium"
        ? "bg-yellow-950/30"
        : "bg-red-950/30";

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className={`border rounded-xl p-6 ${healthBg} ${healthBorder}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Subscription Health Report</h2>
            <p className="text-sm text-gray-400 mt-1">{projectName}</p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold font-mono ${healthColor}`}>
              {report.health_score.toFixed(0)}
              <span className="text-lg text-gray-500">/100</span>
            </div>
          </div>
        </div>
        <p className="text-gray-300">{report.executive_summary}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          label="MRR"
          value={mrr ? mrr.value.toLocaleString() : "N/A"}
          unit="$"
          sparkData={sparklines.mrr}
          color="#34d399"
        />
        <KpiCard
          label="Active Subscriptions"
          value={activeSubs ? activeSubs.value.toLocaleString() : "N/A"}
          unit="#"
          sparkData={sparklines.revenue}
          color="#60a5fa"
        />
        <KpiCard
          label="Active Trials"
          value={activeTrials ? activeTrials.value.toLocaleString() : "N/A"}
          unit="#"
          sparkData={sparklines.trials}
          color="#a78bfa"
        />
        <KpiCard
          label="Revenue (28d)"
          value={revenue ? revenue.value.toLocaleString() : "N/A"}
          unit="$"
          sparkData={sparklines.revenue}
          color="#fbbf24"
        />
      </div>

      {/* Score Breakdown */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-6">Health Score Breakdown</h3>
        {categories.map((c, i) => (
          <Section key={i} breakdown={c} />
        ))}
      </div>

      {/* MRR Trend */}
      <div className="bg-gray-900 border border-teal-900/50 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4 text-teal-400">MRR Trend</h3>
        <div className="flex items-center gap-4 mb-3">
          <span className={`text-3xl font-bold ${trendColor}`}>{trendArrow}</span>
          <div>
            <span className={`text-xl font-bold ${trendColor}`}>
              {report.mrr_trend.direction.toUpperCase()}
            </span>
            <span className="text-gray-400 ml-2">
              ({report.mrr_trend.growth_rate_percent > 0 ? "+" : ""}
              {report.mrr_trend.growth_rate_percent.toFixed(1)}%)
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-300">{report.mrr_trend.analysis}</p>
      </div>

      {/* Churn Risk */}
      <div className={`bg-gray-900 border border-gray-700 rounded-xl p-6 ${riskBg}`}>
        <h3 className="text-lg font-bold mb-4">Churn Risk</h3>
        <div className="flex items-center gap-3 mb-3">
          <span
            className={`px-3 py-1 rounded-full text-sm font-bold uppercase ${riskColor} ${
              report.churn_risk.level === "low"
                ? "bg-green-900/50"
                : report.churn_risk.level === "medium"
                  ? "bg-yellow-900/50"
                  : "bg-red-900/50"
            }`}
          >
            {report.churn_risk.level}
          </span>
          <span className="text-sm text-gray-400">{report.churn_risk.trend}</span>
        </div>
        <p className="text-sm text-gray-300">{report.churn_risk.analysis}</p>
      </div>

      {/* Trial Insights */}
      <div className="bg-gray-900 border border-purple-900/50 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-4 text-purple-400">Trial Insights</h3>
        <div className="flex items-center gap-4 mb-3">
          <div className="text-3xl font-bold font-mono text-purple-300">
            {(report.trial_insights.conversion_rate * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-400">conversion rate</div>
        </div>
        <p className="text-sm text-gray-400 mb-3">{report.trial_insights.trend}</p>
        {report.trial_insights.opportunities?.length > 0 && (
          <ul className="space-y-1">
            {report.trial_insights.opportunities.map((opp, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-300">
                <span className="text-purple-400 shrink-0">*</span>
                {opp}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Risks */}
      {report.risks?.length > 0 && (
        <div className="bg-gray-900 border border-red-900/50 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 text-red-400">Key Risks</h3>
          <div className="space-y-3">
            {report.risks.map((r, i) => (
              <div key={i} className={"border rounded-lg p-3 " + severityBg(r.severity)}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={"text-xs uppercase font-mono " + severityColor(r.severity)}>
                    {r.severity}
                  </span>
                  <span className="font-medium text-sm">{r.title}</span>
                </div>
                <p className="text-sm text-gray-300 mb-2">{r.description}</p>
                <p className="text-sm text-blue-300">
                  <span className="text-gray-500">Fix: </span>{r.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {report.strengths?.length > 0 && (
        <div className="bg-gray-900 border border-green-900/50 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 text-green-400">Strengths</h3>
          <ul className="space-y-2">
            {report.strengths.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-300">
                <span className="text-green-400 shrink-0">+</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Plan */}
      {report.action_plan?.length > 0 && (
        <div className="bg-gray-900 border border-cyan-900/50 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 text-cyan-400">90-Day Action Plan</h3>
          <div className="space-y-4">
            {report.action_plan.map((item, i) => (
              <div key={i} className="flex gap-4">
                <span className="text-cyan-400 font-mono font-bold text-lg shrink-0">
                  {item.priority}.
                </span>
                <div className="flex-1">
                  <div className="font-medium text-sm mb-1">{item.action}</div>
                  <div className="flex gap-3 text-xs">
                    <span className="px-2 py-0.5 bg-emerald-900/40 text-emerald-300 rounded">
                      {item.expected_impact}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded">
                      {item.timeframe}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verdict */}
      <div
        className={`border rounded-xl p-6 ${
          report.health_score >= 65
            ? "bg-green-950/20 border-green-800"
            : "bg-red-950/20 border-red-800"
        }`}
      >
        <h3 className="text-lg font-bold mb-3">Subscription Verdict</h3>
        <p className="text-gray-300">{report.verdict}</p>
      </div>

      {/* Powered by */}
      <div className="text-center text-xs text-gray-600">
        Powered by RevenueCat Charts API + Claude AI
      </div>
    </div>
  );
}
