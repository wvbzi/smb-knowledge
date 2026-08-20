import { extractFromJsonLd } from "./scrapeJsonLd";
import { extractFromMetaTags } from "./scrapeMeta";
import { extractFromDom } from "./scrapeDom";
import type {
  KnowledgeBase,
  CompanyFoundation,
  Positioning,
  MarketAndCustomers,
  BrandingAndStyle,
  OnlinePresence,
  KeyPerson,
  Offering,
  FaqItem,
  LegalCompliance,
} from "@/types/knowledge";

// Fetch website HTML with timeout and realistic User-Agent
export async function fetchHtml(targetUrl: string): Promise<{ html: string; finalUrl: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Target site responded with status ${response.status}`);
    }

    const html = await response.text();
    return { html, finalUrl: response.url || targetUrl };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Request to target site timed out after 10s");
    }
    throw err;
  }
}

// Deduplicate string arrays while preserving order
function mergeUniqueStrings(...arrays: (string[] | undefined)[]): string[] {
  const set = new Set<string>();
  for (const arr of arrays) {
    if (Array.isArray(arr)) {
      for (const item of arr) {
        if (item && item.trim()) set.add(item.trim());
      }
    }
  }
  return Array.from(set);
}

/**
 * Executes 3-tier scraping pipeline and merges structured results.
 */
export async function scrapeWebsite(url: string): Promise<Partial<KnowledgeBase>> {
  const { html, finalUrl } = await fetchHtml(url);

  const jsonLd = extractFromJsonLd(html);
  const meta = extractFromMetaTags(html, finalUrl);
  const dom = extractFromDom(html, finalUrl);

  // Merge Company Foundation
  const companyFoundation: CompanyFoundation = {
    description: jsonLd.companyFoundation?.description || meta.companyFoundation?.description || null,
    website: jsonLd.companyFoundation?.website || meta.companyFoundation?.website || finalUrl,
    industry: jsonLd.companyFoundation?.industry || null,
    businessModel: jsonLd.companyFoundation?.businessModel || null,
    companyRole: jsonLd.companyFoundation?.companyRole || null,
    yearFounded: jsonLd.companyFoundation?.yearFounded ?? dom.companyFoundation?.yearFounded ?? null,
    legalEntityType: jsonLd.companyFoundation?.legalEntityType || null,
    employeeCount: jsonLd.companyFoundation?.employeeCount ?? null,
    mainAddress: jsonLd.companyFoundation?.mainAddress || null,
    otherLocations: mergeUniqueStrings(jsonLd.companyFoundation?.otherLocations),
    serviceLocations: mergeUniqueStrings(jsonLd.companyFoundation?.serviceLocations),
    altCompanyNames: mergeUniqueStrings(jsonLd.companyFoundation?.altCompanyNames),
  };

  // Merge Positioning
  const positioning: Positioning = {
    pitch: dom.positioning?.pitch || null,
    foundingStory: null,
  };

  // Merge Market & Customers
  const marketAndCustomers: MarketAndCustomers = {
    targetBuyers: mergeUniqueStrings(dom.marketAndCustomers?.targetBuyers),
    customerNeeds: null,
    idealPersona: null,
    industryGroupings: mergeUniqueStrings(
      dom.marketAndCustomers?.industryGroupings,
      meta.marketAndCustomers?.industryGroupings
    ),
    industryOutlook: null,
    channels: mergeUniqueStrings(dom.marketAndCustomers?.channels, ["Online / Website"]),
    funnels: [],
    ctas: mergeUniqueStrings(dom.marketAndCustomers?.ctas),
    suppliers: [],
  };

  // Merge Branding & Style
  const brandingAndStyle: BrandingAndStyle = {
    writingStyle: null,
    artStyle: null,
    fonts: mergeUniqueStrings(dom.brandingAndStyle?.fonts),
    colors: mergeUniqueStrings(dom.brandingAndStyle?.colors, meta.brandingAndStyle?.colors),
    logos: mergeUniqueStrings(jsonLd.brandingAndStyle?.logos, meta.brandingAndStyle?.logos),
  };

  // Merge Online Presence (JSON-LD takes precedence over DOM anchor scanner)
  const onlinePresence: OnlinePresence = {
    linkedin: jsonLd.onlinePresence?.linkedin || dom.onlinePresence?.linkedin || null,
    facebook: jsonLd.onlinePresence?.facebook || dom.onlinePresence?.facebook || null,
    instagram: jsonLd.onlinePresence?.instagram || dom.onlinePresence?.instagram || null,
    twitter: jsonLd.onlinePresence?.twitter || dom.onlinePresence?.twitter || null,
    youtube: jsonLd.onlinePresence?.youtube || dom.onlinePresence?.youtube || null,
    tiktok: jsonLd.onlinePresence?.tiktok || dom.onlinePresence?.tiktok || null,
  };

  // Key People (from JSON-LD schema)
  const keyPeople: KeyPerson[] = jsonLd.keyPeople || [];

  // Combine offerings from JSON-LD and DOM without duplicating names
  const offerings: Offering[] = [];
  const seenOfferings = new Set<string>();

  for (const off of [...(jsonLd.offerings || []), ...(dom.offerings || [])]) {
    const normName = off.name.toLowerCase().trim();
    if (!seenOfferings.has(normName)) {
      seenOfferings.add(normName);
      offerings.push(off);
    }
  }

  // FAQs (from FAQPage JSON-LD)
  const faq: FaqItem[] = jsonLd.faq || [];

  // Legal & Compliance (from DOM footer scanner)
  const legal: LegalCompliance = {
    privacyPolicyUrl: dom.legal?.privacyPolicyUrl || null,
    termsOfServiceUrl: dom.legal?.termsOfServiceUrl || null,
  };

  const companyName = jsonLd.companyName || meta.companyName || null;

  return {
    companyName,
    companyFoundation,
    positioning,
    marketAndCustomers,
    brandingAndStyle,
    onlinePresence,
    keyPeople,
    offerings,
    faq,
    legal,
  };
}
