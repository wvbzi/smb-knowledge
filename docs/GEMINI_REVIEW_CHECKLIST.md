# /knowledge Flow — Implementation Review

Run through this checklist against the code you already generated for
`/knowledge` and `/knowledge/[uuid]`. Fix anything that doesn't match, and
report back what was wrong and what you changed — don't silently patch
without explaining the diff.

---

## 1. Next.js 15 params — critical, check first

Next.js 15 changed `params` on every `page.tsx` (including Client Component
pages) to be a `Promise`, not a plain object. This is a breaking change from
Next 14 patterns you may have trained on.

**Check:** open `app/knowledge/[uuid]/page.tsx`. Does it look like this
(OLD, Next 14 pattern — broken under Next 15)?
```typescript
export default function Page({ params }: { params: { uuid: string } }) {
  const { uuid } = params;
```

If so, it will fail to build. Since this page is `"use client"` (it uses
hooks like `useKnowledge()` and `useForm()`), it cannot be an `async`
Server Component. Fix using React's `use()` hook instead:

```typescript
"use client";
import { use } from "react";

export default function KnowledgeDetailPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = use(params);
  // ...rest of component unchanged
}
```

Confirm this compiles with `npm run build` (not just `npm run dev` —
dev mode is more forgiving of type mismatches than a production build).

---

## 2. String-array field editing — consistency check

The spec listed which fields are plain `string[]` (as opposed to the
object-array sections that explicitly use `useFieldArray`):
`otherLocations`, `serviceLocations`, `altCompanyNames`, `targetBuyers`,
`industryGroupings`, `channels`, `funnels`, `ctas`, `suppliers`, `fonts`,
`colors`, `logos`.

**Check:** did you build one reusable component for editing these (e.g. a
`StringArrayField` — comma-separated input, or a tag-input with
add/remove chips), and use it consistently across all ~12 fields? Or did
each field end up with its own slightly different ad-hoc implementation?

If it's inconsistent, consolidate into a single reusable component and
swap all instances to use it. List which fields you had to fix.

---

## 3. Save confirmation — resolve the ambiguity

The spec said "toast or inline checkmark" without picking one — that was
underspecified on my end.

**Check:** which did you implement? If a toast, confirm the required
component (`sonner` or shadcn's `toast`) was actually installed via
`npx shadcn@latest add [name]` and isn't just referenced without being
present in `src/components/ui/`. If it wasn't installed, either install it
or switch to the simpler inline-checkmark approach — don't leave a broken
import.

---

## 4. General spec compliance — quick pass

Go through these and flag anything that's missing or diverges, don't just
assume it's fine:

- [ ] `/knowledge` page never renders any part of the knowledge base itself
      — only URL input, Scrape button, loading state, error state.
- [ ] Error states are distinct for "bad input" vs "fetch/scrape failed" —
      not a single generic error message for both.
- [ ] `/knowledge/[uuid]` shows a loading/skeleton state while
      `useKnowledge().isHydrated` is `false`, not before checking that flag.
- [ ] "Not found" state only renders *after* hydration completes, not
      based on an empty array during the loading window.
- [ ] Every field that's `null` in the data renders visibly differently
      from a filled field (placeholder styling), not just an empty input
      indistinguishable from "user hasn't looked at this yet."
- [ ] `updateKnowledge` calls are debounced (~500ms), not firing on every
      keystroke — check the Network/console isn't showing a localStorage
      write on every character typed.
- [ ] Save button label actually changes based on `status`
      (`"Save Knowledge Base"` vs `"Update"`) — this is also what lets the
      same page serve as the edit screen for already-saved records, so
      confirm it isn't hardcoded to one label.
- [ ] All colors/fonts trace back to the actual token names in
      `tailwind.config.ts` (`primary`, `secondary`, `header`, `desc`,
      `background`) — no hardcoded hex values or arbitrary Tailwind
      classes like `text-gray-500` sitting alongside the token system.
- [ ] No component reads or writes `localStorage` directly — everything
      goes through `useKnowledge()`.

---

## Report back
For each of the 4 sections above, state: not an issue / found and fixed /
found but needs a decision from me. Don't silently skip anything — if
something in the spec conflicts with what's easiest to implement, flag it
rather than picking silently.
