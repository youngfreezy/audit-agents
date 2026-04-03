# SubPulse: Process Log

## Overview

This document details the steps taken by Prism (an AI agent) to complete the RevenueCat take-home assignment: build a tool using the Charts API, create a content package, and design a growth campaign.

**Total autonomous execution time**: ~2 hours from initial planning to deployed tool + content.

---

## Phase 1: Strategic Planning (15 min)

### Decision: What to Build

**Options considered**:
1. A standalone CLI tool / npm package wrapping the Charts API
2. A GitHub boilerplate for an MRR dashboard
3. A data analysis script that outputs a PDF report
4. **A new AI agent inside Prism that analyzes RevenueCat subscription data** (chosen)

**Why option 4**: The assignment evaluates "Agentic AI" capabilities. Building yet another wrapper or dashboard would be table stakes. Instead, SubPulse demonstrates the exact value proposition of agentic AI: an agent that autonomously fetches data from multiple sources, reasons about it, and produces structured insights. It also extends Prism's existing 3-agent architecture naturally, showing how a real agent platform evolves.

**Key strategic decisions**:
- **Standalone `/revenue` page** rather than integrating into the main form -- different input model (API key vs URL) demands different UX
- **"Try with Dark Noise" demo button** -- critical for reviewers who don't have a RevenueCat API key. Removes all friction from evaluation.
- **Zero new dependencies** -- SVG sparklines via raw polyline, native fetch. Keeps the project lean and the deploy fast.

### Research: RevenueCat Charts API v2

Before writing any code, I thoroughly researched the API:
- Discovered 21 available chart types via the API's error response
- Identified the `/projects/{id}/metrics/overview` endpoint for snapshot KPIs
- Mapped the response format: `{measures, values: [{cohort, measure, value}], summary}`
- Confirmed the 15 req/min rate limit -- 8 parallel calls are safe
- Tested the provided API key against the `/v2/projects` endpoint to confirm validity

---

## Phase 2: Implementation (60 min)

### Architecture

Followed Prism's existing agent pattern exactly:
1. Types in `src/lib/types.ts`
2. System prompt function in `src/lib/prompts.ts`
3. API route at `src/app/api/audit/revenue/route.ts`
4. Report component at `src/components/RevenueReport.tsx`
5. Page at `src/app/revenue/page.tsx`

Plus one new file: `src/lib/revenuecat-client.ts` (Charts API wrapper)

### Files Created/Modified

| File | Action | Purpose |
|---|---|---|
| `src/lib/types.ts` | Modified | Added `SubscriptionHealthReport`, `RevenueCatData`, and supporting types |
| `src/lib/prompts.ts` | Modified | Added `REVENUE_INTELLIGENCE_SYSTEM_PROMPT` with scoring calibration |
| `src/lib/revenuecat-client.ts` | Created | Charts API client: parallel fetch, LLM formatting, sparkline extraction |
| `src/app/api/audit/revenue/route.ts` | Created | API route: validate key -> fetch charts -> Claude analysis -> JSON response |
| `src/components/RevenueReport.tsx` | Created | Report UI: hero, KPI cards, sparklines, score bars, action plan |
| `src/app/revenue/page.tsx` | Created | Standalone page with API key form + sample data button |
| `src/app/revenue/loading.tsx` | Created | Skeleton loader |
| `src/app/page.tsx` | Modified | Added SubPulse banner link |
| `src/app/layout.tsx` | Modified | Updated metadata to mention 4th agent |

### Key Technical Decisions

1. **Prompt calibration anchors**: Without explicit scoring guidance, Claude clustered scores around 72-78. Added benchmarks (Calm = 75-90, stagnating = 50-65) to force meaningful score distribution. Dark Noise correctly scored 62/100.

2. **Churn sparkline uses measure index 2**: The churn chart returns three measures (Actives, Churned Actives, Churn Rate). The sparkline needs the rate (index 2), not the count. This required inspecting the actual API response structure.

3. **Graceful per-chart error handling**: Each `fetchChart` call catches errors independently and returns null. Claude is instructed to note missing data. This means a key with partial permissions still produces a useful report.

4. **Server-side only API key handling**: The RevenueCat key is sent in the POST body, used in-memory for the API calls, and discarded. Never stored, logged, or returned in the response.

### Build & Lint

Fixed two lint errors:
- Removed unused `scoreColor` import in `RevenueReport.tsx`
- Fixed unused variable in `moltbook/cron/route.ts` (pre-existing issue)

Build completed clean with all 12 pages and 5 API routes.

---

## Phase 3: Testing (10 min)

### Local Testing
- Started dev server on port 3001
- Hit `POST /api/audit/revenue` with `{"useSampleData": true}`
- Verified end-to-end pipeline:
  - RevenueCat API returned: 91 revenue data points, 13 MRR points, 7 overview metrics
  - Claude produced: health_score=62, mrr_trend=stable, churn_risk=medium, trial_conversion=39%
  - 5 action plan items generated with impact/timeframe
  - All sparkline arrays populated

### API Validation
- Tested RevenueCat key directly via curl: confirmed `proj058a6330` (Dark Noise) returned
- Tested overview metrics endpoint: confirmed $4.6K MRR, 2534 subscribers, 76 trials

---

## Phase 4: Deployment (5 min)

1. Committed all changes to `main` branch
2. Pushed to GitHub (`youngfreezy/audit-agents`)
3. Added `REVENUECAT_API_KEY` environment variable to Vercel production
4. Deployed via `vercel --prod`
5. Build succeeded: `/revenue` page (4.01 kB) + `/api/audit/revenue` endpoint live

**Production URL**: https://audit-agents.vercel.app/revenue

---

## Phase 5: Content Creation (30 min)

### Blog Post (1,800 words)
- Technical deep-dive with architecture diagram, code snippets, and real Dark Noise analysis
- Published as markdown, ready for dev.to
- AI disclosure included

### Twitter Posts (5)
- Five angles: problem, technical, surprising insight, builder, CTA
- All under 280 characters
- All include AI agent disclosure

### Growth Campaign Report
- 4 target communities: r/IndieHacking, Indie Hackers, RevenueCat community, Hacker News
- Draft copy for each with AI disclosure
- $100 budget: $35 Reddit ads, $40 Twitter promoted post, $15 design assets, $10 scheduling
- Measurement plan with 7-day and 30-day KPIs

---

## Tools Used

- **Claude Code** (CLI agent orchestrating the entire workflow)
- **Claude Sonnet 4** (runtime AI analysis within SubPulse)
- **Next.js 14** (App Router, server-side API routes)
- **RevenueCat Charts API v2** (subscription data source)
- **Anthropic SDK** (Claude API client, already installed in Prism)
- **Vercel** (deployment platform)
- **Git/GitHub** (version control)
- **curl** (API testing)

---

## Tradeoffs

| Decision | Alternative | Why I chose this |
|---|---|---|
| Extend Prism vs. standalone app | New repo, new deploy | Faster to build on existing infra; demonstrates platform thinking |
| Server-side only vs. client-side API calls | Client-side fetch (simpler) | Security: RC API keys should never touch the browser |
| SVG sparklines vs. charting library | recharts, chart.js, visx | Zero bundle impact, 15 lines of code, same visual result |
| Dark Noise demo button vs. synthetic data | Hardcoded fake numbers | Real data is more credible; validates the actual pipeline |
| 4 scored dimensions vs. 6 | Match existing 6-dimension agents | Subscription data is fundamentally different from web scraping; fewer, deeper dimensions produce better signal |
