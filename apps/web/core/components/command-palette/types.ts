import { AppRouterProgressInstance } from "@bprogress/next";

// ============================================================================
// Command Types & Groups
// ============================================================================

export type CommandType = "navigation" | "action" | "creation" | "search" | "settings" | "contextual";
export type CommandGroup = "navigate" | "create" | "project" | "workspace" | "account" | "help" | "contextual";

// ============================================================================
// Search Scope Types
// ============================================================================

export type SearchScope = "all" | "issues" | "projects" | "cycles" | "modules" | "pages" | "views";

export interface SearchScopeConfig {
  id: SearchScope;
  title: string;
  placeholder: string;
  icon?: React.ComponentType<{ className?: string }>;
}

// ============================================================================
// Route & Context Types
// ============================================================================

export type RouteContext = "workspace" | "project" | "issue" | "cycle" | "module" | "page" | "view";

export interface CommandContext {
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
}

// ============================================================================
// Step System Types
// ============================================================================

export type StepType =
  | "select-project"
  | "select-cycle"
  | "select-module"
  | "select-issue"
  | "select-page"
  | "select-view"
  | "select-state"
  | "select-priority"
  | "select-assignee"
  | "navigate"
  | "action"
  | "modal";

export interface CommandStep {
  type: StepType;
  // Unique identifier for this step
  id?: string;
  // Display configuration
  placeholder?: string;
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
}

// ============================================================================
// Command Configuration
// ============================================================================

export interface CommandConfig {
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
}

// ============================================================================
// Command Group Configuration
// ============================================================================

export interface CommandGroupConfig {
  id: CommandGroup;
  title: string;
  priority: number;
}

// ============================================================================
// Execution Context
// ============================================================================

export interface CommandExecutionContext {
  closePalette: () => void;
  router: AppRouterProgressInstance;
  setPages: (pages: string[] | ((pages: string[]) => string[])) => void;
  setPlaceholder: (placeholder: string) => void;
  setSearchTerm: (term: string) => void;
  setSearchScope?: (scope: SearchScope) => void;
  context: CommandContext;
  updateContext: (updates: Partial<CommandContext>) => void;
}

// ============================================================================
// Step Execution Result
// ============================================================================

export interface StepExecutionResult {
  // Continue to next step
  continue: boolean;
  // Updated context for next step
  updatedContext?: Partial<CommandContext>;
  // Close palette after this step
  closePalette?: boolean;
}

// ============================================================================
// Command Registry Interface
// ============================================================================

export interface ICommandRegistry {
  // Register commands
  register(command: CommandConfig): void;
  registerMultiple(commands: CommandConfig[]): void;

  // Get commands
  getCommand(id: string): CommandConfig | undefined;
  getVisibleCommands(context: CommandContext): CommandConfig[];
  getCommandsByGroup(group: CommandGroup, context: CommandContext): CommandConfig[];
  getContextualCommands(context: CommandContext): CommandConfig[];

  // Execute commands
  executeCommand(commandId: string, executionContext: CommandExecutionContext): Promise<void>;

  // Clear registry
  clear(): void;
}
