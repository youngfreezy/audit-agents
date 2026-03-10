/**
 * HTTP client for the Moltbook API.
 *
 * Handles authentication, rate limiting, and the math verification
 * challenge required after creating posts.
 */

const BASE_URL = "https://www.moltbook.com/api/v1";

// ---------------------------------------------------------------------------
// Rate limiting state (in-memory, resets on cold start — acceptable for
// Vercel cron which runs a fresh function per invocation; the timestamps
// protect across rapid re-invocations within the same process).
// ---------------------------------------------------------------------------

interface RateLimitState {
  postTimestamps: number[]; // timestamps of POST /posts
  commentCountToday: number;
  commentDayStart: number; // start-of-day epoch ms
  writeTimestamps: number[]; // all write operation timestamps
}

const rateState: RateLimitState = {
  postTimestamps: [],
  commentCountToday: 0,
  commentDayStart: 0,
  writeTimestamps: [],
};

function now(): number {
  return Date.now();
}

function startOfDay(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function canPost(): boolean {
  const thirtyMinAgo = now() - 30 * 60 * 1000;
  rateState.postTimestamps = rateState.postTimestamps.filter(
    (t) => t > thirtyMinAgo
  );
  return rateState.postTimestamps.length === 0;
}

function canComment(): boolean {
  const today = startOfDay();
  if (rateState.commentDayStart < today) {
    rateState.commentCountToday = 0;
    rateState.commentDayStart = today;
  }
  return rateState.commentCountToday < 50;
}

function canWrite(): boolean {
  const sixtySecsAgo = now() - 60 * 1000;
  rateState.writeTimestamps = rateState.writeTimestamps.filter(
    (t) => t > sixtySecsAgo
  );
  return rateState.writeTimestamps.length < 30;
}

function recordPost(): void {
  const t = now();
  rateState.postTimestamps.push(t);
  rateState.writeTimestamps.push(t);
}

function recordComment(): void {
  const today = startOfDay();
  if (rateState.commentDayStart < today) {
    rateState.commentCountToday = 0;
    rateState.commentDayStart = today;
  }
  rateState.commentCountToday++;
  rateState.writeTimestamps.push(now());
}

function recordWrite(): void {
  rateState.writeTimestamps.push(now());
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

function getHeaders(): Record<string, string> {
  const key = process.env.MOLTBOOK_API_KEY;
  if (!key) throw new Error("MOLTBOOK_API_KEY not configured");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

async function apiRequest<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const opts: RequestInit = {
    method,
    headers: getHeaders(),
  };
  if (body !== undefined) {
    opts.body = JSON.stringify(body);
  }

  const res = await fetch(url, opts);

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Moltbook API ${method} ${path} failed: ${res.status} ${res.statusText} — ${text}`
    );
  }

  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Verification challenge solver
// ---------------------------------------------------------------------------

/**
 * Parse and solve the math verification challenge.
 * challenge_text comes in weird formats like:
 *   "What is 3 plus 5?"
 *   "Calculate: 12.5 * 3"
 *   "seven + three"
 *   "What's 10 divided by 3?"
 */
export function solveVerificationChallenge(challengeText: string): string {
  const text = challengeText.toLowerCase().replace(/[?!]/g, "").trim();

  // Word-to-number mapping
  const wordNums: Record<string, number> = {
    zero: 0, one: 1, two: 2, three: 3, four: 4,
    five: 5, six: 6, seven: 7, eight: 8, nine: 9,
    ten: 10, eleven: 11, twelve: 12, thirteen: 13,
    fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
    eighteen: 18, nineteen: 19, twenty: 20,
    thirty: 30, forty: 40, fifty: 50, sixty: 60,
    seventy: 70, eighty: 80, ninety: 90, hundred: 100,
  };

  // Replace word numbers with digits
  let normalized = text;
  for (const [word, num] of Object.entries(wordNums)) {
    normalized = normalized.replace(new RegExp(`\\b${word}\\b`, "g"), String(num));
  }

  // Normalize operation words
  normalized = normalized
    .replace(/\bplus\b/g, "+")
    .replace(/\badd(ed)?\b/g, "+")
    .replace(/\bsum\b/g, "+")
    .replace(/\bminus\b/g, "-")
    .replace(/\bsubtract(ed)?\b/g, "-")
    .replace(/\btimes\b/g, "*")
    .replace(/\bmultipl(y|ied)\b/g, "*")
    .replace(/\bdivided\s*by\b/g, "/")
    .replace(/\bdivide\b/g, "/")
    .replace(/x(?=\s*\d)/g, "*");

  // Extract numbers and operator
  const numbers = normalized.match(/-?\d+\.?\d*/g);
  const ops = normalized.match(/[+\-*/]/g);

  if (!numbers || numbers.length < 2 || !ops || ops.length < 1) {
    console.error(
      `[moltbook] Could not parse verification challenge: "${challengeText}" -> "${normalized}"`
    );
    return "0.00";
  }

  const a = parseFloat(numbers[0]);
  const b = parseFloat(numbers[1]);
  const op = ops[0];

  let result: number;
  switch (op) {
    case "+":
      result = a + b;
      break;
    case "-":
      result = a - b;
      break;
    case "*":
      result = a * b;
      break;
    case "/":
      result = b !== 0 ? a / b : 0;
      break;
    default:
      result = 0;
  }

  return result.toFixed(2);
}

// ---------------------------------------------------------------------------
// Public API methods
// ---------------------------------------------------------------------------

export interface MoltbookPost {
  id: string;
  content: string;
  author?: { id: string; name: string };
  upvotes?: number;
  downvotes?: number;
  comments?: MoltbookComment[];
  created_at?: string;
  verification_challenge?: { challenge_text: string };
}

export interface MoltbookComment {
  id: string;
  content: string;
  author?: { id: string; name: string };
  created_at?: string;
}

export interface MoltbookFeed {
  posts: MoltbookPost[];
}

export interface MoltbookAgent {
  id: string;
  name: string;
  reputation?: number;
  [key: string]: unknown;
}

/**
 * Create a post on Moltbook. Automatically solves the verification
 * challenge that follows.
 */
export async function createPost(content: string): Promise<MoltbookPost> {
  if (!canPost()) {
    throw new Error("Rate limit: can only post once per 30 minutes");
  }
  if (!canWrite()) {
    throw new Error("Rate limit: max 30 writes per 60 seconds");
  }

  const post = await apiRequest<MoltbookPost>("POST", "/posts", { content });
  recordPost();

  // Auto-solve verification challenge if present
  if (post.verification_challenge?.challenge_text) {
    const answer = solveVerificationChallenge(
      post.verification_challenge.challenge_text
    );
    console.log(
      `[moltbook] Solving verification: "${post.verification_challenge.challenge_text}" -> ${answer}`
    );
    await solveVerification(post.id, answer);
  }

  return post;
}

/**
 * Solve the math verification challenge for a post.
 */
export async function solveVerification(
  postId: string,
  answer: string
): Promise<void> {
  if (!canWrite()) {
    throw new Error("Rate limit: max 30 writes per 60 seconds");
  }
  await apiRequest("POST", "/verify", {
    post_id: postId,
    answer,
  });
  recordWrite();
}

/**
 * Comment on a post.
 */
export async function commentOnPost(
  postId: string,
  content: string
): Promise<MoltbookComment> {
  if (!canComment()) {
    throw new Error("Rate limit: max 50 comments per day");
  }
  if (!canWrite()) {
    throw new Error("Rate limit: max 30 writes per 60 seconds");
  }

  const comment = await apiRequest<MoltbookComment>(
    "POST",
    `/posts/${postId}/comments`,
    { content }
  );
  recordComment();
  return comment;
}

/**
 * Vote on a post (upvote or downvote).
 */
export async function voteOnPost(
  postId: string,
  direction: "upvote" | "downvote"
): Promise<void> {
  if (!canWrite()) {
    throw new Error("Rate limit: max 30 writes per 60 seconds");
  }
  await apiRequest("POST", `/posts/${postId}/vote`, { direction });
  recordWrite();
}

/**
 * Read the Moltbook home feed.
 */
export async function getFeed(): Promise<MoltbookFeed> {
  return apiRequest<MoltbookFeed>("GET", "/home");
}

/**
 * Get agent info for the authenticated agent.
 */
export async function getAgentInfo(): Promise<MoltbookAgent> {
  return apiRequest<MoltbookAgent>("GET", "/agents/me");
}

/**
 * Get a single post with its comments.
 */
export async function getPost(postId: string): Promise<MoltbookPost> {
  return apiRequest<MoltbookPost>("GET", `/posts/${postId}`);
}
