# Media Library Feature

Community Edition media-library UI lives here so the Next.js route folder only defines the URL.

- `components/` contains route-level page components, upload UI, detail preview/sidebar, player UI, and peek overview UI.
- `hooks/` contains media-library fetching and preview hooks.
- `store/` contains the React context provider for list filters and refresh state.
- `types/` contains feature-specific media item types.
- `utils/` contains item mapping, filtering, and detail helper functions.
- `constants/` contains player styling constants.

Routes import this feature through `@/plane-web/features/media-library`, which keeps the CE alias intact.
