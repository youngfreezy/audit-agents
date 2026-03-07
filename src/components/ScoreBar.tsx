"use client";

export function scoreColor(score: number): string {
  if (score >= 8) return "text-green-400";
  if (score >= 6) return "text-yellow-400";
  if (score >= 4) return "text-orange-400";
  return "text-red-400";
}

export function scoreBgColor(score: number): string {
  if (score >= 8) return "bg-green-400";
  if (score >= 6) return "bg-yellow-400";
  if (score >= 4) return "bg-orange-400";
  return "bg-red-400";
}

export function severityColor(severity: string): string {
  const map: Record<string, string> = {
    critical: "text-red-500 font-bold",
    high: "text-red-400",
    medium: "text-yellow-400",
    low: "text-blue-400",
    info: "text-gray-400",
  };
  return map[severity] || "text-gray-400";
}

export function severityBg(severity: string): string {
  const map: Record<string, string> = {
    critical: "bg-red-500/20 border-red-500/30",
    high: "bg-red-400/10 border-red-400/20",
    medium: "bg-yellow-400/10 border-yellow-400/20",
    low: "bg-blue-400/10 border-blue-400/20",
    info: "bg-gray-400/10 border-gray-400/20",
  };
  return map[severity] || "bg-gray-400/10 border-gray-400/20";
}

export function ScoreBar({ score, label }: { score: number; label: string }) {
  const pct = (score / 10) * 100;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-400 w-40 shrink-0">{label}</span>
      <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={"h-full rounded-full transition-all duration-700 " + scoreBgColor(score)}
          style={{ width: pct + "%" }}
        />
      </div>
      <span className={"text-sm font-mono font-bold w-10 text-right " + scoreColor(score)}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}
