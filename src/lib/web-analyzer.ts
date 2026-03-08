import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

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
  monetizationSignals: string[];
  pageStructure: string;
  renderedContentLength: number;
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
  RevenueCat: [/revenuecat/i, /purchases\.js/],
  Chargebee: [/chargebee/i],
  Recurly: [/recurly/i],
  Paddle: [/paddle\.js/, /paddle\.com/i],
  "Lemon Squeezy": [/lemonsqueezy/i],
};

async function getBrowser() {
  const isLocal = !process.env.AWS_LAMBDA_FUNCTION_VERSION && !process.env.VERCEL;

  if (isLocal) {
    // Local dev: use system Chrome
    const possiblePaths = [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/usr/bin/google-chrome",
      "/usr/bin/chromium-browser",
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    ];
    let execPath = "";
    for (const p of possiblePaths) {
      try {
        const { existsSync } = await import("fs");
        if (existsSync(p)) { execPath = p; break; }
      } catch { /* skip */ }
    }
    if (!execPath) throw new Error("No local Chrome found. Install Chrome or set CHROME_PATH.");
    return puppeteer.launch({
      executablePath: execPath,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
  }

  // Vercel/Lambda: use @sparticuz/chromium
  return puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1280, height: 720 },
    executablePath: await chromium.executablePath(),
    headless: true,
  });
}

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
    monetizationSignals: [],
    pageStructure: "",
    renderedContentLength: 0,
  };

  let browser;
  try {
    browser = await getBrowser();
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    const response = await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 45000,
    });
    analysis.statusCode = response?.status() ?? 0;

    // Wait for client-side rendering to complete
    await page.waitForSelector("body", { timeout: 5000 }).catch(() => {});
    // Extra wait for React/Next.js hydration
    await new Promise((r) => setTimeout(r, 2000));

    // Get the fully rendered HTML
    const html = await page.content();

    // Get rendered text content from the DOM (includes client-side rendered content)
    const renderedText = await page.evaluate(() => {
      // Remove script/style elements
      document.querySelectorAll("script, style, noscript").forEach((el) => el.remove());
      return document.body?.innerText || "";
    });

    analysis.textContent = renderedText.replace(/\s+/g, " ").trim().slice(0, 8000);
    analysis.renderedContentLength = renderedText.length;
    console.log(`[web-analyzer] ${url} — rendered content length: ${renderedText.length} chars`);

    // Title and meta
    analysis.title = await page.title();
    analysis.metaDescription = await page.evaluate(() => {
      return document.querySelector('meta[name="description"]')?.getAttribute("content") || "";
    });

    // Tech signals from HTML source
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

    // CTAs from rendered DOM
    const ctaKeywords = [
      "sign up", "get started", "start", "try", "subscribe",
      "buy", "purchase", "join", "register", "free", "demo",
      "book", "contact", "learn more",
    ];
    analysis.ctaButtons = await page.evaluate((keywords: string[]) => {
      const ctas = new Set<string>();
      document.querySelectorAll("a, button").forEach((el) => {
        const text = (el as HTMLElement).innerText?.trim();
        if (text && text.length < 60) {
          const lower = text.toLowerCase();
          if (keywords.some((kw) => lower.includes(kw))) {
            ctas.add(text);
          }
        }
      });
      return Array.from(ctas).slice(0, 20);
    }, ctaKeywords);

    // Pricing content from rendered DOM
    const pricingKeywords = [
      "pricing", "price", "plan", "subscription", "/mo", "/yr",
      "free trial", "premium", "enterprise", "starter", "pro", "$",
    ];
    analysis.pricingText = await page.evaluate((keywords: string[]) => {
      const sections: string[] = [];
      document.querySelectorAll("section, div, article").forEach((el) => {
        if (sections.length >= 3) return;
        const text = (el as HTMLElement).innerText?.replace(/\s+/g, " ").trim().slice(0, 500);
        if (text && keywords.some((kw) => text.toLowerCase().includes(kw))) {
          sections.push(text);
        }
      });
      return sections.join("\n---\n").slice(0, 3000);
    }, pricingKeywords);

    // Page structure from rendered DOM
    analysis.pageStructure = await page.evaluate(() => {
      const parts: string[] = [];
      const navLinks: string[] = [];
      document.querySelectorAll("nav a").forEach((el) => {
        const t = (el as HTMLElement).innerText?.trim();
        if (t) navLinks.push(t);
      });
      if (navLinks.length) parts.push("Navigation: " + navLinks.slice(0, 15).join(", "));

      const headings: string[] = [];
      document.querySelectorAll("h1, h2, h3").forEach((el) => {
        const t = (el as HTMLElement).innerText?.trim();
        if (t) headings.push(el.tagName + ": " + t);
      });
      if (headings.length) parts.push("Headings:\n" + headings.slice(0, 20).join("\n"));
      return parts.join("\n\n").slice(0, 2000);
    });

    // Flags from rendered content
    const lower = analysis.textContent.toLowerCase();
    analysis.hasLogin = ["sign in", "log in", "login", "signin"].some((kw) => lower.includes(kw));
    analysis.hasPricingPage = await page.evaluate(() => {
      return document.querySelectorAll('a[href*="pricing"]').length > 0;
    });
    analysis.hasTestimonials = [
      "testimonial", "customer stories", "what our customers",
      "trusted by", "reviews", "what job seekers",
    ].some((kw) => lower.includes(kw));

    // Monetization signals
    const monetizationKeywords = [
      "monthly", "annual", "annually", "per month", "per year", "/mo", "/yr",
      "free trial", "7-day trial", "14-day trial", "30-day trial",
      "cancel anytime", "no commitment", "money-back",
      "paywall", "upgrade", "downgrade", "subscribe",
      "enterprise", "per seat", "per user", "team plan",
      "lifetime", "one-time purchase", "billing",
      "freemium", "free plan", "free tier", "basic plan", "pro plan",
      "credit", "per application", "roi", "time saved",
    ];
    const monSignals = new Set<string>();
    for (const kw of monetizationKeywords) {
      if (lower.includes(kw) || analysis.pricingText.toLowerCase().includes(kw)) {
        monSignals.add(kw);
      }
    }
    analysis.monetizationSignals = Array.from(monSignals);

    // Try fetching pricing page if linked
    if (analysis.hasPricingPage) {
      const pricingHref = await page.evaluate(() => {
        const el = document.querySelector('a[href*="pricing"]');
        return el?.getAttribute("href") || "";
      });
      if (pricingHref) {
        const pricingUrl = pricingHref.startsWith("http")
          ? pricingHref
          : new URL(pricingHref, url).toString();
        try {
          await page.goto(pricingUrl, { waitUntil: "networkidle2", timeout: 20000 });
          await new Promise((r) => setTimeout(r, 1500));
          const pricingText = await page.evaluate(() => {
            document.querySelectorAll("script, style, noscript").forEach((el) => el.remove());
            return document.body?.innerText?.replace(/\s+/g, " ").trim().slice(0, 5000) || "";
          });
          analysis.pricingText = pricingText;
        } catch {
          // Keep existing pricing text
        }
      }
    }

    console.log(`[web-analyzer] ${url} — CTAs found: ${analysis.ctaButtons.length}, tech: ${analysis.techSignals.join(",")}, monetization signals: ${analysis.monetizationSignals.length}`);
  } catch (e: unknown) {
    analysis.error = e instanceof Error ? e.message : String(e);
    console.error(`[web-analyzer] Error analyzing ${url}:`, analysis.error);
  } finally {
    if (browser) await browser.close().catch(() => {});
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
    "Rendered Content Length: " + analysis.renderedContentLength + " chars",
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
    "## Monetization Signals",
    analysis.monetizationSignals.length ? analysis.monetizationSignals.join(", ") : "None detected",
    "",
    "## Page Content (fully rendered, truncated)",
    analysis.textContent.slice(0, 5000)
  );
  return parts.join("\n");
}
