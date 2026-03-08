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

// Growth & Monetization Agent types

export interface GrowthExperiment {
  hypothesis: string;
  metric: string;
  variant_a: string;
  variant_b: string;
  expected_impact: string;
  effort: "low" | "medium" | "high";
}

export interface MonetizationFinding {
  element: string;
  issue: string;
  impact: "revenue_loss" | "churn_risk" | "conversion_blocker" | "missed_opportunity";
  fix: string;
}

export interface GrowthMonetizationReport {
  summary: string;
  overall_score: number; // 0-100
  monetization_model: ScoreBreakdown;
  paywall_effectiveness: ScoreBreakdown;
  pricing_strategy: ScoreBreakdown;
  conversion_funnel: ScoreBreakdown;
  retention_signals: ScoreBreakdown;
  growth_levers: ScoreBreakdown;
  growth_experiments: GrowthExperiment[];
  monetization_findings: MonetizationFinding[];
  quick_wins: string[];
  growth_playbook: string;
}

// PageAnalysis is exported from web-analyzer.ts
