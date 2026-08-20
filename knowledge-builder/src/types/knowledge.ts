// src/types/knowledge.ts
// Source of truth for all knowledge base data shapes.
// Do not redeclare these shapes elsewhere — import from here.

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export type KnowledgeBaseStatus = "draft" | "saved";

export interface KnowledgeBase {
  id: string;
  sourceUrl: string;
  scrapedAt: string; // ISO timestamp
  savedAt: string | null; // null until user hits Save
  status: KnowledgeBaseStatus;

  companyName: string | null
  companyFoundation: CompanyFoundation;
  positioning: Positioning;
  marketAndCustomers: MarketAndCustomers;
  brandingAndStyle: BrandingAndStyle;
  onlinePresence: OnlinePresence;
  keyPeople: KeyPerson[];
  offerings: Offering[];
  faq: FaqItem[];
  legal: LegalCompliance;
}

// ---------------------------------------------------------------------------
// Company Foundation
// ---------------------------------------------------------------------------

export interface CompanyFoundation {
  description: string | null;
  website: string;
  industry: string | null;
  businessModel: string | null;
  companyRole: string | null;
  yearFounded: number | null;
  legalEntityType: string | null;
  employeeCount: number | null;
  mainAddress: string | null;
  otherLocations: string[];
  serviceLocations: string[];
  altCompanyNames: string[];
}

// ---------------------------------------------------------------------------
// Positioning
// ---------------------------------------------------------------------------

export interface Positioning {
  pitch: string | null;
  foundingStory: string | null;
}

// ---------------------------------------------------------------------------
// Market & Customers
// ---------------------------------------------------------------------------

export interface MarketAndCustomers {
  targetBuyers: string[];
  customerNeeds: string | null;
  idealPersona: string | null;
  industryGroupings: string[];
  industryOutlook: string | null;
  channels: string[];
  funnels: string[];
  ctas: string[];
  suppliers: string[];
}

// ---------------------------------------------------------------------------
// Branding & Style
// ---------------------------------------------------------------------------

export interface BrandingAndStyle {
  writingStyle: string | null;
  artStyle: string | null;
  fonts: string[];
  colors: string[]; // hex values
  logos: string[]; // URLs
}

// ---------------------------------------------------------------------------
// Online Presence
// ---------------------------------------------------------------------------

export interface OnlinePresence {
  linkedin: string | null;
  facebook: string | null;
  instagram: string | null;
  twitter: string | null;
  youtube: string | null;
  tiktok: string | null;
}

// ---------------------------------------------------------------------------
// Key People
// ---------------------------------------------------------------------------

export type Gender = "Male" | "Female" | "Unknown";

export interface KeyPerson {
  id: string;
  name: string;
  title: string | null;
  gender: Gender;
  description: string | null;
}

// ---------------------------------------------------------------------------
// Offerings
// ---------------------------------------------------------------------------

export interface Offering {
  id: string;
  name: string;
  category: string | null;
  features: string[];
  description: string | null;
  pricing: string | null;
}

// ---------------------------------------------------------------------------
// FAQ (beyond-baseline — real extraction via FAQPage JSON-LD)
// ---------------------------------------------------------------------------

export interface FaqItem {
  question: string;
  answer: string;
}

// ---------------------------------------------------------------------------
// Legal / Compliance (beyond-baseline — real extraction via link scanning)
// ---------------------------------------------------------------------------

export interface LegalCompliance {
  privacyPolicyUrl: string | null;
  termsOfServiceUrl: string | null;
}

// ---------------------------------------------------------------------------
// Index entry (lightweight summary for /knowledge/view list rendering)
// ---------------------------------------------------------------------------

export interface KnowledgeBaseIndexEntry {
  id: string;
  companyName: string;
  industry: string | null;
  website: string;
  savedAt: string | null;
  offeringCount: number;
  logoUrl: string | null;
}