// Shared types for audit agents

export type Severity = "critical" | "high" | "medium" | "low" | "info";

export interface AuditFinding {
  title: string;
  severity: Severity;
  category: string;
  description: string;
  recommendation: string;
  affected_areas?: string[];
}

export interface ScoreBreakdown {
  category: string;
  score: number; // 0-10
  reasoning: string;
  findings: AuditFinding[];
}

export interface ArchitecturalAuditReport {
  summary: string;
  overall_score: number; // 0-100
  scalability: ScoreBreakdown;
  payment_integration: ScoreBreakdown;
  software_design: ScoreBreakdown;
  resilience: ScoreBreakdown;
  security: ScoreBreakdown;
  devops: ScoreBreakdown;
  top_risks: AuditFinding[];
  strengths: string[];
  verdict: string;
}

export interface RevenueSignal {
  signal: string;
  sentiment: "positive" | "negative" | "neutral";
  weight: number; // 0-1
  evidence: string;
}

export interface CompetitorBenchmark {
  name: string;
  comparison: string;
  advantage: string;
  disadvantage: string;
}

export interface UXRevenueReport {
  summary: string;
  will_get_paid_users: boolean;
  confidence: number; // 0-1
  overall_ux_score: number; // 0-100
  first_impression: ScoreBreakdown;
  value_proposition: ScoreBreakdown;
  pricing_strategy: ScoreBreakdown;
  conversion_funnel: ScoreBreakdown;
  trust_signals: ScoreBreakdown;
  user_experience: ScoreBreakdown;
  revenue_signals: RevenueSignal[];
  competitor_benchmarks: CompetitorBenchmark[];
  target_audience: string;
  monetization_verdict: string;
  top_improvements: string[];
}

export interface AuditInput {
  name: string;
  urls: string[];
  description?: string;
  focus_areas?: string[];
  codebase_summary?: string; // pasted code or summary
}

export interface AuditRequest {
  name: string;
  urls: string[];
  description?: string;
  focusAreas?: string[];
}

export interface GrowthSignal {
  signal: string;
  sentiment: "positive" | "negative" | "neutral";
  weight: number; // 0-1
  evidence: string;
}

export interface RevenueChannel {
  channel: string;
  viability: string;
  estimated_potential: string;
  effort: string;
}

export interface GrowthMonetizationReport {
  summary: string;
  overall_score: number; // 0-100
  growth_ready: boolean;
  market_opportunity: ScoreBreakdown;
  growth_loops: ScoreBreakdown;
  retention_engagement: ScoreBreakdown;
  monetization_model: ScoreBreakdown;
  competitive_moat: ScoreBreakdown;
  go_to_market: ScoreBreakdown;
  growth_signals: GrowthSignal[];
  revenue_channels: RevenueChannel[];
  strengths: string[];
  top_growth_actions: string[];
  verdict: string;
}

// PageAnalysis is exported from web-analyzer.ts
