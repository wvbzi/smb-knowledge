# Architecture & System Design — Knowledge Builder

## 1. High-Level Architecture Overview

Knowledge Builder follows a Next.js 15 App Router architecture with client-side reactive state management and a server-side extraction engine:

```
[ Client Browser ]
  ├── Next.js App Router UI
  │     ├── /                     (Landing Page)
  │     ├── /knowledge            (URL Input & Scrape Trigger)
  │     ├── /knowledge/[uuid]     (Review & Edit Form with Auto-Save)
  │     └── /knowledge/view       (Card, Table, and Master-Detail History)
  │
  ├── React Context State (`KnowledgeContext`)
  │     └── LocalStorage Storage Engine (`kb:{uuid}`)
  │
  └── POST /api/scrape
        └── Server Scraper (`src/app/lib/scraper.ts`)
              ├── Step 1: Schema.org JSON-LD Extraction (`scrapeJsonLd.ts`)
              ├── Step 2: OpenGraph & Meta Tag Extraction (`scrapeMeta.ts`)
              └── Step 3: DOM & Footer Extraction (`scrapeDom.ts`)
```

---

## 2. Scraping Approach & Merging

### Step 1: Schema.org JSON-LD Extraction
- Extracts `<script type="application/ld+json">` tags.
- Unrolls `@graph` nodes and top-level array blocks (`[...]`).
- Normalizes `@type` to string arrays for robust polymorphic checks.
- Targets Schema.org business classes (`Organization`, `LocalBusiness`, `Corporation`, `ProfessionalService`, `RealEstateAgent`, `AccountingService`, `PestControlService`).
- Deep field mapping:
  - `name` / `legalName` &rarr; `companyName`
  - `foundingDate` / `foundingYear` &rarr; `yearFounded`
  - `numberOfEmployees` &rarr; `employeeCount`
  - `legalName` &rarr; `legalEntityType` (LLC, Inc, Corp regex detection)
  - `areaServed` &rarr; `serviceLocations`
  - `sameAs` &rarr; `onlinePresence` (domain matching)
  - `founder` / `employee` / `Person` &rarr; `keyPeople[]`
  - `Service` / `Product` / `Offer` / `ItemList` &rarr; `offerings[]` (including pricing extraction from `offers`)
  - `FAQPage` &rarr; `faq[]`

### Step 2: OpenGraph & Meta Tag Extraction
- Scans `og:title`, `og:site_name`, `twitter:title`, and `<title>` for company name fallbacks.
- Scans `og:description`, `twitter:description`, and `meta[name="description"]` for overview description.
- Extracts `meta[name="theme-color"]` and `meta[name="msapplication-TileColor"]` for brand colors.
- Extracts `og:image`, `twitter:image`, `link[rel="apple-touch-icon"]`, and favicons for brand logos.
- Resolves relative image/page URLs to absolute URLs against the target origin.

### Step 3: DOM & Footer Extraction
- Columnar footer link scanner for `Products`, `Labs`, `Platform`, and `Industry` categories.
- Footer scanning for legal links (`privacyPolicyUrl`, `termsOfServiceUrl`).
- `<a>` anchor tag scanning for social profile links matching supported platforms.
- Copyright regex scanning in footer text for founding year inference.
- Button and CTA phrase matching ("Start for free", "Get a demo", "Book Appointment", etc.).
- Font family detection from Google Fonts links and CSS font declarations.

### Merging Rules
1. **First-non-null priority**: For scalar properties (e.g. `description`, `companyName`, `yearFounded`), Step 1 (JSON-LD) is preferred; if absent, falls back to Step 2 (Meta tags), then Step 3 (DOM).
2. **Completeness scoring for addresses**: In JSON-LD, if multiple address nodes exist, selects the node with the highest number of populated fields.
3. **Deduplicated array merging**: For list properties (`offerings`, `industryGroupings`, `ctas`, `colors`, `fonts`), merges extracted items across all three steps using `Set` deduplication.

---

## 3. State Management & Storage Strategy

- **Granular LocalStorage**: Keys are namespaced per record (`kb:{uuid}`). On mount, `KnowledgeContext` hydrates all `kb:*` keys into state.
- **Multi-Tab Isolation**: Scrapes in different tabs do not collide because each generation allocates a unique UUID before writing drafts.
- **Draft & Save Lifecycle**: Scrapes initialize with `status: "draft"`. Edits in the form auto-save debounced changes. Explicit save commits `status: "saved"` and updates `savedAt`.
