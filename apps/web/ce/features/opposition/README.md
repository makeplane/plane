# Opposition Feature

Community Edition opposition-team UI lives here so the Next.js route folder only defines the URL.

- `components/` contains page, header, list, team card, search, logo, and modal UI.
- `store/` contains React context providers used by the route layout and page.
- `services/` contains the client-side API helpers for loading, updating, and uploading opposition-team data.

Routes import this feature through `@/plane-web/features/opposition`, which keeps the CE alias intact.
