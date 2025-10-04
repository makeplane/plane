import type { AppRouterProgressInstance } from "@bprogress/next";
// plane web imports
import type { TPowerKPageKeysExtended } from "@/plane-web/components/command-palette/power-k/types";

export type TPowerKPageKeys =
  // work item actions
  | "change-work-item-state"
  | "change-work-item-priority"
  | "change-work-item-assignee"
  | "change-work-item-estimate"
  | "change-work-item-cycle"
  | "change-work-item-module"
  | "change-work-item-label"
  // module actions
  | "change-module-member"
  | "change-module-status"
  // configs
  | "settings"
  // selection
  | "select-project"
  | "select-cycle"
  | "select-module"
  | "select-issue"
  | "select-page"
  | "select-view"
  | "select-state"
  | "select-priority"
  | "select-assignee"
  // personalization
  | "change-theme"
  | TPowerKPageKeysExtended;

// ============================================================================
// Command Types & Groups
// ============================================================================

export type CommandType = "navigation" | "action" | "creation" | "search" | "settings" | "contextual";
export type CommandGroup = "navigate" | "create" | "project" | "workspace" | "account" | "help" | "contextual";

// ============================================================================
// Search Scope Types
// ============================================================================

export type SearchScope = "all" | "work-items" | "projects" | "cycles" | "modules" | "pages" | "views";

export type SearchScopeConfig = {
  id: SearchScope;
  title: string;
  placeholder: string;
  icon?: React.ComponentType<{ className?: string }>;
};

// ============================================================================
// Route & Context Types
// ============================================================================

export type RouteContext = "workspace" | "project" | "issue" | "cycle" | "module" | "page" | "view";

export type CommandContext = {
  // Route information
  workspaceSlug?: string;
  projectId?: string;
  issueId?: string;
  cycleId?: string;
  moduleId?: string;
  pageId?: string;
  viewId?: string;
  routeContext?: RouteContext;

  // State flags
  isWorkspaceLevel?: boolean;

  // Permissions
  canPerformAnyCreateAction?: boolean;
  canPerformWorkspaceActions?: boolean;
  canPerformProjectActions?: boolean;

  // Additional context data (passed between steps)
  stepData?: Record<string, any>;
};

// ============================================================================
// Step System Types
// ============================================================================

export type TPowerKChangePageStepType =
  | "change-page-project"
  | "change-page-cycle"
  | "change-page-module"
  | "change-page-issue"
  | "change-page-page"
  | "change-page-view"
  | "change-page-state"
  | "change-page-priority"
  | "change-page-assignee";

export type TPowerKStepType = TPowerKChangePageStepType | "navigate" | "action" | "modal";

export type CommandStep = {
  type: TPowerKStepType;
  // Unique identifier for this step
  id?: string;
  // Display configuration
  title?: string;
  // Condition to execute this step (if returns false, skip)
  condition?: (context: CommandContext) => boolean;
  // Data to pass to next step
  dataKey?: string;
  // For navigate type
  route?: string | ((context: CommandContext) => string);
  // For action type
  action?: (context: CommandContext) => void | Promise<void>;
  // For modal type
  modalAction?: (context: CommandContext) => void;
};

// ============================================================================
// Command Configuration
// ============================================================================

export type CommandConfig = {
  id: string;
  type: CommandType;
  group?: CommandGroup;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  keySequence?: string;

  // Visibility & availability
  isEnabled?: (context: CommandContext) => boolean;
  isVisible?: (context: CommandContext) => boolean;

  // Context-based filtering - show only on specific routes
  showOnRoutes?: RouteContext[];
  // Context-based filtering - hide on specific routes
  hideOnRoutes?: RouteContext[];

  // Execution strategy
  // Option 1: Simple action (deprecated, use steps instead)
  action?: (executionContext: CommandExecutionContext) => void;

  // Option 2: Multi-step flow (recommended)
  steps?: CommandStep[];

  // Option 3: Sub-commands (for grouping)
  subCommands?: CommandConfig[];

  // Search scope (if this is a scoped search command)
  searchScope?: SearchScope;
};

// ============================================================================
// Command Group Configuration
// ============================================================================

export type CommandGroupConfig = {
  id: CommandGroup;
  title: string;
  priority: number;
};

// ============================================================================
// Execution Context
// ============================================================================

export type CommandExecutionContext = {
  closePalette: () => void;
  router: AppRouterProgressInstance;
  setPages: (pages: TPowerKPageKeys[] | ((pages: TPowerKPageKeys[]) => TPowerKPageKeys[])) => void;
  setSearchTerm: (term: string) => void;
  setSearchScope?: (scope: SearchScope) => void;
  context: CommandContext;
  updateContext: (updates: Partial<CommandContext>) => void;
};

// ============================================================================
// Step Execution Result
// ============================================================================

export type StepExecutionResult = {
  // Continue to next step automatically
  continue: boolean;
  // Updated context for next step
  updatedContext?: Partial<CommandContext>;
  // Close palette after this step
  closePalette?: boolean;
  // This step is waiting for user selection (for selection steps)
  waitingForSelection?: boolean;
  // The key to use for storing selected data (for selection steps)
  dataKey?: string;
  // This step was skipped due to condition
  skipped?: boolean;
};

export type ContextBasedAction = {
  key: string;
  i18n_label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  shouldRender?: boolean;
};
