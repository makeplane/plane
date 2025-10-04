# Quick Reference Guide

Quick cheat sheet for working with the command palette system.

## Command Definition Template

```typescript
{
  id: "unique-command-id",
  type: "navigation" | "action" | "creation" | "contextual",
  group: "navigate" | "create" | "contextual" | "workspace" | "account" | "help",
  title: "Command Title",
  description: "What this command does",
  icon: IconComponent,
  shortcut: "k",           // Single key shortcut
  keySequence: "gp",       // Two-key sequence

  // Steps to execute
  steps: [
    { type: "...", ... },
  ],

  // Visibility & permissions
  isVisible: (context) => Boolean(context.workspaceSlug),
  isEnabled: (context) => Boolean(context.canPerformProjectActions),
  showOnRoutes: ["project", "issue"],  // Only show on these routes
  hideOnRoutes: ["workspace"],         // Hide on these routes
}
```

## Available Step Types

### Selection Steps
```typescript
// Select project
{ type: "select-project", placeholder: "Search projects", dataKey: "projectId" }

// Select cycle
{ type: "select-cycle", placeholder: "Search cycles", dataKey: "cycleId" }

// Select module
{ type: "select-module", placeholder: "Search modules", dataKey: "moduleId" }

// Select issue
{ type: "select-issue", placeholder: "Search issues", dataKey: "issueId" }

// Select state
{ type: "select-state", placeholder: "Select state", dataKey: "stateId" }

// Select priority
{ type: "select-priority", placeholder: "Select priority", dataKey: "priority" }

// Select assignee
{ type: "select-assignee", placeholder: "Select assignee", dataKey: "assigneeIds" }
```

### Action Steps
```typescript
// Navigate to a route
{
  type: "navigate",
  route: "/:workspace/projects/:project/issues"
}

// Dynamic route
{
  type: "navigate",
  route: (context) => `/${context.workspaceSlug}/custom/${context.stepData.id}`
}

// Execute action
{
  type: "action",
  action: async (context) => {
    await updateIssue(context.issueId, { state: context.stepData.stateId });
  }
}

// Open modal
{
  type: "modal",
  modalAction: (context) => {
    toggleCreateCycleModal(true);
  }
}
```

### Conditional Steps
```typescript
{
  type: "select-project",
  condition: (context) => !context.projectId,  // Only run if no project
  dataKey: "projectId"
}
```

## Context Object

```typescript
interface CommandContext {
  // Route info
  workspaceSlug?: string;
  projectId?: string;
  issueId?: string;
  cycleId?: string;
  moduleId?: string;
  routeContext?: "workspace" | "project" | "issue" | "cycle" | "module";

  // Permissions
  canPerformAnyCreateAction?: boolean;
  canPerformWorkspaceActions?: boolean;
  canPerformProjectActions?: boolean;

  // Step data (populated during multi-step flows)
  stepData?: Record<string, any>;
}
```

## Common Patterns

### Simple Navigation
```typescript
{
  id: "nav-dashboard",
  type: "navigation",
  group: "navigate",
  title: "Go to Dashboard",
  steps: [{ type: "navigate", route: "/:workspace" }],
  isVisible: (ctx) => Boolean(ctx.workspaceSlug),
}
```

### Multi-Step Navigation
```typescript
{
  id: "nav-cycle",
  type: "navigation",
  group: "navigate",
  title: "Open cycle",
  steps: [
    // Conditional project selection
    {
      type: "select-project",
      condition: (ctx) => !ctx.projectId,
      dataKey: "projectId"
    },
    // Cycle selection
    { type: "select-cycle", dataKey: "cycleId" },
    // Navigation
    {
      type: "navigate",
      route: (ctx) => `/${ctx.workspaceSlug}/projects/${ctx.projectId}/cycles/${ctx.stepData.cycleId}`
    }
  ],
  isVisible: (ctx) => Boolean(ctx.workspaceSlug),
}
```

### Creation Command
```typescript
{
  id: "create-cycle",
  type: "creation",
  group: "create",
  title: "Create new cycle",
  icon: ContrastIcon,
  shortcut: "q",
  showOnRoutes: ["project"],
  steps: [
    {
      type: "modal",
      modalAction: () => toggleCreateCycleModal(true)
    }
  ],
  isEnabled: (ctx) => ctx.canPerformProjectActions,
  isVisible: (ctx) => Boolean(ctx.projectId),
}
```

### Contextual Action
```typescript
{
  id: "issue-change-state",
  type: "contextual",
  group: "contextual",
  title: "Change state",
  showOnRoutes: ["issue"],
  steps: [
    { type: "select-state", dataKey: "stateId" },
    {
      type: "action",
      action: async (ctx) => {
        await updateIssue({ state: ctx.stepData.stateId });
      }
    }
  ],
  isVisible: (ctx) => Boolean(ctx.issueId),
}
```

### Simple Action
```typescript
{
  id: "copy-url",
  type: "action",
  group: "help",
  title: "Copy page URL",
  steps: [
    {
      type: "action",
      action: () => copyToClipboard(window.location.href)
    }
  ],
}
```

## Route Contexts

```typescript
type RouteContext =
  | "workspace"   // At workspace level
  | "project"     // Inside a project
  | "issue"       // Viewing an issue
  | "cycle"       // Viewing a cycle
  | "module"      // Viewing a module
  | "page"        // Viewing a page
  | "view"        // Viewing a view
```

## Command Groups

```typescript
type CommandGroup =
  | "navigate"    // Navigation commands
  | "create"      // Creation commands
  | "contextual"  // Context-specific actions
  | "workspace"   // Workspace management
  | "account"     // Account settings
  | "help"        // Help & support
```

## Shortcuts

```typescript
// Single key (requires Cmd/Ctrl)
shortcut: "k"  // Cmd+K

// Key sequence (no modifier needed)
keySequence: "gp"  // Press 'g' then 'p'

// Common sequences
"op" // Open project
"oc" // Open cycle
"om" // Open module
"oi" // Open issue
```

## Utility Functions

```typescript
import {
  buildCommandContext,
  determineRouteContext,
  hasEntityContext,
  hasPermission,
} from "./context-provider";

// Build context
const context = buildCommandContext({
  workspaceSlug: "acme",
  projectId: "proj-123",
  pathname: window.location.pathname,
  canPerformProjectActions: true,
});

// Check route
const routeContext = determineRouteContext("/acme/projects/123/issues");
// Returns: "project"

// Check entity availability
if (hasEntityContext(context, "project")) {
  // Project is available
}

// Check permissions
if (hasPermission(context, "project-admin")) {
  // User can perform admin actions
}
```

## Search Scopes

```typescript
import {
  getScopeConfig,
  getAvailableScopes,
  filterResultsByScope,
} from "./search-scopes";

// Get scope config
const scope = getScopeConfig("issues");
// { id: "issues", title: "Work Items", placeholder: "Search work items", icon: Layers }

// Get available scopes
const scopes = getAvailableScopes(hasProjectContext);

// Filter results
const filtered = filterResultsByScope(results, "issues");
```

## Registry Usage

```typescript
import { commandRegistry } from "./command-registry";

// Register commands
commandRegistry.registerMultiple([...commands]);

// Get visible commands (with context filtering)
const visible = commandRegistry.getVisibleCommands(context);

// Get commands by group
const navCommands = commandRegistry.getCommandsByGroup("navigate", context);

// Get contextual commands
const contextual = commandRegistry.getContextualCommands(context);

// Execute command
await commandRegistry.executeCommand("nav-project", executionContext);

// Execute by shortcut
await commandRegistry.executeShortcut("c", executionContext);

// Execute by key sequence
await commandRegistry.executeKeySequence("op", executionContext);
```

## Execution Context

```typescript
const executionContext: CommandExecutionContext = {
  closePalette: () => toggleModal(false),
  router: useAppRouter(),
  setPages: (pages) => setPages(pages),
  setPlaceholder: (text) => setPlaceholder(text),
  setSearchTerm: (term) => setSearchTerm(term),
  setSearchScope: (scope) => setSearchScope(scope),
  context: commandContext,
  updateContext: (updates) => setContext({ ...context, ...updates }),
};
```

## Common Checks

```typescript
// Check if in project context
isVisible: (ctx) => Boolean(ctx.projectId)

// Check workspace permissions
isEnabled: (ctx) => ctx.canPerformWorkspaceActions

// Check project permissions
isEnabled: (ctx) => ctx.canPerformProjectActions

// Check create permissions
isEnabled: (ctx) => ctx.canPerformAnyCreateAction

// Show only on specific route
showOnRoutes: ["project", "issue"]

// Hide on specific route
hideOnRoutes: ["workspace"]

// Complex visibility
isVisible: (ctx) => {
  return Boolean(ctx.projectId) && ctx.canPerformProjectActions;
}
```

## Tips

1. **Always provide `isVisible`** - Even if it's just `() => true`
2. **Use `showOnRoutes` for context-specific commands** - Cleaner than complex `isVisible`
3. **Use `dataKey` in selection steps** - Makes data available in subsequent steps
4. **Use conditional steps for dynamic flows** - e.g., auto-select project if needed
5. **Keep command IDs unique** - Use descriptive prefixes (nav-, create-, issue-)
6. **Add descriptions** - Helps users understand what command does
7. **Use shortcuts wisely** - Don't override common browser shortcuts
8. **Test in different contexts** - Workspace, project, issue levels

## Quick Checklist

When adding a new command:
- [ ] Unique ID
- [ ] Correct type (navigation/action/creation/contextual)
- [ ] Appropriate group
- [ ] Clear title & description
- [ ] Icon (if applicable)
- [ ] Steps defined
- [ ] Visibility logic
- [ ] Permission checks
- [ ] Route context (if contextual)
- [ ] Tested in relevant contexts
