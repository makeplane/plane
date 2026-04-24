# Web App Review Checklist (Overlay)

Additive to `base.md`. Apply when project has frontend framework (React, Vue, Svelte, Next.js, etc.).

## Detection

Apply this overlay when any of these are true:
- `package.json` has `react`, `vue`, `svelte`, `next`, `nuxt`, `angular` dependency
- Project has `src/pages/`, `src/app/`, `src/components/`, `src/views/` directories
- HTML/JSX/TSX/Vue files in the diff

---

## Pass 1 — CRITICAL (additions to base)

### XSS
- `innerHTML` assignment from any non-static source
- Template literals interpolated into DOM without escaping
- URL parameters rendered without sanitization
- `<a href={userInput}>` without protocol validation (javascript: protocol)
- Server-rendered user content without HTML entity encoding

### CSRF
- State-changing endpoints (POST/PUT/DELETE) without CSRF token verification
- Cookie-based auth without SameSite attribute
- Form submissions to external URLs

### N+1 Queries (server-rendered views)
- Database queries inside loops rendering lists
- Missing eager loading for associations rendered in views/pages
- Sequential API calls that could be batched

---

## Pass 2 — INFORMATIONAL (additions to base)

### Frontend Performance
- Inline `<style>` blocks in components re-parsed every render
- Missing `key` prop on list items
- Large bundle imports that could be lazy-loaded (e.g., full lodash instead of lodash/get)
- Images without width/height causing layout shift
- Missing `loading="lazy"` on below-fold images

### Accessibility
- Interactive elements without keyboard support (onClick without onKeyDown)
- Missing `alt` text on images
- Form inputs without associated labels
- Color-only indicators (no text/icon fallback)
- Missing ARIA attributes on custom interactive components

### Responsive / Layout
- Fixed pixel widths that break on mobile
- Missing viewport meta tag
- Overflow hidden cutting off content on small screens
