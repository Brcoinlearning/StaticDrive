# Design

## Summary

This project is a product UI for a local static content service. The design direction is an "quiet engineering workbench": calm, precise, readable, and operationally trustworthy. Owner and public pages have equal priority, but their density differs: owner screens optimize management speed; public screens optimize discovery, reading, password entry, and download confidence.

Current frontend implementation is concentrated in `src/web/page-renderer.js`. Pages are server-rendered HTML strings with inline CSS and small inline scripts. There is no standalone frontend framework, Tailwind pipeline, or reusable component library today, so design changes should preserve the current server-rendered architecture unless a later phase explicitly changes that.

## Current UI Diagnosis

- The visual system leans warm editorial: Georgia body type, cream surfaces, radial gradients, very round cards, and soft shadows. That makes owner operations feel less precise than the product needs.
- The masthead pattern is too large and repeated for task screens. Owner list, search, credential, detail, write, and public pages all inherit a hero-like layout even when users need a compact work surface.
- Cards are overused as the default grouping model. Lists, batch actions, metadata, preview, action panels, and empty states all look similarly elevated, so hierarchy is flatter than it should be.
- The same accent color carries links, badges, buttons, code accents, and rich-text preview styling. State vocabulary needs clearer roles for primary, neutral, success, warning, and danger.
- Controls need stronger baseline states: focus-visible, disabled, active, loading, inline errors, helper text, and destructive-action confirmation patterns are not yet systematic.
- Batch operations use a clickable heading and JS class toggle without semantic disclosure behavior. Future implementation should use a real button with `aria-expanded`.
- Destructive delete now uses an inline danger zone instead of browser `confirm()`. Future changes should keep destructive actions named, visible, and reversible only when the backend supports that.
- Public rich-text display lives inside an iframe and has separate preview CSS. It needs to align visually with the outer shell while keeping sandbox and Markdown/KaTeX constraints intact.
- Metadata is basic but present through per-page `<title>`. Public pages may later deserve descriptions or Open Graph only if share previews become a product requirement.

## Visual System

### Direction

Use a restrained product palette, not a marketing palette. The surface should feel closer to a well-kept local operations bench than a branded landing page.

- Body background: neutral off-white or very light cool-neutral, not cream/sand.
- Primary surface: white or near-white.
- Secondary surface: subtle cool-neutral for toolbars, side panels, and metadata blocks.
- Ink: near-black neutral for body text.
- Muted text: dark enough for WCAG AA on all surfaces.
- Accent: one practical blue/teal or deep green for primary actions, selected state, and links.
- Semantic states: green success, amber warning, red danger, blue info, each with a low-chroma background tint and a high-contrast text color.

Use CSS custom properties in `renderLayout()` as the source of truth. If a future phase extracts styles, keep the token names stable.

### Typography

- Use a sans-serif system stack for the product shell: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
- Use a mono stack only for API keys, content hashes, IDs, code, and route-like values.
- Avoid serif fonts for owner UI labels, buttons, metadata, and navigation.
- Public rich-text iframe may use a readable article stack, but should still feel connected to the shell.
- Use fixed rem sizes, not fluid hero-scale typography, for product screens.
- Suggested scale: 12, 13, 14, 16, 18, 22, 28, 34px. Keep headings compact and use `text-wrap: balance` where supported.

### Layout

- Replace the repeated hero masthead with a compact app header: page title, short description, mode indicator, search, and primary action area.
- Owner list/search pages should use a denser management layout: toolbar, filters, batch actions, then row-first results. Cards can remain as an optional alternate view.
- Owner detail should prioritize three zones: summary/status, preview or file info, and action/update side panel. The side panel should remain secondary on mobile.
- Public list/search should be calmer and more reading-oriented, with clearer content type labels and fewer owner-only operational details.
- Public content detail should put the content or download action first, with access explanation as supporting context.
- Use full-width sections inside a constrained page width. Avoid nested cards.
- Keep fixed-format elements stable with explicit min-height, grid tracks, and touch target sizing.

### Components

- Buttons: primary, secondary, quiet, danger. Every button needs hover, active, focus-visible, disabled, and loading-ready styles.
- Links: meaningful text, visible underline or strong hover treatment, and focus-visible outline.
- Inputs/selects/textareas: visible label above control, helper text below when needed, error text next to the failing field, consistent border/focus/error states.
- Badges: use for type and status only. Do not use badges as decoration.
- Toolbars: use neutral surfaces and predictable grouping. Avoid card-like shadows.
- Empty states: one sentence explaining the state plus one clear next action when an action exists.
- Flash messages: use semantic state colors and plain language; keep title/message hierarchy.
- Batch panel: use semantic disclosure button with `aria-expanded`, keyboard support, and a stable collapsed state.
- Destructive actions: do not use browser `confirm()`. Use an accessible confirmation pattern that names the item and action.
- Iframe preview: keep sandbox behavior and KaTeX support; style the frame as a content viewport, not a decorative card.

### Icons

Use the local inline SVG icon helper in `src/web/page-renderer.js`; do not add an icon dependency unless a future frontend architecture introduces a build step.

- Icons use one stroked style: 24px viewBox, 2px stroke, round caps/joins, no fill, `currentColor`.
- Icons appear as icon + text in buttons, links, badges, headings, and status labels.
- Decorative icons are `aria-hidden="true"` and `focusable="false"`.
- Avoid icon-only buttons. If one is introduced later, it must have `aria-label`.
- Do not mix emoji, hand-drawn SVG, generated illustrations, or multiple icon styles.
- Current covered roles: search, list/cards toggle, key/session, logout, share, revoke, delete, download, file, rich text, lock/password, warning, success, external link, edit, refresh, and navigation back.

### Motion

- Motion should communicate state, not decorate the page.
- Interaction feedback should stay under 200ms and animate only `transform` and `opacity`.
- Avoid animated gradients, large blur, backdrop-filter, layout property animation, scroll-linked animation, and perpetual motion.
- Respect `prefers-reduced-motion: reduce`.

### Responsive

- Mobile first constraint: no horizontal overflow, no text overlap, no buttons squeezed below readable size.
- Use one-column layouts below tablet width. Side panels move below the main content.
- Search form, toolbar actions, and batch controls wrap cleanly with consistent gaps.
- Touch targets should be at least 44px high where practical.
- Use `min-height: 100dvh` only if a future full-height surface is introduced; do not use `h-screen`-style assumptions.

## Page Standards

- Login: compact, trust-focused form. API Key field should have label, helper text, and clear failure feedback.
- Credential: operational summary, masked key, session facts, logout action. Avoid making it look like a settings product that can rotate keys if it cannot.
- Owner list/search: primary working screen. Prioritize search, filters, content state, row scanning, and batch actions.
- Owner detail: make status and next actions obvious. Separate safe updates from destructive actions.
- Write form: make Markdown writing intent clear. Keep title/body validation close to fields.
- Public list/search: hide owner-only noise; show title, type, summary, updated time, file size where useful.
- Public content: rich text should read like a clean document; file pages should make the download action unmistakable.
- Password page: keep the form small, direct, and accessible. Error stays adjacent to password field.
- Error page: explain what failed and provide a useful next route when possible.

## Accessibility Standard

Target WCAG 2.2 AA.

- Every interactive element must have an accessible name.
- Every form field must have a label connected by `for`/`id`.
- Focus-visible styles must be obvious and not rely on color alone.
- Do not use clickable headings or non-button elements for interactions.
- Use semantic buttons for actions and anchors for navigation.
- Error text should be visible, specific, and programmatically associated where practical.
- Color contrast must pass 4.5:1 for normal text and 3:1 for large text and UI indicators.
- Public and owner flows must work with keyboard navigation alone.

## Performance Standard

- Keep CSS and JS small. The current no-build server-rendered frontend is a feature, not a problem.
- Avoid adding heavy frontend dependencies unless a later phase proves they are needed.
- Do not animate layout properties or large painted surfaces.
- Avoid large box-shadow stacks, large backdrop blur, and fixed noise overlays.
- Keep iframe preview content isolated and only load KaTeX assets when math content is detected, as the current implementation does.

## Metadata Standard

- Keep per-page `<title>` specific and deterministic.
- Add meta descriptions only when public share/discovery pages become externally indexed or shared through social previews.
- If Open Graph is introduced, public content pages need escaped title/description values and canonical URLs based on `PUBLIC_BASE_URL`.
- Owner pages should not be optimized for indexing.

## Stage 2 Implementation Boundaries

- Preserve core business logic, routes, API contracts, storage fields, authentication flow, password flow, sandbox behavior, and Markdown rendering contract.
- Prefer edits in `src/web/page-renderer.js` unless the design is explicitly extracted into a separate CSS helper in the same source boundary.
- Do not introduce Tailwind, React, a client router, or a component library in the redesign pass.
- Do not remove owner/public pages or reduce existing actions.
- Run `node --test` after implementation changes. For UI behavior changes, also run `npm run test:e2e` when the local service prerequisites are available.

## Acceptance Checklist

- Owner and public pages share one coherent visual system but have distinct mode cues.
- No repeated oversized hero treatment on routine task screens.
- Row scanning, metadata, statuses, and actions are clearer than the current card-heavy layout.
- Buttons, links, forms, badges, flash messages, empty states, and errors have consistent states.
- Keyboard navigation and focus visibility are usable across login, list/search, detail, write, password, and action surfaces.
- No text overlaps or overflows on mobile widths.
- Rich-text preview remains sandboxed and Markdown/KaTeX display continues to work.
