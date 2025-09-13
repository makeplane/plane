export type CommandType = "navigation" | "action" | "creation" | "search" | "settings";
export type CommandGroup = "navigate" | "create" | "project" | "workspace" | "account" | "help";

export interface CommandConfig {
  id: string;
  type: CommandType;
  group?: CommandGroup;
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  keySequence?: string;
  isEnabled?: () => boolean;
  isVisible?: () => boolean;
  action: () => void;
  subCommands?: CommandConfig[];
}

export interface CommandContext {
  workspaceSlug?: string;
  projectId?: string;
  issueId?: string;
  isWorkspaceLevel?: boolean;
  canPerformAnyCreateAction?: boolean;
  canPerformWorkspaceActions?: boolean;
  canPerformProjectActions?: boolean;
}

export interface CommandGroupConfig {
  id: CommandGroup;
  title: string;
  priority: number;
}

export interface CommandExecutionContext {
  closePalette: () => void;
  router: any;
  setPages: (pages: string[] | ((pages: string[]) => string[])) => void;
  setPlaceholder: (placeholder: string) => void;
  setSearchTerm: (term: string) => void;
  context: CommandContext;
}
