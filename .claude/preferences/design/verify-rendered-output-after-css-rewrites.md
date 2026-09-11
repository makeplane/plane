---
type: preference
topic: design
status: active
scope: context-dependent
applies_when: [frontend-surface]
updated: 2026-08-11
---

# Verify rendered output after automated CSS/theming rewrites

After any automated or scripted rewrite of theme-sensitive files (CSS custom properties, color values, tokenization/find-replace passes), check the actual rendered output — including any alternate theme (dark mode, etc.) — before considering the change done. Don't trust the script's own "nothing left to change" signal alone.

A naive automated rewrite can silently leave a near-token hardcoded value untouched (e.g. `#111` close to but not exactly `var(--text)`), which then renders wrong only in the mode/context nobody manually re-checked — surfacing as a real user-visible bug (e.g. dark-mode buttons keeping light-mode text color) rather than a build failure.
