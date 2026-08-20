# /knowledge Flow — Build Spec

## Scope
This doc covers both halves of the Knowledge Builder flow:
1. **`/knowledge`** — URL input, scrape trigger, loading state.
2. **`/knowledge/[uuid]`** — the full editable review form, working off the
   `KnowledgeBase` object created by the scrape.

Both are driven by `KnowledgeProvider` (`useKnowledge()`). Never read or
write `localStorage` directly from a component — always go through the
Provider's functions (`saveDraft`, `updateKnowledge`, `commitSave`,
`getKnowledge`, `isHydrated`).

**Type source of truth:** `src/types/knowledge.ts`. This doc describes the
shape as of the latest known version (`companyName` on the `KnowledgeBase`
root, `description` on `CompanyFoundation` replacing the old `overview`
field). If the actual file differs, the file wins — treat this doc as a
guide to structure, not a literal type reference.

---

## Design system to follow
Pull tokens from `globals.css` / `tailwind.config.ts` (already established
in `DESIGN.md`) — do not introduce new colors or fonts:
- Font: Poppins (`font-sans`)
- Background: `bg-background` (`#ffffff`)
- Body text: `text-secondary` (`#4A4A4A`) — same value as secondary, use
  secondary for body text rather than a separate foreground token
- Primary: `text-primary` / `bg-primary` (Royal Blue `#2663EB`) — emphasized
  text, CTAs, active states
- Secondary: `text-secondary` (Tundora `#4A4A4A`)
- Header text: `text-header` (`#000000`) — standard headers
- Description text: `text-desc` (`#777777`) — field descriptions, muted/
  helper text, "Not found — add manually" placeholder styling

Use shadcn/ui components (`Input`, `Textarea`, `Button`, `Badge`, `Card`,
`Skeleton`) as the base primitives, styled through the existing Tailwind
config — do not import a separate component library (MUI, Chakra, Ant).
shadcn components are copy-pasted into `src/components/ui/`, so they inherit
project tokens automatically.

---

## State management approach
Use **react-hook-form** for the review/edit form (`/knowledge/[uuid]`), not
per-field `useState`. Reasons:
- The object is deeply nested (`companyFoundation`, `brandingAndStyle`, etc.)
  — RHF handles nested paths natively (`register("companyFoundation.industry")`).
- Three sections are arrays (`offerings`, `keyPeople`, `faq`) — use
  `useFieldArray` for add/remove/reorder instead of hand-rolled array state.
- Manual `useState` per leaf field (30+ fields) is repetitive and error-prone
  at this object size.

`/knowledge` (the input/scrape page) does **not** need react-hook-form — it's
a single URL input plus a loading boolean. Plain `useState` is correct there;
don't over-engineer it.

---

## Page 1: `/knowledge` — Input & Scrape

### Layout
- URL input (validate as a well-formed URL before allowing submit — don't
  rely on the API route alone to catch malformed input).
- "Scrape" button — disabled while a request is in flight or input is empty/invalid.
- Loading state: replace the button with a spinner + short status text
  ("Fetching site...", "Extracting data..."). A determinate progress bar is
  not required — the scrape duration isn't predictable enough to fake
  accurately: don't fabricate percentage values.
- Error state: inline message below the input (e.g. "Couldn't reach that
  site — check the URL and try again"), not a toast that disappears before
  the user can act. Cover both bad-input and fetch-failure cases distinctly.

### Behavior
1. On submit, `POST` to `/api/scrape` with `{ url }`.
2. On success, response is used to build a `KnowledgeBase` object
   (`id`: new uuid, `status: "draft"`, `scrapedAt`: now, `savedAt: null`,
   plus whatever fields the scraper filled — nulls for anything not found).
3. Call `saveDraft(kb)` from `useKnowledge()`.
4. `router.push(`/knowledge/${kb.id}`)`.
5. On failure, show the error state — do not navigate.

Do not render any part of the knowledge base on this page. This page's only
job is: collect a URL, trigger a scrape, hand off to the dynamic route.

---

## Page 2: `/knowledge/[uuid]` — Review & Edit

### Loading / not-found handling
- While `useKnowledge().isHydrated` is `false`, render a skeleton/loading
  state — do not assume an empty result means "not found" before hydration
  completes.
- After hydration, if `getKnowledge(uuid)` returns `undefined`, render a
  clear "Knowledge base not found" state with a link back to `/knowledge`.

### Form setup
- Initialize react-hook-form with `defaultValues` from the loaded
  `KnowledgeBase`.
- On any field change, call `updateKnowledge(id, updates)` — debounce this
  (roughly 500ms) rather than writing to localStorage on every keystroke.
- `useFieldArray` for `offerings`, `keyPeople`, and `faq` — each needs an
  "Add" button (appends an empty row with a fresh local id) and a "Remove"
  button per row.

### Section layout
Render as visually distinct sections/cards, one per top-level group, in this
order (mirrors the PDF's own category structure and the type file):
1. **Company Foundation** — `companyName`, `description`, `website`,
   `industry`, `businessModel`, `companyRole`, `yearFounded`,
   `legalEntityType`, `employeeCount`, `mainAddress`, `otherLocations[]`,
   `serviceLocations[]`, `altCompanyNames[]`
2. **Positioning** — `pitch`, `foundingStory`
3. **Market & Customers** — `targetBuyers[]`, `customerNeeds`,
   `idealPersona`, `industryGroupings[]`, `industryOutlook`, `channels[]`,
   `funnels[]`, `ctas[]`, `suppliers[]`
4. **Branding & Style** — `writingStyle`, `artStyle`, `fonts[]`, `colors[]`
   (render as swatches, not just hex text), `logos[]` (render as thumbnails)
5. **Online Presence** — `linkedin`, `facebook`, `instagram`, `twitter`,
   `youtube`, `tiktok`
6. **Key People** — array of `{ name, title, gender, description }`
7. **Offerings** — array of `{ name, category, features[], description, pricing }`
8. **FAQ** — array of `{ question, answer }`
9. **Legal** — `privacyPolicyUrl`, `termsOfServiceUrl`

### Empty-field pattern
Any field that is `null` should render distinctly from a filled field — e.g.
placeholder text "Not found — add manually" in a muted/dashed-border input,
so the user can visually scan for gaps at a glance. Do not silently render
an empty input indistinguishable from "not yet reviewed."

### Save button
- Label: "Save Knowledge Base" when `status === "draft"`, "Update" when
  `status === "saved"`.
- On click, call `commitSave(id)`.
- After a successful save, show a brief confirmation (toast or inline
  checkmark) — don't navigate away automatically; the user may want to keep
  editing.

### Validation
- `website`/social/legal URL fields: validate as well-formed URLs on blur,
  not on every keystroke.
- Array item fields (e.g. offering `name`): required before allowing that
  row to persist — don't let a user save a fully-empty array row.

---

## Explicitly out of scope for this component
- Downloading/exporting JSON (separate feature, not part of this page).
- `/knowledge/view` (separate page, separate spec).
- Any localStorage access outside `KnowledgeProvider`.
