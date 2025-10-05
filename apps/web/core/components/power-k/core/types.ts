import type { AppRouterProgressInstance } from "@bprogress/next";

// ============================================================================
// Context Types
// ============================================================================

/**
 * Context type - determines which entity is currently active
 */
export type TPowerKContextType = "work-item" | "project" | "cycle" | "module";

/**
 * Context entity - information about the currently active entity
 */
export type TPowerKContextEntity = {
  type: TPowerKContextType;
  icon?: React.ReactNode;
  id: string;
  title: string;
};

/**
 * Command execution context - available data during command execution
 */
export type TPowerKContext = {
  // Route information
  params: Record<string, string | string[] | undefined>;

  // Current user
  currentUserId?: string;

  // Active context entity
  contextEntity?: TPowerKContextEntity | null;

  // Router for navigation
  router: AppRouterProgressInstance;

  // UI control
  closePalette: () => void;
  setActivePage: (page: TPowerKPageType | null) => void;
};

// ============================================================================
// Page Types (Selection Pages)
// ============================================================================

export type TPowerKPageType =
  | "select-state"
  | "select-priority"
  | "select-assignee"
  | "select-project"
  | "select-cycle"
  | "select-module"
  | "select-label"
  | "select-team"
  | "select-user"
  | "select-work-item";

// ============================================================================
// Command Types
// ============================================================================

/**
 * Command group for UI organization
 */
export type TPowerKCommandGroup = "navigation" | "create" | "work-item" | "project" | "cycle" | "general" | "settings";

/**
 * Command configuration
 */
export type TPowerKCommandConfig = {
  // Identity
  id: string;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;

  // Shortcuts (ONE of these)
  shortcut?: string; // Single key: "c", "p", "s"
  keySequence?: string; // Sequence: "gm", "op", "oc"
  modifierShortcut?: string; // With modifiers: "cmd+k", "cmd+delete", "cmd+shift+,"

  // Visibility & Context
  contextType?: TPowerKContextType; // Only show when this context is active
  showInSearch?: boolean; // Show in command palette search (default: true)
  group?: TPowerKCommandGroup; // For UI grouping

  // Conditions
  isVisible?: (ctx: TPowerKContext) => boolean; // Dynamic visibility
  isEnabled?: (ctx: TPowerKContext) => boolean; // Dynamic enablement

  // Search
  keywords?: string[]; // Alternative search keywords
} & (
  | {
      type: "change-page";
      page: TPowerKPageType; // Opens selection page
      onSelect: (selected: any, ctx: TPowerKContext) => void | Promise<void>; // Called after page selection
    }
  | {
      type: "action";
      action: (ctx: TPowerKContext) => void | Promise<void>; // Direct action
    }
);

// ============================================================================
// Registry Types
// ============================================================================

export type TPowerKCommandRegistry = {
  // Registration
  register(command: TPowerKCommandConfig): void;
  registerMultiple(commands: TPowerKCommandConfig[]): void;

  // Retrieval
  getCommand(id: string): TPowerKCommandConfig | undefined;
  getAllCommands(): TPowerKCommandConfig[];
  getVisibleCommands(ctx: TPowerKContext): TPowerKCommandConfig[];
  getCommandsByGroup(group: TPowerKCommandGroup, ctx: TPowerKContext): TPowerKCommandConfig[];

  // Shortcut lookup
  findByShortcut(key: string): TPowerKCommandConfig | undefined;
  findByKeySequence(sequence: string): TPowerKCommandConfig | undefined;
  findByModifierShortcut(shortcut: string): TPowerKCommandConfig | undefined;

  // Search
  search(query: string, ctx: TPowerKContext): TPowerKCommandConfig[];

  // Utility
  clear(): void;
};

// ============================================================================
// UI State Types
// ============================================================================

export type TCommandPaletteState = {
  isOpen: boolean;
  searchTerm: string;
  activePage: TPowerKPageType | null;
  contextEntity: TPowerKContextEntity | null;
  selectedCommand: TPowerKCommandConfig | null;
};

// ============================================================================
// Selection Page Props
// ============================================================================

export type TSelectionPageProps<T = any> = {
  workspaceSlug: string;
  projectId?: string;
  searchTerm?: string;
  onSelect: (item: T) => void;
  onClose: () => void;
};
