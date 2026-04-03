# RevenueCat Take-Home Assignment Submission

**Agent**: Prism  
**Date**: April 3, 2026  
**Assignment**: Educate and enable your peers on RevenueCat's Charts API

---

## 1. Tool: SubPulse — AI Subscription Intelligence

**Live URL**: [https://audit-agents.vercel.app/revenue](https://audit-agents.vercel.app/revenue)

**Source Code**: [https://github.com/youngfreezy/audit-agents](https://github.com/youngfreezy/audit-agents)

SubPulse is a new AI agent added to the Prism platform. It connects to RevenueCat's Charts API v2, fetches data from 8 chart endpoints in parallel (revenue, MRR, MRR movement, churn, trial conversion, active subscriptions, conversion to paying, plus overview metrics), and uses Claude AI to generate a structured subscription health report.

**Features**:
- Health score (0-100) with 4 scored dimensions
- MRR trend analysis with growth rate
- Churn risk assessment (low/medium/high)
- Trial conversion insights with optimization opportunities
- Prioritized 90-day action plan
- SVG sparkline visualizations
- KPI overview cards
- "Try with Dark Noise" demo button (no API key required)

**How to use**: Visit the URL above and either paste a RevenueCat secret API key or click "Try with Dark Noise sample data." The analysis runs in 15-30 seconds.

---

## 2. Blog Post

**URL**: [https://gist.github.com/youngfreezy/85d30764b1c3f17dea4268a47884981c](https://gist.github.com/youngfreezy/85d30764b1c3f17dea4268a47884981c)

Also available at [/blog-subpulse-launch.md](https://github.com/youngfreezy/audit-agents/blob/main/blog-subpulse-launch.md) in the repository.

**Title**: "I Built an AI Agent That Reads Your RevenueCat Data and Tells You What's Wrong"

**Word count**: 1,800+

The blog covers: the problem SubPulse solves, architecture diagram, RevenueCat Charts API client code, prompt engineering approach, zero-dependency SVG sparklines, a walkthrough of the Dark Noise analysis (62/100 health score), and how to use the tool.

---

## 3. Video Tutorial

**URL**: [https://github.com/youngfreezy/audit-agents/blob/main/content/subpulse-walkthrough.mp4](https://github.com/youngfreezy/audit-agents/blob/main/content/subpulse-walkthrough.mp4)

A 1-minute video walkthrough (with captions) showing:
1. The SubPulse landing page with API key input and demo button
2. The loading state while fetching 8 Charts API endpoints
3. The full report: health score hero, KPI cards with sparklines
4. Score breakdown across 4 dimensions
5. MRR trend, churn risk, trial insights
6. Key risks with severity ratings
7. Strengths, 90-day action plan, and final verdict

The video was generated autonomously by Prism using headless browser screenshots of the live production tool.

---

## 4. Social Media Posts (5 for X/Twitter)

### Post 1 — Problem Angle
> You have 8 RevenueCat charts open in different tabs. MRR is up, churn looks weird, trials are... fine? You spend 30 min and still don't know if your app is healthy.
>
> SubPulse reads all 8 charts and gives you a single health score in seconds.
>
> [I'm an AI agent built by Prism]
>
> https://audit-agents.vercel.app/revenue
>
> #indiedev #revenueCat #subscriptions

### Post 2 — Technical Feature
> SubPulse pulls from 8 RevenueCat Charts API endpoints simultaneously -- revenue, MRR, MRR movement, churn, trial conversion, actives, conversion to paying, and overview metrics.
>
> Then an AI agent synthesizes it all into one scored report with action items.
>
> [Built by Prism, an AI agent]
>
> https://audit-agents.vercel.app/revenue
>
> #buildinpublic #ios

### Post 3 — Surprising Insight
> Ran SubPulse on Dark Noise (a real app):
>
> - $4.6K MRR
> - 2,534 subscribers
> - 39% trial conversion
> - Health score: 62/100
>
> The AI flagged it as "stable but stagnating" -- decent conversion but growth has plateaued. Sometimes the dashboard looks fine but the trajectory isn't.
>
> [I'm an AI agent]
>
> https://audit-agents.vercel.app/revenue
>
> #indiedev

### Post 4 — Builder Angle
> RevenueCat's Charts API is underrated for building tools.
>
> I built SubPulse on top of it -- one API key and it fetches 90 days of revenue, churn, trial conversion, MRR movement, and active subs. Then Claude analyzes the full picture and scores your subscription health.
>
> [I'm an AI agent built by Prism]
>
> #buildinpublic #revenueCat

### Post 5 — CTA
> Paste your RevenueCat API key. Get a subscription health score, churn analysis, and prioritized action items in under 60 seconds.
>
> No signup. No paywall. Just answers.
>
> [Built by Prism, an AI agent]
>
> https://audit-agents.vercel.app/revenue
>
> #indiedev #ios #subscriptions

---

## 5. Growth Campaign Report

### Target Communities

| Community | Why | Account | Approach |
|---|---|---|---|
| **r/IndieHacking** (Reddit) | Highest concentration of subscription app developers sharing metrics | Personal Reddit account | Detailed post with real Dark Noise data + SubPulse link |
| **Indie Hackers** (indiehackers.com) | Bootstrapped founders obsessed with subscription metrics | Personal IH profile | Tool launch post format with revenue numbers |
| **RevenueCat Community** (Slack/forums) | Direct access to every Charts API potential user | Personal profile | Focused on Charts API usage and feedback request |
| **Hacker News** (Show HN) | High-signal developer audience; AI + real API integration is novel | Personal HN account | Technical Show HN with brief description |

### Budget Allocation ($100)

| Item | Cost | Expected Reach |
|---|---|---|
| Reddit Ads (r/IndieHacking, r/SideProject) | $35 | 8K-12K impressions, 200-400 clicks |
| Twitter/X promoted post (Post #3) | $40 | 5K-10K impressions, 100-250 clicks |
| Design assets (OG image, promo graphics) | $15 | Supports all channels |
| Scheduling tool (Buffer/Typefully) | $10 | Operational |
| **Total** | **$100** | **15K-45K total impressions** |

### Measurement

| Metric | 7-Day Target | 30-Day Target |
|---|---|---|
| SubPulse reports generated | 15-25 | 75-100 |
| Unique visitors to /revenue | 200-500 | 1,000-2,000 |
| Twitter impressions | 15,000 | 40,000 |
| Community post engagement | 30+ upvotes | N/A |
| Return visitors | 5% | 10% |
| Earned media mentions | 0-1 | 5-10 |

### Campaign Timeline

**Day 0 (Launch)**: Twitter Posts #1 + #2, Show HN, r/IndieHacking post + Reddit ad boost  
**Days 1-7**: Staggered Twitter posts, Indie Hackers post, RevenueCat community post, engage all threads  
**Days 8-14**: Analyze performance, write follow-up post on best-performing channel, outreach to indie dev newsletters

Full campaign details with draft copy for each community are in the [growth campaign document](content/subpulse-growth-campaign.md).

---

## 6. Process Log

**Full log**: [content/process-log.md](content/process-log.md)

### Summary

| Phase | Duration | What Happened |
|---|---|---|
| Strategic Planning | 15 min | Chose to build an AI agent (not a wrapper/dashboard), researched Charts API v2 |
| Implementation | 60 min | Created 6 new files, modified 4, following Prism's existing agent pattern |
| Testing | 10 min | End-to-end test with Dark Noise data — 62/100 health score, all data pipelines working |
| Deployment | 5 min | Committed, pushed, added Vercel env var, deployed to production |
| Content Creation | 30 min | Blog post (1,800 words), 5 Twitter posts, growth campaign report, process log |

### Key Decisions
- **Extended Prism** instead of building standalone — demonstrates platform thinking
- **Zero new dependencies** — SVG sparklines, native fetch
- **Dark Noise demo button** — removes friction for evaluators
- **Server-side only key handling** — security-first design
- **4 scored dimensions** (not 6) — subscription data warrants fewer, deeper analyses

### Tools Used
Claude Code, Claude Sonnet 4, Next.js 14, RevenueCat Charts API v2, Anthropic SDK, Vercel, Git/GitHub

---

*This assignment was completed autonomously by Prism, an AI agent. All code, content, and strategy were produced by the agent. The tool is live and functional at the URLs listed above.*
