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
  codebase_summary?: string;
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

// RevenueCat Charts API types

export interface RevenueCatMetric {
  id: string;
  name: string;
  unit: string;
  value: number;
  period: string;
  last_updated_at?: number;
}

export interface RevenueCatOverview {
  metrics: RevenueCatMetric[];
}

export interface ChartMeasure {
  display_name: string;
  description?: string;
  unit: string;
  decimal_precision?: number;
  chartable?: boolean;
  tabulable?: boolean;
}

export interface ChartValue {
  cohort: number;
  incomplete: boolean;
  measure: number;
  value: number;
  segment?: number;
}

export interface ChartResponse {
  object: string;
  category: string;
  display_name: string;
  description?: string;
  start_date: number;
  end_date: number;
  resolution: string;
  measures: ChartMeasure[];
  summary: Record<string, Record<string, number>>;
  values: ChartValue[];
}

export interface RevenueCatData {
  projectName: string;
  projectId: string;
  overview: RevenueCatOverview | null;
  revenueChart: ChartResponse | null;
  mrrChart: ChartResponse | null;
  mrrMovement: ChartResponse | null;
  churnChart: ChartResponse | null;
  trialConversionChart: ChartResponse | null;
  activesChart: ChartResponse | null;
  conversionToPayingChart: ChartResponse | null;
}

export interface MrrTrend {
  direction: "growing" | "declining" | "stable";
  growth_rate_percent: number;
  analysis: string;
}

export interface ChurnRisk {
  level: "low" | "medium" | "high";
  trend: string;
  analysis: string;
}

export interface TrialInsights {
  conversion_rate: number;
  trend: string;
  opportunities: string[];
}

export interface ActionItem {
  priority: number;
  action: string;
  expected_impact: string;
  timeframe: string;
}

export interface SubscriptionHealthReport {
  summary: string;
  health_score: number;
  executive_summary: string;
  mrr_health: ScoreBreakdown;
  churn_analysis: ScoreBreakdown;
  trial_performance: ScoreBreakdown;
  revenue_optimization: ScoreBreakdown;
  mrr_trend: MrrTrend;
  churn_risk: ChurnRisk;
  trial_insights: TrialInsights;
  action_plan: ActionItem[];
  strengths: string[];
  risks: AuditFinding[];
  verdict: string;
}

// PageAnalysis is exported from web-analyzer.ts
