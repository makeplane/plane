# Command Palette Architecture

## Overview

This document describes the new command palette foundation that supports Linear-level capabilities with a declarative, config-driven approach.

## Core Concepts

### 1. Multi-Step Commands

Commands can now define multiple steps that execute in sequence. Each step can:
- Be conditional (execute only if condition is met)
- Pass data to the next step
- Open selection UI (project, cycle, module, etc.)
- Navigate to a route
- Execute an action
- Open a modal

Example:
```typescript
{
  id: "navigate-cycle",
  steps: [
    // Step 1: Select project (only if not in project context)
    {
      type: "select-project",
      condition: (context) => !context.projectId,
      dataKey: "projectId",
    },
    // Step 2: Select cycle
    {
      type: "select-cycle",
      dataKey: "cycleId",
    },
    // Step 3: Navigate to selected cycle
    {
      type: "navigate",
      route: (context) => `/${context.workspaceSlug}/projects/${context.projectId}/cycles/${context.cycleId}`,
    },
  ],
}
```

### 2. Context-Aware Filtering

Commands can specify:
- `showOnRoutes`: Only show on specific routes (workspace, project, issue, etc.)
- `hideOnRoutes`: Hide on specific routes
- `isVisible(context)`: Dynamic visibility based on full context
- `isEnabled(context)`: Dynamic enablement based on permissions

Example:
```typescript
{
  id: "navigate-project-settings",
  showOnRoutes: ["project"], // Only show when in a project
  isVisible: (context) => Boolean(context.workspaceSlug && context.projectId),
  isEnabled: (context) => context.canPerformProjectActions,
}
```

### 3. Reusable Steps

Common selection flows are extracted into reusable step components in `/steps/`:
- `SelectProjectStep` - Project selection
- `SelectCycleStep` - Cycle selection
- `SelectModuleStep` - Module selection
- `SelectIssueStep` - Issue search and selection

These can be used in any command flow.

### 4. Type Safety

All types are defined in `types.ts` with comprehensive documentation:
- `CommandConfig` - Command definition
- `CommandStep` - Individual step in a command flow
- `CommandContext` - Current route and permission context
- `StepType` - All available step types
- `RouteContext` - Current page type (workspace, project, issue, etc.)
- `SearchScope` - Search filtering (all, issues, projects, etc.)

## File Structure

```
command-palette/
├── types.ts                     # All type definitions
├── command-registry.ts          # Registry with context-aware filtering
├── command-executor.ts          # Multi-step execution engine
├── steps/                       # Reusable step components
│   ├── select-project-step.tsx
│   ├── select-cycle-step.tsx
│   ├── select-module-step.tsx
│   └── select-issue-step.tsx
├── commands/                    # Command definitions
│   ├── navigation-commands.ts   # All navigation commands
│   ├── creation-commands.ts     # All creation commands
│   ├── contextual-commands.ts   # Context-specific commands
│   ├── settings-commands.ts     # Settings navigation
│   ├── account-commands.ts      # Account commands
│   └── extra-commands.ts        # Misc actions
└── [UI components...]
```

## What This Foundation Enables

### ✅ Completed

1. **Multi-step navigation flows**
   - Navigate to cycle: Select project (if needed) → Select cycle → Navigate
   - Navigate to module: Select project (if needed) → Select module → Navigate
   - All selection steps are reusable

2. **Context-aware commands**
   - Commands can show/hide based on current route
   - Commands can be enabled/disabled based on permissions

3. **Comprehensive navigation**
   - Navigate to any page in the app
   - Project-level navigation (only shows in project context)
   - Workspace-level navigation
   - Direct navigation (no selection needed)

4. **Type-safe command system**
   - All types properly defined
   - Full IntelliSense support
   - Clear documentation

### 🚧 To Be Implemented

1. **Creation commands** (expand existing)
   - Add all missing entity types (cycle, module, view, page, etc.)
   - Use modal step type

2. **Contextual commands**
   - Issue actions (change state, priority, assignee, etc.)
   - Cycle actions
   - Module actions
   - Project actions

3. **Extra commands**
   - Sign out
   - Leave workspace
   - Invite members
   - Copy URL for current page
   - Toggle sidebar
   - etc.

4. **Scoped search**
   - Search only issues
   - Search only projects
   - Search only cycles
   - etc.

5. **UI Integration**
   - Update CommandModal to use new step system
   - Update CommandPageContent to render steps
   - Update CommandRenderer to show contextual commands

## How to Add a New Command

### Simple Navigation Command

```typescript
{
  id: "navigate-settings",
  type: "navigation",
  group: "navigate",
  title: "Go to Settings",
  icon: Settings,
  steps: [
    {
      type: "navigate",
      route: "/:workspace/settings",
    },
  ],
  isVisible: (context) => Boolean(context.workspaceSlug),
}
```

### Multi-Step Navigation Command

```typescript
{
  id: "navigate-page",
  type: "navigation",
  group: "navigate",
  title: "Open page",
  steps: [
    {
      type: "select-project",
      condition: (context) => !context.projectId,
      dataKey: "projectId",
    },
    {
      type: "select-page",
      dataKey: "pageId",
    },
    {
      type: "navigate",
      route: (context) => `/${context.workspaceSlug}/projects/${context.projectId}/pages/${context.pageId}`,
    },
  ],
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
  steps: [
    {
      type: "modal",
      modalAction: (context) => toggleCreateCycleModal(true),
    },
  ],
  isEnabled: (context) => context.canPerformProjectActions,
  isVisible: (context) => Boolean(context.projectId),
}
```

### Contextual Command (Issue Actions)

```typescript
{
  id: "change-issue-state",
  type: "contextual",
  group: "contextual",
  title: "Change state",
  icon: DoubleCircleIcon,
  showOnRoutes: ["issue"], // Only show on issue pages
  steps: [
    {
      type: "select-state",
      dataKey: "stateId",
    },
    {
      type: "action",
      action: async (context) => {
        await updateIssue(context.issueId, { state: context.stepData.stateId });
      },
    },
  ],
  isVisible: (context) => Boolean(context.issueId),
}
```

## Benefits of This Architecture

1. **Declarative**: Commands are just config objects
2. **Reusable**: Steps can be shared across commands
3. **Type-safe**: Full TypeScript support
4. **Extensible**: Easy to add new command types and steps
5. **Testable**: Pure functions, easy to test
6. **Maintainable**: Clear separation of concerns
7. **Context-aware**: Commands automatically show/hide based on context
8. **Flexible**: Supports simple actions to complex multi-step flows

## Migration Notes

- Old `action` property still supported but deprecated
- New commands should use `steps` array
- Context is now passed through all functions
- Registry methods now require `CommandContext` parameter
