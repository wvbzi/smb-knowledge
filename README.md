# Knowledge Builder — SMB Knowledge Extraction Tool

**Knowledge Builder** is a web application built for the **MoFlo Cloud** builder assignment. It takes any small or medium-sized business (SMB) website and transforms it into a structured, reviewable, and comprehensive business knowledge base.

This knowledge base serves as the structured foundation that powers generative AI applications—such as **MoSocial** (social media automation), **MoMail** (email marketing & outreach), and **MoBlogs** (SEO articles).

---

## Table of Contents
1. [Key Features & Functionality](#key-features--functionality)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Setup & Running Locally](#setup--running-locally)
4. [My Approach to Scraping & Extraction](#my-approach-to-scraping--extraction)
5. [Knowledge Base Schema Design](#knowledge-base-schema-design)
6. [Bonus: Supabase Database Architecture](#bonus-supabase-database-architecture)
7. [Prompt Engineering for AI Enrichment](#prompt-engineering-for-ai-enrichment)
8. [Data Quality, Fallbacks & Assumptions](#data-quality-fallbacks--assumptions)

---

## Key Features & Functionality

- **Scrape & Build Page (`/knowledge`)**: URL input with pre-submit validation, real-time status feedback, and server-side scraping execution.
- **Review & Edit Form (`/knowledge/[uuid]`)**: Dynamic review form built with `react-hook-form` and `useFieldArray`. Supports full editing across all 9 knowledge categories, interactive color pickers, logo thumbnail previews, tag chips, and debounced auto-saving.
- **JSON Export**: Direct client-side `Export JSON` button on both the review form and management views for instant data portability (`example-output.json`).
- **Knowledge Management (`/knowledge/view`)**:
  - **Saved vs. Drafts** segmented control.
  - **3 View Modes**:
    - **Card View**: Visual grid browsing with avatars, offering counts, and quick actions.
    - **Table View**: Dense tabular layout with interactive column sorting (Company Name, Date).
    - **Detailed View**: Master-detail inspect pane for deep inspection without entering edit mode.
  - **Live Search & Filter**: Real-time search by company name, industry, or domain.
  - **Safe Deletion**: Modal confirmation dialog for record deletion.

---

## Architecture & Tech Stack

- **Framework**: Next.js 15.5+ (App Router)
- **Language**: TypeScript 5 (strict mode)
- **Styling**: Tailwind CSS v4 with curated design tokens (`--primary: #2663EB`, `--secondary: #4A4A4A`, `--header: #000000`, `--desc: #777777`)
- **Typography**: Google Font `Poppins`
- **Icons**: Lucide React
- **HTML Parsing**: Cheerio
- **Persistence**: Multi-tab safe per-record `localStorage` (`kb:{uuid}`)

---

## Setup & Running Locally

### Prerequisites
- Node.js 18.17+ or 20+ (tested on Node v24)
- npm or yarn

### Installation & Execution
```bash
# Navigate to the Next.js app directory
cd knowledge-builder

# Install dependencies
npm install

# Run the development server
npm run dev

# Open http://localhost:3000 in your browser
```

### Production Build
```bash
npm run build
npm run start
```

---

## My Approach to Scraping & Extraction

Websites vary significantly in how they expose data. My scraper uses a **3-step extraction approach** followed by a merge step:

```
[ Target Website URL ]
         │
         ▼
 1. HTTP Fetch (Realistic User-Agent, Accept headers, 10s AbortController timeout)
         │
         ├─► Step 1: Schema.org JSON-LD Extraction
         │     • Handles nested @graph arrays and top-level script arrays.
         │     • Matches Organization, LocalBusiness, Corporation, ProfessionalService,
         │       Service, Product, ItemList, Person, and FAQPage nodes.
         │     • Extracts yearFounded, employeeCount, legalEntityType, areaServed,
         │       address, social links (sameAs), offerings with pricing, and FAQs.
         │
         ├─► Step 2: OpenGraph & Meta Tag Extraction
         │     • Fallback for site title, description, and canonical URL.
         │     • Extracts brand theme-color (<meta name="theme-color">) & favicons/logos.
         │     • Gathers keywords for industry grouping candidates.
         │
         └─► Step 3: DOM & Footer Extraction
               • Columnar footer link scanner for Products, Labs, Platform, and Industry links.
               • Scans footer links for Privacy Policy and Terms of Service URLs.
               • Identifies social profile URLs from <a> anchors.
               • Parses copyright strings (e.g. "© 2003-2025") for founding year heuristics.
               • Detects CTA action buttons ("Start for free", "Get a demo", etc.).
         │
         ▼
 2. Merge Step
         │
         ▼
 [ Structured KnowledgeBase Draft ]
```

### How the Merge Step Works
After extracting data across all three steps, my scraper merges them into a single `KnowledgeBase` object using clear rules:
1. **Priority for Single-Value Text Fields** (First non-null wins):
   - For fields like `description`, `companyName`, `yearFounded`, and `website`, Step 1 (JSON-LD) is checked first because structured schema is the most accurate. If null, it falls back to Step 2 (Meta tags), and then Step 3 (DOM heuristics).
2. **Completeness Scoring for Addresses**:
   - In JSON-LD, if multiple address nodes exist (e.g., an `Organization` node with only city/state and a `LocalBusiness` node with the full street address), the scraper scores each by the number of non-empty fields and selects the most complete one.
3. **Deduplicated Merging for Arrays**:
   - For list fields like `offerings`, `industryGroupings`, `ctas`, `colors`, `fonts`, and `serviceLocations`, the scraper combines extracted items from all three steps and removes duplicates using `Set` deduplication so that no valid data is missed or repeated.

---

## Knowledge Base Schema Design

All business knowledge is structured around the `KnowledgeBase` root type in [`src/types/knowledge.ts`](file:///c:/Projects/smb-knowledge/knowledge-builder/src/types/knowledge.ts):

| Section | Core Fields | Description |
| :--- | :--- | :--- |
| **Foundation** | `name`, `website`, `industry`, `businessModel`, `yearFounded`, `employeeCount`, `mainAddress`, `serviceLocations[]`, `altCompanyNames[]` | Core organizational profile and operational scope. |
| **Positioning** | `pitch`, `foundingStory` | Company value proposition and brand history. |
| **Market & Customers**| `targetBuyers[]`, `customerNeeds`, `idealPersona`, `industryGroupings[]`, `channels[]`, `funnels[]`, `ctas[]`, `suppliers[]` | Audience profile, sales funnel, and marketing triggers. |
| **Branding & Style** | `writingStyle`, `artStyle`, `fonts[]`, `colors[]`, `logos[]` | Visual and tonal brand guidelines. |
| **Online Presence** | `linkedin`, `facebook`, `instagram`, `twitter`, `youtube`, `tiktok` | Social media profiles and digital footprint. |
| **Key People** | `id`, `name`, `title`, `gender`, `description` | Founders, executives, and notable personnel. |
| **Offerings** | `id`, `name`, `category`, `features[]`, `description`, `pricing` | Products and services catalog with atomic features. |
| **FAQ** *(Beyond Baseline)* | `question`, `answer` | Common customer Q&As extracted from FAQPage schemas. |
| **Legal** *(Beyond Baseline)* | `privacyPolicyUrl`, `termsOfServiceUrl` | Required links for marketing email and ad compliance. |

---

## Data Quality, Fallbacks & Assumptions

1. **Explicit `null` Representation**: When extraction yields no data for a field, it is kept as `null` rather than guessing. The UI clearly communicates this state with an italicized *"Not found — add manually"* tag.
2. **Page Builders & Client Hydration**: Sites built on tools like Framer often render nav dropdowns on hover in client JavaScript. My scraper relies on static footer link scanning to guarantee consistent link and policy discovery.
3. **Multi-Tab Isolation**: Storage utilizes independent keys (`kb:{uuid}`) rather than a single active slot, ensuring multiple tabs scraping concurrently never overwrite each other.


## Prompt Engineering for AI Enrichment

When raw HTML does not contain explicit fields (such as elevator pitch or customer personas), scraped text can be passed to an LLM for structured extraction.

### Prompt 1: Creating Company Pitch
```markdown
You are helping generate a company pitch for a small business knowledge
base. You will be given raw data scraped from the company's website.
Using ONLY the information provided, write a 3-4 sentence pitch that
explains what the company does and why a customer should choose them.

Do not invent facts, statistics, or claims not present in the input. If
the input doesn't support a confident claim (e.g. years in business,
awards), leave it out rather than guessing.

Input:
KnowledgeBase Object: {knowledgeBase}

Output: plain text, 3-4 sentences.
```

### Prompt 2: Target Customer
```markdown
You are analyzing a company's offerings and target market to build a
customer persona for use in marketing content generation.

Using the offerings, industry, and any customer-facing language provided,
describe the ideal customer in 2-3 sentences: who they are, what problem
they're trying to solve, and what they likely care about when choosing a
provider.

Do not fabricate demographic details (age, income, etc.) unless directly
implied by the input. If the input is too thin to support a specific
persona, say so explicitly rather than producing a generic one.

Input:
KnowledgeBase Object: {knowledgeBase}
```
---

## Knowledge Enrichment
Outside of a company's website, a major source for establishing a customer profile is Google reviews. Not only do we get to gather complaints, but we can also create a profile for what type of customers the business should target.

For lackluster employee information and industry classification, LinkedIn would be a major help. It would directly help with employee count, names, and direct information to what field the company works in.