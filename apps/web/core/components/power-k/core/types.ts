import type { AppRouterProgressInstance } from "@bprogress/next";

// ============================================================================
// Context Types
// ============================================================================

/**
 * Context type - determines which entity is currently active
 */
export type TPowerKContextType = "work-item" | "project" | "cycle" | "module" | null;

/**
 * Context entity - information about the currently active entity
 */
export type TPowerKContextEntity = {
  type: Exclude<TPowerKContextType, null>;
  id: string;
  title: string;
  identifier?: string; // For work items (e.g., "PLANE-123")
};

/**
 * Command execution context - available data during command execution
 */
export type TPowerKContext = {
  // Route information
  workspaceSlug?: string;
  projectId?: string;
  issueId?: string;
  cycleId?: string;
  moduleId?: string;

  // Current user
  currentUserId?: string;

  // Active context entity
  contextEntity?: TPowerKContextEntity | null;

  // Permissions
  canPerformAnyCreateAction?: boolean;
  canPerformWorkspaceActions?: boolean;
  canPerformProjectActions?: boolean;

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

  page?: TPowerKPageType; // Opens selection page

  // Execution (ONE of these)
  action?: (ctx: TPowerKContext) => void | Promise<void>; // Direct action
  onSelect?: (selected: any, ctx: TPowerKContext) => void | Promise<void>; // Called after page selection

  // Search
  searchTerms?: string[]; // Alternative search keywords
};

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
