# Audit Agents (Prism)

AI-powered product analysis. Paste any URL and get a comprehensive audit in 60 seconds.

## Three Agents

### 1. Architectural Audit Agent
Scores your product on 6 dimensions (0-10 each):
- **Scalability** - Can it handle 10x/100x growth?
- **Payment Integration** - Is billing production-grade?
- **Software Design** - Clean architecture and tech stack?
- **Resilience** - How does it handle failures?
- **Security** - SSL, auth, headers, data protection
- **DevOps** - Deployment, CDN, monitoring

### 2. UX Revenue Verdict Agent
Delivers a YES/NO verdict on whether your product will get paid users:
- **First Impression** - What happens in 10 seconds?
- **Value Proposition** - Is the value clear?
- **Pricing Strategy** - Will people actually pay?
- **Conversion Funnel** - How well does it convert?
- **Trust Signals** - Would you give it your credit card?
- **User Experience** - Is it good to use?

### 3. Growth & Monetization Agent
Analyzes growth potential and monetization strategy across 6 dimensions (0-10 each):
- **Market Opportunity** - TAM, timing, underserved segments
- **Growth Engine** - Viral loops, acquisition channels, retention
- **Monetization Model** - Pricing, willingness to pay, LTV
- **Competitive Moat** - Defensibility, switching costs, network effects
- **Go-to-Market** - Distribution, partnerships, content strategy
- **Unit Economics** - CAC, margins, path to profitability

## Quick Start

```bash
# Clone
git clone https://github.com/fareezahmed/audit-agents.git
cd audit-agents

# Install
npm install

# Configure
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local

# Run
npm run dev
```

Open http://localhost:3000, enter a product name + URL, and run the audit.

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/fareezahmed/audit-agents&env=ANTHROPIC_API_KEY)

Add `ANTHROPIC_API_KEY` as an environment variable in your Vercel project settings.

## Tech Stack

- **Next.js 14** (App Router)
- **Claude API** (Sonnet 4) via `@anthropic-ai/sdk`
- **Cheerio** for server-side HTML parsing
- **Tailwind CSS** for styling

## API Routes

```
POST /api/audit/architecture  - Run architectural audit
POST /api/audit/ux-revenue    - Run UX revenue verdict
POST /api/audit/growth        - Run growth & monetization audit
```

Request body:
```json
{
  "name": "Product Name",
  "urls": ["https://example.com", "https://example.com/pricing"],
  "description": "Optional context about the product"
}
```

## License

MIT
