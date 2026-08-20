import * as cheerio from "cheerio";
import type {
  KnowledgeBase,
  FaqItem,
  Offering,
  OnlinePresence,
  KeyPerson,
} from "@/types/knowledge";

type JsonLdNode = Record<string, unknown> & { "@type": string[] };

const SOCIAL_DOMAIN_MAP: Record<string, keyof OnlinePresence> = {
  "linkedin.com": "linkedin",
  "facebook.com": "facebook",
  "instagram.com": "instagram",
  "twitter.com": "twitter",
  "x.com": "twitter",
  "youtube.com": "youtube",
  "tiktok.com": "tiktok",
};

// Check if node matches any given Schema.org type
function hasType(node: JsonLdNode, ...types: string[]): boolean {
  return types.some((t) =>
    node["@type"].some((nt) => nt.toLowerCase() === t.toLowerCase())
  );
}

// Check if node represents an organization or local business
function isOrgNode(node: JsonLdNode): boolean {
  return node["@type"].some((t) => {
    const lower = t.toLowerCase();
    return (
      lower.includes("organization") ||
      lower.includes("business") ||
      lower.includes("company") ||
      lower.includes("service") ||
      lower.includes("agency") ||
      lower.includes("store") ||
      lower.includes("corporation") ||
      lower.includes("realestateagent") ||
      lower.includes("accountingservice") ||
      lower.includes("pestcontrol")
    );
  });
}

// Flatten raw JSON-LD into a normalized list of nodes
function normalizeRawJson(raw: unknown): Record<string, unknown>[] {
  if (!raw || typeof raw !== "object") return [];

  if (Array.isArray(raw)) {
    return raw.flatMap((item) => normalizeRawJson(item));
  }

  const obj = raw as Record<string, unknown>;
  const graph = obj["@graph"];
  if (Array.isArray(graph)) {
    return graph.flatMap((item) => normalizeRawJson(item));
  }

  return [obj];
}

// Extract and normalize all JSON-LD nodes from HTML
function extractAndNormalize($: cheerio.CheerioAPI): JsonLdNode[] {
  const nodes: JsonLdNode[] = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse($(el).text());
    } catch {
      return;
    }

    const rawList = normalizeRawJson(parsed);
    for (const raw of rawList) {
      if (!raw || typeof raw !== "object") continue;
      const type = raw["@type"];
      const typeArray: string[] = Array.isArray(type)
        ? type.map(String)
        : typeof type === "string"
        ? [type]
        : [];
      nodes.push({ ...raw, "@type": typeArray });
    }
  });

  return nodes;
}

// Extract image URL from string or ImageObject
function extractImageUrl(img: unknown): string | null {
  if (typeof img === "string" && img.trim()) return img.trim();
  if (typeof img === "object" && img !== null) {
    const obj = img as Record<string, unknown>;
    if (typeof obj.url === "string" && obj.url.trim()) return obj.url.trim();
    if (typeof obj.contentUrl === "string" && obj.contentUrl.trim()) return obj.contentUrl.trim();
  }
  return null;
}

// Format postal address object or string into a single address string
function formatAddress(addr: unknown): string | null {
  if (typeof addr === "string" && addr.trim()) return addr.trim();
  if (typeof addr === "object" && addr !== null) {
    const a = addr as Record<string, unknown>;
    const parts = [
      a.streetAddress,
      a.addressLocality,
      a.addressRegion,
      a.postalCode,
      a.addressCountry,
    ].filter((v): v is string => typeof v === "string" && v.trim().length > 0);
    return parts.length > 0 ? parts.join(", ") : null;
  }
  return null;
}

// Map sameAs links to social media profile properties
function mapSameAsToOnlinePresence(sameAs: unknown): Partial<OnlinePresence> {
  const urls: string[] = [];
  if (Array.isArray(sameAs)) {
    urls.push(...sameAs.filter((u): u is string => typeof u === "string"));
  } else if (typeof sameAs === "string") {
    urls.push(sameAs);
  }

  const result: Partial<OnlinePresence> = {};
  for (const url of urls) {
    for (const [domain, field] of Object.entries(SOCIAL_DOMAIN_MAP)) {
      if (url.includes(domain)) {
        result[field] = url;
        break;
      }
    }
  }
  return result;
}

// Extract year from date string or number
function extractYear(val: unknown): number | null {
  if (typeof val === "number" && val > 1800 && val < 2100) return val;
  if (typeof val === "string") {
    const match = val.match(/\b(18|19|20)\d{2}\b/);
    if (match) return parseInt(match[0], 10);
  }
  return null;
}

// Extract employee count from number or quantitative value
function extractEmployeeCount(val: unknown): number | null {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const num = parseInt(val.replace(/[^\d]/g, ""), 10);
    if (!isNaN(num)) return num;
  }
  if (typeof val === "object" && val !== null) {
    const obj = val as Record<string, unknown>;
    if (obj.value) return extractEmployeeCount(obj.value);
  }
  return null;
}

// Infer legal entity type from business name or legal name
function inferLegalEntityType(name: string | null): string | null {
  if (!name) return null;
  if (/\bLLC\b/i.test(name)) return "LLC";
  if (/\bInc\.?\b/i.test(name)) return "Inc";
  if (/\bCorp\.?\b|Corporation/i.test(name)) return "Corporation";
  if (/\bLtd\.?\b/i.test(name)) return "Ltd";
  if (/\bPLLC\b/i.test(name)) return "PLLC";
  if (/\bPC\b/i.test(name)) return "PC";
  return null;
}

// Extract price string from offers object or string
function extractPricing(offers: unknown): string | null {
  if (!offers) return null;
  if (typeof offers === "string" || typeof offers === "number") return String(offers);

  if (typeof offers === "object") {
    const o = offers as Record<string, unknown>;
    const price = o.price ?? o.lowPrice;
    const currency = (o.priceCurrency as string) ?? "$";
    if (price !== undefined && price !== null) {
      return currency === "$" || currency === "USD" ? `$${price}` : `${currency} ${price}`;
    }
  }
  return null;
}

// Extract single offering item from schema node
function extractOfferingFromNode(node: Record<string, unknown>): Offering | null {
  const name = (node.name as string) || (node.headline as string);
  if (!name || typeof name !== "string" || !name.trim()) return null;

  const features: string[] = [];
  if (Array.isArray(node.featureList)) {
    features.push(...node.featureList.filter((f): f is string => typeof f === "string"));
  }

  const id = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `off_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  return {
    id,
    name: name.trim(),
    category: (node.category as string) ?? (node.serviceType as string) ?? null,
    features,
    description: (node.description as string) ?? null,
    pricing: extractPricing(node.offers) ?? (node.priceRange as string) ?? null,
  };
}

// Extract person information from Person schema node
function extractPersonFromNode(node: Record<string, unknown>): KeyPerson | null {
  const name = node.name as string | undefined;
  if (!name || typeof name !== "string" || !name.trim()) return null;

  let gender: "Male" | "Female" | "Unknown" = "Unknown";
  if (typeof node.gender === "string") {
    const g = node.gender.toLowerCase();
    if (g.includes("male") && !g.includes("female")) gender = "Male";
    if (g.includes("female")) gender = "Female";
  }

  const id = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `kp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  return {
    id,
    name: name.trim(),
    title: (node.jobTitle as string) ?? (node.roleName as string) ?? null,
    gender,
    description: (node.description as string) ?? (node.disambiguatingDescription as string) ?? null,
  };
}

/**
 * Main entry point: Extracts partial KnowledgeBase from JSON-LD schema nodes.
 */
export function extractFromJsonLd(html: string): Partial<KnowledgeBase> {
  const $ = cheerio.load(html);
  const nodes = extractAndNormalize($);

  // --- Organization / Business info ---
  const orgNodes = nodes.filter(isOrgNode);

  let companyName: string | null = null;
  let description: string | null = null;
  let website: string | null = null;
  let yearFounded: number | null = null;
  let employeeCount: number | null = null;
  let legalEntityType: string | null = null;
  let industry: string | null = null;
  const altCompanyNames: string[] = [];
  const serviceLocations: string[] = [];
  const logos: string[] = [];
  let bestAddressStr: string | null = null;
  let bestAddressScore = -1;
  let onlinePresence: Partial<OnlinePresence> = {};
  const keyPeople: KeyPerson[] = [];
  const seenPeopleNames = new Set<string>();

  for (const node of orgNodes) {
    companyName ??= (node.name as string) ?? (node.legalName as string) ?? null;
    description ??= (node.description as string) ?? (node.disambiguatingDescription as string) ?? null;
    website ??= (node.url as string) ?? null;

    yearFounded ??= extractYear(node.foundingDate ?? node.foundingYear);
    employeeCount ??= extractEmployeeCount(node.numberOfEmployees);
    legalEntityType ??= inferLegalEntityType((node.legalName as string) ?? (node.name as string));

    if (!industry && Array.isArray(node["@type"])) {
      const specificType = node["@type"].find(
        (t) => t !== "Organization" && t !== "LocalBusiness" && t !== "WebSite"
      );
      if (specificType) industry = specificType.replace(/([A-Z])/g, " $1").trim();
    }

    if (node.alternateName) {
      const alts = Array.isArray(node.alternateName) ? node.alternateName : [node.alternateName];
      for (const alt of alts) {
        if (typeof alt === "string" && !altCompanyNames.includes(alt)) altCompanyNames.push(alt);
      }
    }

    if (node.areaServed) {
      const areas = Array.isArray(node.areaServed) ? node.areaServed : [node.areaServed];
      for (const area of areas) {
        const areaName = typeof area === "string" ? area : (area as Record<string, unknown>)?.name;
        if (typeof areaName === "string" && !serviceLocations.includes(areaName)) {
          serviceLocations.push(areaName);
        }
      }
    }

    const logo = extractImageUrl(node.logo) ?? extractImageUrl(node.image);
    if (logo && !logos.includes(logo)) logos.push(logo);

    if (node.address) {
      const formatted = formatAddress(node.address);
      if (formatted) {
        const score = typeof node.address === "object" && node.address !== null
          ? Object.values(node.address).filter(Boolean).length
          : 1;
        if (score > bestAddressScore) {
          bestAddressStr = formatted;
          bestAddressScore = score;
        }
      }
    }

    onlinePresence = { ...onlinePresence, ...mapSameAsToOnlinePresence(node.sameAs) };

    // Extract founders and employees attached directly to Organization
    const peopleProps = [node.founder, node.founders, node.employee, node.employees, node.alumni];
    for (const pProp of peopleProps) {
      if (!pProp) continue;
      const pList = Array.isArray(pProp) ? pProp : [pProp];
      for (const p of pList) {
        if (typeof p === "object" && p !== null) {
          const person = extractPersonFromNode(p as Record<string, unknown>);
          if (person && !seenPeopleNames.has(person.name.toLowerCase())) {
            seenPeopleNames.add(person.name.toLowerCase());
            keyPeople.push(person);
          }
        }
      }
    }
  }

  // --- Person nodes at top-level ---
  for (const node of nodes) {
    if (hasType(node, "Person")) {
      const person = extractPersonFromNode(node);
      if (person && !seenPeopleNames.has(person.name.toLowerCase())) {
        seenPeopleNames.add(person.name.toLowerCase());
        keyPeople.push(person);
      }
    }
  }

  // --- FAQPage ---
  const faqNode = nodes.find((n) => hasType(n, "FAQPage"));
  const faq: FaqItem[] = [];
  if (faqNode && Array.isArray(faqNode.mainEntity)) {
    for (const entry of faqNode.mainEntity as Record<string, unknown>[]) {
      const question = (entry.name as string) ?? (entry.headline as string);
      const answerObj = entry.acceptedAnswer as Record<string, unknown> | undefined;
      const answer = (answerObj?.text as string) ?? (answerObj?.name as string);
      if (question && answer) {
        faq.push({ question: String(question).trim(), answer: String(answer).trim() });
      }
    }
  }

  // --- Offerings (Service, Product, Offer, ItemList) ---
  const offerings: Offering[] = [];
  const seenOfferingNames = new Set<string>();
  const addOffering = (node: Record<string, unknown>) => {
    const offering = extractOfferingFromNode(node);
    if (offering && !seenOfferingNames.has(offering.name.toLowerCase())) {
      seenOfferingNames.add(offering.name.toLowerCase());
      offerings.push(offering);
    }
  };

  for (const node of nodes) {
    if (hasType(node, "Service", "Product", "Offer", "Course", "IndividualProduct")) {
      addOffering(node);
    }
    if (hasType(node, "ItemList") && Array.isArray(node.itemListElement)) {
      for (const listItem of node.itemListElement as Record<string, unknown>[]) {
        const item = (listItem.item as Record<string, unknown>) ?? listItem;
        if (item && typeof item === "object") addOffering(item);
      }
    }
  }

  return {
    companyName,
    companyFoundation: {
      description,
      website: website ?? "",
      industry,
      businessModel: null,
      companyRole: null,
      yearFounded,
      legalEntityType,
      employeeCount,
      mainAddress: bestAddressStr,
      otherLocations: [],
      serviceLocations,
      altCompanyNames,
    },
    brandingAndStyle: {
      writingStyle: null,
      artStyle: null,
      fonts: [],
      colors: [],
      logos,
    },
    onlinePresence: {
      linkedin: onlinePresence.linkedin ?? null,
      facebook: onlinePresence.facebook ?? null,
      instagram: onlinePresence.instagram ?? null,
      twitter: onlinePresence.twitter ?? null,
      youtube: onlinePresence.youtube ?? null,
      tiktok: onlinePresence.tiktok ?? null,
    },
    keyPeople,
    offerings,
    faq,
  };
}