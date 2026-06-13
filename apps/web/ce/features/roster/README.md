# Roster Feature

Community Edition roster UI lives here so the Next.js route folder only defines the URL.

- `components/` contains page, header, table, card, dropdown, and modal UI.
- `store/` contains the React context provider and feature-level state transitions.
- `constants/` contains display, filter, and import mapping constants.
- `utils/` contains formatting and import helpers.

Routes import this feature through `@/plane-web/features/roster`, which keeps the CE alias intact.
