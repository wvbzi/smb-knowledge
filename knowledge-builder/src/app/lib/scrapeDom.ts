import * as cheerio from "cheerio";
import type {
  KnowledgeBase,
  OnlinePresence,
  LegalCompliance,
  Offering,
} from "@/types/knowledge";

const SOCIAL_DOMAIN_MAP: Record<string, keyof OnlinePresence> = {
  "linkedin.com": "linkedin",
  "facebook.com": "facebook",
  "instagram.com": "instagram",
  "twitter.com": "twitter",
  "x.com": "twitter",
  "youtube.com": "youtube",
  "tiktok.com": "tiktok",
};

// Action verbs and phrases for detecting Call-To-Action buttons
const CTA_PATTERNS = [
  /get started/i,
  /contact (us|now)/i,
  /book (now|a? ?demo|appointment)/i,
  /schedule (my |an? )?(inspection|appointment|call|demo)/i,
  /request (an? )?(estimate|quote|consultation)/i,
  /free (quote|estimate|trial|consultation)/i,
  /start (for )?free/i,
  /join (the )?waitlist/i,
  /call (us |now |today )/i,
  /learn more/i,
  /sign up/i,
  /try (it )?free/i,
];

// Popular web & brand fonts
const KNOWN_FONTS = [
  "Poppins", "Inter", "Roboto", "Montserrat", "Open Sans", "Lato",
  "Outfit", "Plus Jakarta Sans", "DM Sans", "Raleway", "Geist",
  "Nunito", "Playfair Display", "Merriweather", "Arial", "Helvetica"
];

function resolveUrl(url: string | undefined, baseUrl: string): string | null {
  if (!url || !url.trim()) return null;
  try {
    return new URL(url.trim(), baseUrl).toString();
  } catch {
    return null;
  }
}

// Convert rgb(r, g, b) to hex string
function rgbToHex(rgbStr: string): string | null {
  const match = rgbStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!match) return null;
  const r = parseInt(match[1], 10).toString(16).padStart(2, "0");
  const g = parseInt(match[2], 10).toString(16).padStart(2, "0");
  const b = parseInt(match[3], 10).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`.toLowerCase();
}

/**
 * Extracts partial KnowledgeBase from DOM links, semantic tags, and footer heuristics.
 */
export function extractFromDom(html: string, baseUrl: string): Partial<KnowledgeBase> {
  const $ = cheerio.load(html);

  // --- Legal / Compliance URLs ---
  let privacyPolicyUrl: string | null = null;
  let termsOfServiceUrl: string | null = null;

  $("a").each((_, el) => {
    const text = $(el).text().toLowerCase().trim();
    const href = $(el).attr("href");
    if (!href) return;

    if (!privacyPolicyUrl && (text.includes("privacy") || href.includes("privacy"))) {
      privacyPolicyUrl = resolveUrl(href, baseUrl);
    }
    if (
      !termsOfServiceUrl &&
      (text.includes("terms") || text.includes("tos") || href.includes("terms") || href.includes("tos"))
    ) {
      termsOfServiceUrl = resolveUrl(href, baseUrl);
    }
  });

  const legal: LegalCompliance = {
    privacyPolicyUrl,
    termsOfServiceUrl,
  };

  // --- Social Media Links in <a> tags ---
  const onlinePresence: Partial<OnlinePresence> = {};
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") || "";
    for (const [domain, field] of Object.entries(SOCIAL_DOMAIN_MAP)) {
      if (href.includes(domain) && !onlinePresence[field]) {
        if (!href.includes("/sharer") && !href.includes("/intent/")) {
          onlinePresence[field] = href.replace(/#$/, "");
        }
      }
    }
  });

  // --- Year Founded Heuristic from Footer Copyright ---
  let yearFounded: number | null = null;
  const footerText = $("footer, #footer, .footer, [class*='footer']").text() || $("body").text();
  const copyrightMatch = footerText.match(
    /(?:©|copyright|\(c\))\s*(?:19|20)\d{2}\s*[-–—]\s*((?:19|20)\d{2})|(?:©|copyright|\(c\))\s*((?:19|20)\d{2})/i
  );
  if (copyrightMatch) {
    const yearStr = copyrightMatch[2] || copyrightMatch[1];
    if (yearStr) {
      const parsedYear = parseInt(yearStr, 10);
      if (parsedYear >= 1900 && parsedYear <= new Date().getFullYear()) {
        yearFounded = parsedYear;
      }
    }
  }

  // --- CTAs from buttons & action links ---
  const ctas: string[] = [];
  $("button, a, [role='button']").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text.length > 2 && text.length < 40) {
      if (CTA_PATTERNS.some((p) => p.test(text))) {
        if (!ctas.includes(text)) {
          ctas.push(text);
        }
      }
    }
  });

  // --- Columnar Footer & Nav Link Extraction ---
  const offerings: Offering[] = [];
  const seenOfferings = new Set<string>();
  const industryGroupings: string[] = [];
  const targetBuyers: string[] = [];

  // Inspect link groups inside footer, nav, or section containers
  $("footer, #footer, .footer, [class*='footer'], nav, header").each((_, section) => {
    // Look for column containers that have a heading + links
    $(section).find("div, section, ul").each((_, col) => {
      const heading = $(col).find("h3, h4, h5, h6, strong, p, span").first().text().trim();
      if (!heading || heading.length > 30) return;

      const isProductCol = /(?:products?|solutions?|services?|apps?|tools?|labs?|platform|features?|offerings?)/i.test(heading);
      const isIndustryCol = /(?:industr(?:y|ies)|verticals?|markets?|solutions for|who we serve|use cases?)/i.test(heading);

      if (isProductCol || isIndustryCol) {
        $(col).find("a").each((_, aEl) => {
          const linkText = $(aEl).text().replace(/\s+/g, " ").trim();
          if (!linkText || linkText.length < 2 || linkText.length > 40) return;
          if (/about|contact|careers|privacy|terms|help|blog|changelog|pricing|faq/i.test(linkText)) return;

          if (isProductCol && !seenOfferings.has(linkText.toLowerCase())) {
            seenOfferings.add(linkText.toLowerCase());
            const id = typeof crypto !== "undefined" && crypto.randomUUID
              ? crypto.randomUUID()
              : `off_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

            offerings.push({
              id,
              name: linkText,
              category: heading,
              features: [],
              description: null,
              pricing: null,
            });
          }

          if (isIndustryCol && !industryGroupings.includes(linkText)) {
            industryGroupings.push(linkText);
            targetBuyers.push(`${linkText} Companies`);
          }
        });
      }
    });
  });

  // --- Fallback Offerings Extraction from Structured Service/Product Cards ---
  $("[id*='service'], [id*='product'], [class*='service-card'], [class*='product-card'], [class*='offering']").each((_, el) => {
    const heading = $(el).find("h2, h3, h4").first().text().trim();
    if (heading && heading.length > 3 && heading.length < 60 && !seenOfferings.has(heading.toLowerCase())) {
      seenOfferings.add(heading.toLowerCase());
      const pText = $(el).find("p").first().text().trim();
      const id = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `off_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      offerings.push({
        id,
        name: heading,
        category: null,
        features: [],
        description: pText.length > 10 ? pText : null,
        pricing: null,
      });
    }
  });

  // --- Fonts Extraction ---
  const fonts: string[] = [];
  const rawHtml = $.html();

  for (const fontName of KNOWN_FONTS) {
    const regex = new RegExp(`(?:font-family|family=)[^;}"']*?\\b${fontName}\\b`, "i");
    if (regex.test(rawHtml) && !fonts.includes(fontName)) {
      fonts.push(fontName);
    }
  }

  // --- Brand Colors Extraction from CSS Styles / Tokens ---
  const colors: string[] = [];
  const colorMatches = rawHtml.match(/rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)|#(?:[0-9a-fA-F]{3}){1,2}\b/g) || [];
  for (const c of colorMatches) {
    const hex = c.startsWith("#") ? c.toLowerCase() : rgbToHex(c);
    if (
      hex &&
      hex !== "#ffffff" &&
      hex !== "#000000" &&
      hex !== "#ffffff" &&
      !colors.includes(hex)
    ) {
      colors.push(hex);
      if (colors.length >= 4) break;
    }
  }

  // --- Pitch / Tagline Extraction from Slogans ---
  let pitch: string | null = null;
  const sloganHeading = $("h1, h2, footer p, .hero p, [class*='headline']").filter((_, el) => {
    const t = $(el).text().trim();
    return /all-in-one|growth platform|top-rated|premier|specializ/i.test(t) && t.length > 15 && t.length < 200;
  }).first().text().trim();

  if (sloganHeading) {
    pitch = sloganHeading;
  }

  return {
    companyFoundation: {
      description: null,
      website: baseUrl,
      industry: null,
      businessModel: null,
      companyRole: null,
      yearFounded,
      legalEntityType: null,
      employeeCount: null,
      mainAddress: null,
      otherLocations: [],
      serviceLocations: [],
      altCompanyNames: [],
    },
    positioning: {
      pitch,
      foundingStory: null,
    },
    brandingAndStyle: {
      writingStyle: null,
      artStyle: null,
      fonts,
      colors,
      logos: [],
    },
    onlinePresence: {
      linkedin: onlinePresence.linkedin ?? null,
      facebook: onlinePresence.facebook ?? null,
      instagram: onlinePresence.instagram ?? null,
      twitter: onlinePresence.twitter ?? null,
      youtube: onlinePresence.youtube ?? null,
      tiktok: onlinePresence.tiktok ?? null,
    },
    marketAndCustomers: {
      targetBuyers,
      customerNeeds: null,
      idealPersona: null,
      industryGroupings,
      industryOutlook: null,
      channels: ["Website", "Direct Online Sales"],
      funnels: [],
      ctas: ctas.slice(0, 8),
      suppliers: [],
    },
    offerings,
    legal,
  };
}
