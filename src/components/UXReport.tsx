"use client";

import type { UXRevenueReport, ScoreBreakdown } from "@/lib/types";
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

export function UXReport({ report }: { report: UXRevenueReport }) {
  const categories: ScoreBreakdown[] = [
    report.first_impression,
    report.value_proposition,
    report.pricing_strategy,
    report.conversion_funnel,
    report.trust_signals,
    report.user_experience,
  ];

  const verdictBorder = report.will_get_paid_users ? "border-green-700" : "border-red-700";
  const verdictBg = report.will_get_paid_users ? "bg-green-950/30" : "bg-red-950/30";
  const verdictColor = report.will_get_paid_users ? "text-green-400" : "text-red-400";

  return (
    <div className="space-y-8">
      <div className={"border rounded-xl p-6 " + verdictBg + " " + verdictBorder}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">UX Revenue Verdict</h2>
          <div className="text-right">
            <div className={"text-2xl font-bold " + verdictColor}>
              {report.will_get_paid_users ? "YES" : "NO"}
            </div>
            <div className="text-sm text-gray-400">
              {(report.confidence * 100).toFixed(0)}% confidence
            </div>
          </div>
        </div>
        <p className="text-gray-300">{report.summary}</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm text-gray-400">UX Score:</span>
          <span className={"font-mono font-bold " + scoreColor(report.overall_ux_score / 10)}>
            {report.overall_ux_score.toFixed(0)}/100
          </span>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-6">UX Score Breakdown</h3>
        {categories.map((c, i) => (
          <Section key={i} breakdown={c} />
        ))}
      </div>

      {report.revenue_signals?.length > 0 && (
        <div className="bg-gray-900 border border-yellow-900/50 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 text-yellow-400">Revenue Signals</h3>
          <div className="space-y-3">
            {report.revenue_signals.map((sig, i) => {
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

      {report.competitor_benchmarks?.length > 0 && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4">Competitor Benchmarks</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-left py-2 pr-4">Competitor</th>
                  <th className="text-left py-2 pr-4">Comparison</th>
                  <th className="text-left py-2 pr-4 text-green-400">Advantage</th>
                  <th className="text-left py-2 text-red-400">Disadvantage</th>
                </tr>
              </thead>
              <tbody>
                {report.competitor_benchmarks.map((c, i) => (
                  <tr key={i} className="border-b border-gray-800">
                    <td className="py-2 pr-4 font-medium">{c.name}</td>
                    <td className="py-2 pr-4 text-gray-300">{c.comparison}</td>
                    <td className="py-2 pr-4 text-green-300">{c.advantage}</td>
                    <td className="py-2 text-red-300">{c.disadvantage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-3">Target Audience</h3>
        <p className="text-gray-300">{report.target_audience}</p>
      </div>

      {report.top_improvements?.length > 0 && (
        <div className="bg-gray-900 border border-cyan-900/50 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 text-cyan-400">Top Improvements</h3>
          <ol className="space-y-2">
            {report.top_improvements.map((imp, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-300">
                <span className="text-cyan-400 font-mono shrink-0">{i + 1}.</span>
                {imp}
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className={"border rounded-xl p-6 " + (report.will_get_paid_users ? "bg-green-950/20 border-green-800" : "bg-red-950/20 border-red-800")}>
        <h3 className="text-lg font-bold mb-3">Monetization Verdict</h3>
        <p className="text-gray-300">{report.monetization_verdict}</p>
      </div>
    </div>
  );
}
