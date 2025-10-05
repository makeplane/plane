import type { AppRouterProgressInstance } from "@bprogress/next";
// plane web imports
import type {
  TPowerKContextTypeExtended,
  TPowerKPageTypeExtended,
} from "@/plane-web/components/command-palette/power-k/types";

// entities for which contextual actions are available
export type TPowerKContextType = "work-item" | "page" | "cycle" | "module" | TPowerKContextTypeExtended;

/**
 * Command execution context - available data during command execution
 */
export type TPowerKContext = {
  // Route information
  params: Record<string, string | string[] | undefined>;
  // Current user
  currentUserId?: string;
  activeCommand: TPowerKCommandConfig | null;
  // Active context
  activeContext: TPowerKContextType | null;
  // Router for navigation
  router: AppRouterProgressInstance;
  // UI control
  closePalette: () => void;
  setActiveCommand: (command: TPowerKCommandConfig | null) => void;
  setActivePage: (page: TPowerKPageType | null) => void;
};

// ============================================================================
// Page Types (Selection Pages)
// ============================================================================

export type TPowerKPageType =
  // open entity based actions
  | "open-workspace"
  | "open-project"
  | "open-workspace-setting"
  | "open-project-cycle"
  | "open-project-module"
  | "open-project-view"
  | "open-project-setting"
  // work item context based actions
  | "update-work-item-state"
  | "update-work-item-priority"
  | "update-work-item-assignee"
  | "update-work-item-estimate"
  | "update-work-item-cycle"
  | "update-work-item-module"
  | "update-work-item-labels"
  // module context based actions
  | "update-module-member"
  | "update-module-status"
  | TPowerKPageTypeExtended;

// ============================================================================
// Command Types
// ============================================================================

/**
 * Command group for UI organization
 */
export type TPowerKCommandGroup =
  // context based groups
  "contextual" | "navigation" | "create" | "general" | "settings" | "help" | "account";

/**
 * Command configuration
 */
export type TPowerKCommandConfig = {
  // Identity
  id: string;
  i18n_title: string;
  i18n_description?: string;
  icon?: React.ComponentType<{ className?: string }>;

  // Shortcuts (ONE of these)
  shortcut?: string; // Single key: "c", "p", "s"
  keySequence?: string; // Sequence: "gm", "op", "oc"
  modifierShortcut?: string; // With modifiers: "cmd+k", "cmd+delete", "cmd+shift+,"

  // Visibility & Context
  closeOnSelect: boolean; // Whether to close the palette after selection

  // Conditions
  isVisible: (ctx: TPowerKContext) => boolean; // Dynamic visibility
  isEnabled: (ctx: TPowerKContext) => boolean; // Dynamic enablement

  // Search
  keywords?: string[]; // Alternative search keywords
} & (
  | {
      group: Extract<TPowerKCommandGroup, "contextual">; // For UI grouping
      contextType: TPowerKContextType; // Only show when this context is active
    }
  | {
      group: Exclude<TPowerKCommandGroup, "contextual">;
    }
) &
  (
    | {
        type: "change-page";
        page: TPowerKPageType; // Opens selection page
        onSelect: (data: unknown, ctx: TPowerKContext) => void | Promise<void>; // Called after page selection
      }
    | {
        type: "action";
        action: (ctx: TPowerKContext) => void | Promise<void>; // Direct action
      }
  );

// ============================================================================
// UI State Types
// ============================================================================

export type TCommandPaletteState = {
  isOpen: boolean;
  searchTerm: string;
  activePage: TPowerKPageType | null;
  activeContext: TPowerKContextType | null;
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
