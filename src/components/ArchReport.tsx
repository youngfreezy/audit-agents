"use client";

import type { ArchitecturalAuditReport, AuditFinding, ScoreBreakdown } from "@/lib/types";
import { ScoreBar, scoreColor, severityColor, severityBg } from "./ScoreBar";

function FindingCard({ f }: { f: AuditFinding }) {
  return (
    <div className={"border rounded-lg p-3 " + severityBg(f.severity)}>
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
            <FindingCard key={i} f={f} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ArchReport({ report }: { report: ArchitecturalAuditReport }) {
  const categories: ScoreBreakdown[] = [
    report.scalability,
    report.payment_integration,
    report.software_design,
    report.resilience,
    report.security,
    report.devops,
  ];

  return (
    <div className="space-y-8">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Architectural Audit</h2>
          <div className={"text-3xl font-bold font-mono " + scoreColor(report.overall_score / 10)}>
            {report.overall_score.toFixed(0)}<span className="text-lg text-gray-500">/100</span>
          </div>
        </div>
        <p className="text-gray-300">{report.summary}</p>
      </div>

      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-6">Score Breakdown</h3>
        {categories.map((c, i) => (
          <Section key={i} breakdown={c} />
        ))}
      </div>

      {report.top_risks?.length > 0 && (
        <div className="bg-gray-900 border border-red-900/50 rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 text-red-400">Top Risks</h3>
          <div className="space-y-3">
            {report.top_risks.map((r, i) => (
              <FindingCard key={i} f={r} />
            ))}
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

      <div className="bg-gray-900 border border-blue-900/50 rounded-xl p-6">
        <h3 className="text-lg font-bold mb-3">Verdict</h3>
        <p className="text-gray-300">{report.verdict}</p>
      </div>
    </div>
  );
}
