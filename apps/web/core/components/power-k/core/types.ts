import type { useRouter } from "next/navigation";
// plane web imports
import type {
  TPowerKContextTypeExtended,
  TPowerKPageTypeExtended,
  TPowerKSearchResultsKeysExtended,
} from "@/plane-web/components/command-palette/power-k/types";

export type TPowerKContextType = "work-item" | "page" | "cycle" | "module" | TPowerKContextTypeExtended;

export type TPowerKContext = {
  // Route information
  params: Record<string, string | string[] | undefined>;
  // Current user
  currentUserId?: string;
  activeCommand: TPowerKCommandConfig | null;
  // Active context
  activeContext: TPowerKContextType | null;
  shouldShowContextBasedActions: boolean;
  setShouldShowContextBasedActions: (shouldShowContextBasedActions: boolean) => void;
  // Router for navigation
  router: ReturnType<typeof useRouter>;
  // UI control
  closePalette: () => void;
  setActiveCommand: (command: TPowerKCommandConfig | null) => void;
  setActivePage: (page: TPowerKPageType | null) => void;
};

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
  // preferences
  | "update-theme"
  | "update-timezone"
  | "update-start-of-week"
  | "update-language"
  | TPowerKPageTypeExtended;

export type TPowerKCommandGroup =
  | "contextual"
  | "navigation"
  | "create"
  | "general"
  | "settings"
  | "help"
  | "account"
  | "miscellaneous"
  | "preferences";

export type TPowerKCommandConfig = {
  // Identity
  id: string;
  i18n_title: string;
  i18n_description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconNode?: React.ReactNode;

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

export type TSelectionPageProps<T = any> = {
  workspaceSlug: string;
  projectId?: string;
  searchTerm?: string;
  onSelect: (item: T) => void;
  onClose: () => void;
};

export type TPowerKSearchResultsKeys =
  | "workspace"
  | "project"
  | "issue"
  | "cycle"
  | "module"
  | "issue_view"
  | "page"
  | TPowerKSearchResultsKeysExtended;
