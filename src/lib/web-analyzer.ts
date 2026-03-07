import * as cheerio from "cheerio";

export interface PageAnalysis {
  url: string;
  title: string;
  metaDescription: string;
  statusCode: number;
  textContent: string;
  pricingText: string;
  ctaButtons: string[];
  techSignals: string[];
  hasSsl: boolean;
  hasLogin: boolean;
  hasPricingPage: boolean;
  hasTestimonials: boolean;
  pageStructure: string;
  error?: string;
}

const TECH_PATTERNS: Record<string, RegExp[]> = {
  React: [/__NEXT_DATA__/, /_next\/static/, /react/i, /__reactFiber/],
  "Next.js": [/__NEXT_DATA__/, /_next\//],
  Vue: [/__vue__/, /vue\.js/i, /nuxt/i],
  Angular: [/ng-version/, /angular/i],
  Stripe: [/stripe\.com/, /js\.stripe\.com/],
  PayPal: [/paypal\.com/i],
  "Google Analytics": [/gtag\(/, /google-analytics/, /googletagmanager/],
  Intercom: [/intercom/i],
  Cloudflare: [/cloudflare/i, /cf-ray/i],
  Tailwind: [/tailwind/i],
  Bootstrap: [/bootstrap/i],
};

export async function analyzePage(url: string): Promise<PageAnalysis> {
  const analysis: PageAnalysis = {
    url,
    title: "",
    metaDescription: "",
    statusCode: 0,
    textContent: "",
    pricingText: "",
    ctaButtons: [],
    techSignals: [],
    hasSsl: url.startsWith("https"),
    hasLogin: false,
    hasPricingPage: false,
    hasTestimonials: false,
    pageStructure: "",
  };

  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(30000),
    });

    analysis.statusCode = resp.status;
    const html = await resp.text();
    const $ = cheerio.load(html);

    $("script, style, noscript").remove();

    analysis.title = $("title").text().trim();
    analysis.metaDescription =
      $('meta[name="description"]').attr("content") || "";

    analysis.textContent = $("body").text().replace(/\s+/g, " ").trim().slice(0, 8000);

    // Tech signals
    const signals = new Set<string>();
    for (const [tech, patterns] of Object.entries(TECH_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(html)) {
          signals.add(tech);
          break;
        }
      }
    }
    analysis.techSignals = Array.from(signals);

    // CTAs
    const ctaKeywords = [
      "sign up", "get started", "start", "try", "subscribe",
      "buy", "purchase", "join", "register", "free", "demo",
      "book", "contact", "learn more",
    ];
    const ctas = new Set<string>();
    $("a, button").each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length < 60) {
        const lower = text.toLowerCase();
        if (ctaKeywords.some((kw) => lower.includes(kw))) {
          ctas.add(text);
        }
      }
    });
    analysis.ctaButtons = Array.from(ctas).slice(0, 20);

    // Pricing
    const pricingKeywords = [
      "pricing", "price", "plan", "subscription", "/mo", "/yr",
      "free trial", "premium", "enterprise", "starter", "pro", "$",
    ];
    const pricingSections: string[] = [];
    $("section, div, article").each((_, el) => {
      if (pricingSections.length >= 3) return false;
      const text = $(el).text().replace(/\s+/g, " ").trim().slice(0, 500);
      if (pricingKeywords.some((kw) => text.toLowerCase().includes(kw))) {
        pricingSections.push(text);
      }
    });
    analysis.pricingText = pricingSections.join("\n---\n").slice(0, 3000);

    // Page structure
    const structParts: string[] = [];
    const navLinks: string[] = [];
    $("nav a").each((_, el) => {
      const t = $(el).text().trim();
      if (t) navLinks.push(t);
    });
    if (navLinks.length) structParts.push("Navigation: " + navLinks.slice(0, 15).join(", "));

    const headings: string[] = [];
    $("h1, h2, h3").each((_, el) => {
      const t = $(el).text().trim();
      if (t) headings.push(el.tagName + ": " + t);
    });
    if (headings.length) structParts.push("Headings:\n" + headings.slice(0, 20).join("\n"));
    analysis.pageStructure = structParts.join("\n\n").slice(0, 2000);

    // Flags
    const lower = html.toLowerCase();
    analysis.hasLogin = ["sign in", "log in", "login", "signin"].some((kw) => lower.includes(kw));
    analysis.hasPricingPage = $('a[href*="pricing"]').length > 0;
    analysis.hasTestimonials = [
      "testimonial", "customer stories", "what our customers",
      "trusted by", "reviews",
    ].some((kw) => analysis.textContent.toLowerCase().includes(kw));

    // Try fetching pricing page
    if (analysis.hasPricingPage) {
      const pricingHref = $('a[href*="pricing"]').first().attr("href");
      if (pricingHref) {
        const pricingUrl = pricingHref.startsWith("http")
          ? pricingHref
          : new URL(pricingHref, url).toString();
        try {
          const pResp = await fetch(pricingUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            },
            signal: AbortSignal.timeout(15000),
          });
          const pHtml = await pResp.text();
          const p$ = cheerio.load(pHtml);
          p$("script, style, noscript").remove();
          analysis.pricingText = p$("body").text().replace(/\s+/g, " ").trim().slice(0, 5000);
        } catch {
          // Keep existing pricing text
        }
      }
    }
  } catch (e: unknown) {
    analysis.error = e instanceof Error ? e.message : String(e);
  }

  return analysis;
}

export function formatAnalysisForLLM(analysis: PageAnalysis): string {
  const parts = [
    "# Web Page Analysis: " + analysis.url,
    "Status: " + analysis.statusCode,
    "Title: " + analysis.title,
    "Description: " + analysis.metaDescription,
    "SSL: " + analysis.hasSsl,
    "Login/Auth: " + analysis.hasLogin,
    "Pricing Page: " + analysis.hasPricingPage,
    "Testimonials: " + analysis.hasTestimonials,
  ];
  if (analysis.error) parts.push("ERROR: " + analysis.error);
  parts.push(
    "",
    "## Tech Signals",
    analysis.techSignals.length ? analysis.techSignals.join(", ") : "None detected",
    "",
    "## Page Structure",
    analysis.pageStructure || "Could not extract",
    "",
    "## CTAs / Buttons",
    analysis.ctaButtons.length ? analysis.ctaButtons.map((c) => "- " + c).join("\n") : "None found",
    "",
    "## Pricing Content",
    analysis.pricingText.slice(0, 3000) || "No pricing content found",
    "",
    "## Page Content (truncated)",
    analysis.textContent.slice(0, 5000)
  );
  return parts.join("\n");
}
