// Main components
export { CommandPaletteV2ModalWrapper } from "./modal-wrapper";
export { CommandPaletteV2GlobalShortcuts } from "./global-shortcuts";

// Types
export type { TPowerKCommandConfig, TPowerKContext, TPowerKPageType, TPowerKCommandGroup } from "./core/types";

// Registry (if needed for custom commands)
export { commandRegistry } from "./core/registry";

// Utils
export { formatShortcutForDisplay, ShortcutBadge, KeySequenceBadge } from "./utils/format-shortcut";
