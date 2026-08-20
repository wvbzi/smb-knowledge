# /knowledge/view — Build Spec

## Scope
The management page for saved and draft knowledge bases. Reads from
`useKnowledge().knowledgeData` — no separate fetch, no separate index.
Editing/re-saving a record happens by navigating to `/knowledge/[uuid]`
(same route used for the initial post-scrape review) — this page does not
duplicate the edit form.

---

## Data & filtering

### Segmented control: Saved / Drafts
Top of the page. Filters `knowledgeData` by `status`:

```typescript
const [statusFilter, setStatusFilter] = useState<"saved" | "draft">("saved");
const filtered = knowledgeData.filter((kb) => kb.status === statusFilter);
```

Default to "Saved" on load — that's the primary use case for this page;
drafts are the secondary/recovery case.

### Search
A single text input filtering the *currently selected* status tab by
`companyName`, `industry`, or `website` (case-insensitive substring match).
No separate filter dropdowns needed for this scope — one search box covers
the "filtering and/or search functionality" requirement without
over-building it.

### View mode switcher
A separate, independent toggle (Card / Table / Detailed) — this is purely
presentational and does not affect `filtered`, only how it's rendered. Keep
this as local `useState`, not tied to the Provider.

---

## Interpreting the three view modes

The assignment doesn't define these, so here's the distinction this spec
uses — each should serve a genuinely different use case, not just be the
same data restyled three times:

### Card view — browsing
Grid of visual summary cards. Optimized for scanning by eye, not for
comparing data precisely. Each card shows:
- `logoUrl` (fallback: colored circle with company initial if null)
- `companyName`
- `industry`
- `offerings.length` as a small badge ("12 offerings")
- `savedAt` (formatted, relative if recent — e.g. "2 days ago")
- Actions: pencil icon (→ `/knowledge/[uuid]`), trash icon (delete)

This is the default view — most approachable for a first-time user of the
management page.

### Table view — scanning/comparing many at once
Dense rows, one company per row, real columns:
`Company | Industry | Website | Offerings | Saved | Actions`
Optimized for comparing many records at a glance — e.g. spotting which
companies are missing an industry, or sorting by saved date. Support
column-header click-to-sort at minimum on `companyName` and `savedAt`;
more isn't necessary for this scope. Actions column holds the same
pencil/trash icons as card view.

### Detailed view — inspecting one record without leaving the page
A master-detail split layout: a slim list of company names on the left
(just names, one line each, current filter/search still applies), and the
selected company's full data rendered read-only on the right — every
section from `KnowledgeBase` (Company Foundation through FAQ/Legal),
formatted for reading, not editing.

This is deliberately **not** the same thing as clicking "edit" — it's a
read-only deep look, useful for reviewing everything about one company
without committing to an edit session. The edit pencil icon is still
available from within this view (e.g. a button at the top of the detail
pane) for when the user does want to make changes, which routes to
`/knowledge/[uuid]` as usual.

If no company is selected yet (first load in this mode), show an empty
right pane with a prompt ("Select a company to view details") rather than
defaulting to the first item silently — avoids a jarring auto-selection the
user didn't ask for.

---

## Delete behavior (all three views)
- Trash icon triggers a confirmation step before calling
  `deleteKnowledge(id)` — a plain `window.confirm("Delete {companyName}? This can't be undone.")` is sufficient for this scope; a custom modal is a nice-to-have, not required.
- After confirming, the item disappears from the current view immediately
  (state update is synchronous in the Provider, no loading state needed).
- If the deleted item was the selected item in Detailed view, clear the
  selection and return to the empty-pane prompt state.

---

## Empty states
Handle these distinctly, don't just render a blank list:
- **No saved knowledge bases yet** (Saved tab, no search applied): message
  + a link/button back to `/knowledge` to scrape one.
- **No drafts** (Drafts tab, no search applied): message noting drafts
  appear here automatically after a scrape.
- **Search returns nothing**: "No results for '{query}'" — distinct from
  the true-empty states above, since the fix here is "clear your search,"
  not "go scrape something."

---

## Components (shadcn/ui)

Use these primitives — same reasoning as the /knowledge flow spec: they
inherit your existing Tailwind tokens automatically instead of fighting
them. Install any not already added: `npx shadcn@latest add [name]`.

| UI element | Component |
|---|---|
| Saved/Drafts segmented control | `Tabs` (`TabsList` + `TabsTrigger`) |
| Card / Table / Detailed switcher | `ToggleGroup` (single-select) |
| Search input | `Input` |
| Card view grid item | `Card` (`CardHeader`, `CardContent`, `CardFooter`) |
| Offering-count badge on cards | `Badge` |
| Logo fallback (no `logoUrl`) | `Avatar` (`AvatarFallback` showing initial) |
| Table view | `Table` (`TableHeader`, `TableRow`, `TableCell`) |
| Edit / delete icons | `Button` with `variant="ghost" size="icon"`, `lucide-react` icons (`Pencil`, `Trash2`) |
| Delete confirmation | `AlertDialog` — preferred over `window.confirm` for consistency with the rest of the UI and better accessibility; falls back to `window.confirm` only if time-constrained |
| Detailed view: company list pane | Plain scrollable `div` + `Button variant="ghost"` per row (no need for a heavier component here) |
| Detailed view: empty state / no-selection prompt | Plain centered text, no special component needed |
| Empty states (no saved/drafts/search results) | Plain centered text + `Button` linking to `/knowledge` where applicable |

---
- Bulk actions (select multiple, bulk delete) — not required by the
  assignment, skip unless time allows.
- Sorting beyond `companyName`/`savedAt` in table view.
- Any localStorage access outside `KnowledgeProvider` — this page only
  calls `useKnowledge()`.