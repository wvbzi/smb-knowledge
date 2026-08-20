export type UrlValidationResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/*
    Accepts user input with or without a schema (e.g. "example.com" or
    "https://example.com"). Adds https:// if missing, then validates with
    the native URL constructor. Returns a discriminated union so callers
    (route handlers, form submit handlers) can branch on `.ok` without
    try/catch.
 */

export function validateUrl(input: string): UrlValidationResult {
  const trimmed = input.trim();
 
  if (!trimmed) {
    return { ok: false, error: "Please enter a URL" };
  }
 
  const hasSchema = /^https?:\/\//i.test(trimmed);
  const candidate = hasSchema ? trimmed : `https://${trimmed}`;
 
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { ok: false, error: "Incorrect URL format" };
  }
 
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "URL must use http or https" };
  }
 
  if (!isValidHostname(parsed.hostname)) {
    return { ok: false, error: "Enter a valid domain, e.g. dns.example.com" };
  }
 
  return { ok: true, url: parsed.toString() };
}
 
/*
  Validates that a hostname has at least one real label plus a valid
  TLD (2+ characters). 
 */
function isValidHostname(hostname: string): boolean {
  const stripped = hostname.replace(/\.$/, ""); // drop a trailing root dot
  return /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(stripped);
}