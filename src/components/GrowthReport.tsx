"use client";

import type { GrowthMonetizationReport, ScoreBreakdown } from "@/lib/types";
import { ScoreBar, scoreColor, severityColor, severityBg } from "./ScoreBar";

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

export function GrowthReport({ report }: { report: GrowthMonetizationReport }) {
  const categories: ScoreBreakdown[] = [
    report.market_opportunity,
    report.growth_loops,
    report.retention_engagement,
    report.monetization_model,
    report.competitive_moat,
    report.go_to_market,
  ];

  const readinessBorder = report.growth_ready ? "border-green-700" : "border-red-700";
  const readinessBg = report.growth_ready ? "bg-green-950/30" : "bg-red-950/30";
  const readinessColor = report.growth_ready ? "text-green-400" : "text-red-400";

  return (
    <div className="space-y-8">
      <div className={"border rounded-xl p-6 " + readinessBg + " " + readinessBorder}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Growth & Monetization Audit</h2>
          <div className="text-right">
            <div className={"text-2xl font-bold " + readinessColor}>
              {report.growth_ready ? "READY" : "NOT READY"}
            </div>
            <div className={"text-3xl font-bold font-mono " + scoreColor(report.overall_score / 10)}>
              {report.overall_score.toFixed(0)}<span className="text-lg text-gray-500">/100</span>
            </div>
          </div>
        </div>
        <p className="text-gray-300">{report.summary}</p>
      </div>

      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-6">Growth Score Breakdown</h3>
        {categories.map((c, i) => (
          <Section key={i} breakdown={c} />
        ))}
      </div>

      {report.growth_signals?.length > 0 && (
        <div className="bg-gray-900 border border-emerald-900/50 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 text-emerald-400">Growth Signals</h3>
          <div className="space-y-3">
            {report.growth_signals.map((sig, i) => {
              const icon = sig.sentiment === "positive" ? "+" : sig.sentiment === "negative" ? "-" : "~";
              const color = sig.sentiment === "positive" ? "text-green-400" : sig.sentiment === "negative" ? "text-red-400" : "text-gray-400";
              return (
                <div key={i} className="flex gap-3">
                  <span className={color + " font-bold shrink-0"}>{icon}</span>
                  <div>
                    <div className="text-sm font-medium">
                      {sig.signal}{" "}
                      <span className="text-gray-500 font-normal">
                        (weight: {sig.weight.toFixed(1)})
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">{sig.evidence}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {report.revenue_channels?.length > 0 && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">Revenue Channels</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2 pr-4">Channel</th>
                  <th className="text-left py-2 pr-4">Viability</th>
                  <th className="text-left py-2 pr-4">Estimated Potential</th>
                  <th className="text-left py-2">Effort</th>
                </tr>
              </thead>
              <tbody>
                {report.revenue_channels.map((ch, i) => (
                  <tr key={i} className="border-b border-gray-800">
                    <td className="py-2 pr-4 font-medium">{ch.channel}</td>
                    <td className="py-2 pr-4 text-gray-300">{ch.viability}</td>
                    <td className="py-2 pr-4 text-emerald-300">{ch.estimated_potential}</td>
                    <td className="py-2 text-yellow-300">{ch.effort}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

      {report.top_growth_actions?.length > 0 && (
        <div className="bg-gray-900 border border-cyan-900/50 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 text-cyan-400">Top Growth Actions</h3>
          <ol className="space-y-2">
            {report.top_growth_actions.map((action, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-300">
                <span className="text-cyan-400 font-mono shrink-0">{i + 1}.</span>
                {action}
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className={"border rounded-xl p-6 " + (report.growth_ready ? "bg-green-950/20 border-green-800" : "bg-red-950/20 border-red-800")}>
        <h3 className="text-lg font-bold mb-3">Growth Verdict</h3>
        <p className="text-gray-300">{report.verdict}</p>
      </div>
    </div>
  );
}
