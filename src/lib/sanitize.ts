/**
 * SECURITY-CRITICAL: Input sanitization for Moltbook content
 * before injecting into LLM prompts.
 *
 * All external content from Moltbook must pass through sanitize()
 * before being used in any prompt context.
 */

const INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|context)/gi,
  /you\s+are\s+now/gi,
  /^system\s*:/gim,
  /^assistant\s*:/gim,
  /^human\s*:/gim,
  /<\s*system\s*>/gi,
  /<\s*\/\s*system\s*>/gi,
  /IMPORTANT\s*:/gi,
  /OVERRIDE/gi,
  /new\s+instructions/gi,
  /disregard\s+(all\s+)?(previous|prior|above)/gi,
  /forget\s+(all\s+)?(previous|prior|above)/gi,
  /do\s+not\s+follow\s+(previous|prior|above)/gi,
  /\[\s*INST\s*\]/gi,
  /\[\s*\/\s*INST\s*\]/gi,
  /<<\s*SYS\s*>>/gi,
  /<<\s*\/\s*SYS\s*>>/gi,
];

// Matches base64 strings (min 40 chars to avoid false positives)
const BASE64_PATTERN = /[A-Za-z0-9+/]{40,}={0,2}/g;

// Matches URLs except github.com
const URL_PATTERN = /https?:\/\/(?!github\.com)[^\s)>\]"']+/gi;

// Matches markdown code blocks
const CODE_BLOCK_PATTERN = /```[\s\S]*?```/g;

// Matches XML/HTML tags
const TAG_PATTERN = /<\/?[a-zA-Z][^>]*>/g;

export interface SanitizeOptions {
  maxLength?: number;
}

export function sanitize(
  input: string,
  options: SanitizeOptions = {}
): string {
  const { maxLength = 500 } = options;

  if (!input || typeof input !== "string") return "";

  let text = input;
  const removals: string[] = [];

  // Strip markdown code blocks
  const codeBlocks = text.match(CODE_BLOCK_PATTERN);
  if (codeBlocks) {
    removals.push(`code_blocks:${codeBlocks.length}`);
    text = text.replace(CODE_BLOCK_PATTERN, "");
  }

  // Remove XML/HTML tags
  const tags = text.match(TAG_PATTERN);
  if (tags) {
    removals.push(`html_tags:${tags.length}`);
    text = text.replace(TAG_PATTERN, "");
  }

  // Remove prompt injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    // Reset lastIndex for global regexes
    pattern.lastIndex = 0;
    const matches = text.match(pattern);
    if (matches) {
      removals.push(`injection:"${matches[0].slice(0, 30)}"`);
      text = text.replace(pattern, "");
    }
  }

  // Remove base64 encoded strings
  const base64Matches = text.match(BASE64_PATTERN);
  if (base64Matches) {
    removals.push(`base64:${base64Matches.length}`);
    text = text.replace(BASE64_PATTERN, "");
  }

  // Remove non-GitHub URLs
  const urlMatches = text.match(URL_PATTERN);
  if (urlMatches) {
    removals.push(`urls:${urlMatches.length}`);
    text = text.replace(URL_PATTERN, "");
  }

  // Log removals
  if (removals.length > 0) {
    console.warn(
      `[sanitize] Removed content from Moltbook input: ${removals.join(", ")}`
    );
  }

  // Collapse whitespace and trim
  text = text.replace(/\s+/g, " ").trim();

  // Truncate
  if (text.length > maxLength) {
    console.warn(
      `[sanitize] Truncated from ${text.length} to ${maxLength} chars`
    );
    text = text.slice(0, maxLength);
  }

  return text;
}
