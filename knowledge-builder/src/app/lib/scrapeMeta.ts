import * as cheerio from "cheerio";
import type { KnowledgeBase } from "@/types/knowledge";

// Resolve relative URL against base URL
function resolveUrl(url: string | undefined, baseUrl: string): string | null {
  if (!url || !url.trim()) return null;
  try {
    return new URL(url.trim(), baseUrl).toString();
  } catch {
    return null;
  }
}

// Clean title tag string by removing common suffix patterns
function cleanTitle(raw: string | undefined): string | null {
  if (!raw || !raw.trim()) return null;
  const cleaned = raw
    .trim()
    .replace(/\s*([|\-–—:]\s*(home|homepage|welcome|official site)).*$/i, "")
    .trim();
  return cleaned.length > 0 ? cleaned : null;
}

// Validate if string is a valid hex color code
function normalizeHexColor(val: string | undefined): string | null {
  if (!val) return null;
  const trimmed = val.trim();
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  return null;
}

/**
 * Extracts partial KnowledgeBase from OpenGraph, Twitter, and standard HTML meta tags.
 */
export function extractFromMetaTags(html: string, baseUrl: string): Partial<KnowledgeBase> {
  const $ = cheerio.load(html);

  // --- Company Name & Title ---
  const siteName = $('meta[property="og:site_name"]').attr("content");
  const ogTitle = $('meta[property="og:title"]').attr("content");
  const twitterTitle = $('meta[name="twitter:title"]').attr("content");
  const pageTitle = $("title").text();

  const companyName =
    (siteName && siteName.trim()) ||
    cleanTitle(ogTitle) ||
    cleanTitle(twitterTitle) ||
    cleanTitle(pageTitle) ||
    null;

  // --- Description ---
  const ogDesc = $('meta[property="og:description"]').attr("content");
  const twitterDesc = $('meta[name="twitter:description"]').attr("content");
  const metaDesc = $('meta[name="description"]').attr("content");
  const description = (ogDesc || twitterDesc || metaDesc || "").trim() || null;

  // --- Website URL ---
  const ogUrl = $('meta[property="og:url"]').attr("content");
  const canonicalUrl = $('link[rel="canonical"]').attr("href");
  const website = resolveUrl(ogUrl || canonicalUrl, baseUrl) || baseUrl;

  // --- Logos / Images ---
  const logos: string[] = [];
  const addLogo = (url: string | undefined) => {
    const resolved = resolveUrl(url, baseUrl);
    if (resolved && !logos.includes(resolved)) {
      logos.push(resolved);
    }
  };

  addLogo($('meta[property="og:image"]').attr("content"));
  addLogo($('meta[name="twitter:image"]').attr("content"));
  addLogo($('link[rel="apple-touch-icon"]').attr("href"));
  addLogo($('link[rel="icon"][sizes*="192"], link[rel="icon"][sizes*="512"]').attr("href"));
  addLogo($('link[rel="shortcut icon"], link[rel="icon"]').attr("href"));

  // --- Colors ---
  const colors: string[] = [];
  const addColor = (c: string | undefined) => {
    const hex = normalizeHexColor(c);
    if (hex && !colors.includes(hex)) {
      colors.push(hex);
    }
  };

  addColor($('meta[name="theme-color"]').attr("content"));
  addColor($('meta[name="msapplication-TileColor"]').attr("content"));

  // --- Keywords for Industry Groupings ---
  const metaKeywords = $('meta[name="keywords"]').attr("content");
  const industryGroupings: string[] = [];
  if (metaKeywords) {
    const split = metaKeywords
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 2 && k.length < 40);
    industryGroupings.push(...split.slice(0, 8));
  }

  return {
    companyName,
    companyFoundation: {
      description,
      website,
      industry: null,
      businessModel: null,
      companyRole: null,
      yearFounded: null,
      legalEntityType: null,
      employeeCount: null,
      mainAddress: null,
      otherLocations: [],
      serviceLocations: [],
      altCompanyNames: [],
    },
    brandingAndStyle: {
      writingStyle: null,
      artStyle: null,
      fonts: [],
      colors,
      logos,
    },
    marketAndCustomers: {
      targetBuyers: [],
      customerNeeds: null,
      idealPersona: null,
      industryGroupings,
      industryOutlook: null,
      channels: [],
      funnels: [],
      ctas: [],
      suppliers: [],
    },
  };
}
