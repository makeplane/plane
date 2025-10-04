# Command Palette Integration Guide

This guide explains how to integrate the new command palette foundation into your existing codebase.

## Overview

The new command palette uses a **declarative, config-driven approach** where commands are defined as configuration objects with steps. The system handles:
- Multi-step flows (select project → select cycle → navigate)
- Context-aware visibility (show/hide based on route)
- Permission-based filtering
- Reusable step components

## Quick Start

### 1. Update Command Registration

**Old approach (deprecated):**
```typescript
const createNavigationCommands = (
  openProjectList: () => void,
  openCycleList: () => void
) => [
  {
    id: "open-project-list",
    action: openProjectList,
  },
];
```

**New approach (recommended):**
```typescript
const createNavigationCommands = (): CommandConfig[] => [
  {
    id: "navigate-project",
    steps: [
      { type: "select-project", dataKey: "projectId" },
      { type: "navigate", route: "/:workspace/projects/:projectId/issues" },
    ],
    isVisible: (context) => Boolean(context.workspaceSlug),
  },
];
```

### 2. Initialize Commands with Context

The command registry now requires context for filtering:

```typescript
// Build context from current route and permissions
const context: CommandContext = {
  workspaceSlug: "acme",
  projectId: "proj-123",
  routeContext: "project", // workspace | project | issue | cycle | module | page | view
  canPerformProjectActions: true,
  canPerformWorkspaceActions: true,
  canPerformAnyCreateAction: true,
};

// Get visible commands
const visibleCommands = registry.getVisibleCommands(context);
```

### 3. Execute Commands

Commands are now executed asynchronously with full context:

```typescript
const executionContext: CommandExecutionContext = {
  closePalette: () => toggleCommandPaletteModal(false),
  router: router,
  setPages: setPages,
  setPlaceholder: setPlaceholder,
  setSearchTerm: setSearchTerm,
  context: context,
  updateContext: (updates) => setContext({ ...context, ...updates }),
};

// Execute command
await registry.executeCommand("navigate-project", executionContext);
```

## Integration Steps

### Step 1: Update `use-command-registry.ts`

The hook needs to build proper context and initialize all command types:

```typescript
export const useCommandRegistryInitializer = () => {
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();
  const { toggleCreateIssueModal, toggleCreateProjectModal, toggleCreateCycleModal } = useCommandPalette();

  // Determine route context
  const routeContext = determineRouteContext(router.pathname);

  // Build full context
  const context: CommandContext = useMemo(() => ({
    workspaceSlug: workspaceSlug?.toString(),
    projectId: projectId?.toString(),
    routeContext,
    canPerformAnyCreateAction,
    canPerformWorkspaceActions,
    canPerformProjectActions,
  }), [workspaceSlug, projectId, routeContext, permissions...]);

  // Initialize all commands
  const initializeCommands = useCallback(() => {
    registry.clear();

    const commands = [
      ...createNavigationCommands(),
      ...createCreationCommands(executionContext, toggleCreateIssueModal, ...),
      ...createIssueContextualCommands(currentUserId, updateIssue, ...),
      ...createCycleContextualCommands(...),
      ...createModuleContextualCommands(...),
      ...createProjectContextualCommands(...),
      ...createExtraCommands(signOut, toggleInviteModal, ...),
      ...createAccountCommands(...),
      ...createSettingsCommands(...),
    ];

    registry.registerMultiple(commands);
  }, [dependencies...]);

  return { registry, context, executionContext, initializeCommands };
};
```

### Step 2: Update `command-modal.tsx`

The modal needs to:
1. Determine current route context
2. Update context as user navigates
3. Pass context to command registry

```typescript
export const CommandModal = () => {
  const { workspaceSlug, projectId, issueId, cycleId, moduleId } = useParams();
  const [context, setContext] = useState<CommandContext>({});

  // Determine route context from pathname
  const routeContext = useMemo(() => {
    const pathname = window.location.pathname;
    if (pathname.includes('/cycles/')) return 'cycle';
    if (pathname.includes('/modules/')) return 'module';
    if (pathname.includes('/pages/')) return 'page';
    if (pathname.includes('/views/')) return 'view';
    if (issueId) return 'issue';
    if (projectId) return 'project';
    return 'workspace';
  }, [pathname, projectId, issueId, cycleId, moduleId]);

  // Update context when route changes
  useEffect(() => {
    setContext({
      workspaceSlug: workspaceSlug?.toString(),
      projectId: projectId?.toString(),
      issueId: issueId?.toString(),
      cycleId: cycleId?.toString(),
      moduleId: moduleId?.toString(),
      routeContext,
      canPerformProjectActions,
      canPerformWorkspaceActions,
      canPerformAnyCreateAction,
    });
  }, [workspaceSlug, projectId, issueId, cycleId, moduleId, routeContext, permissions]);

  // Initialize registry with context
  const { registry, initializeCommands } = useCommandRegistryInitializer();

  useEffect(() => {
    initializeCommands();
  }, [initializeCommands]);

  // Get commands with context filtering
  const visibleCommands = useMemo(
    () => registry.getVisibleCommands(context),
    [registry, context]
  );

  return (
    <CommandModal>
      <CommandRenderer
        commands={visibleCommands}
        onCommandSelect={(cmd) => registry.executeCommand(cmd.id, executionContext)}
      />
    </CommandModal>
  );
};
```

### Step 3: Update `command-page-content.tsx`

Handle new step types in page rendering:

```typescript
export const CommandPageContent = ({ page, ... }) => {
  // Existing page handling
  if (!page) {
    return <MainPage ... />;
  }

  // New step-based page handling
  if (page === "select-project") {
    return <SelectProjectStep workspaceSlug={workspaceSlug} onSelect={handleProjectSelect} />;
  }

  if (page === "select-cycle") {
    return <SelectCycleStep workspaceSlug={workspaceSlug} projectId={projectId} onSelect={handleCycleSelect} />;
  }

  if (page === "select-module") {
    return <SelectModuleStep workspaceSlug={workspaceSlug} projectId={projectId} onSelect={handleModuleSelect} />;
  }

  // ... handle other step types
};
```

### Step 4: Update `command-renderer.tsx`

The renderer should group commands properly:

```typescript
export const CommandRenderer = ({ commands, onCommandSelect }) => {
  // Group commands by type
  const groupedCommands = useMemo(() => {
    const groups: Record<CommandGroup, CommandConfig[]> = {
      navigate: [],
      create: [],
      contextual: [],
      workspace: [],
      account: [],
      help: [],
    };

    commands.forEach(cmd => {
      const group = cmd.group || 'help';
      groups[group].push(cmd);
    });

    return groups;
  }, [commands]);

  return (
    <>
      {/* Navigation commands */}
      {groupedCommands.navigate.length > 0 && (
        <Command.Group heading="Navigate">
          {groupedCommands.navigate.map(cmd => (
            <CommandItem key={cmd.id} command={cmd} onSelect={onCommandSelect} />
          ))}
        </Command.Group>
      )}

      {/* Creation commands */}
      {groupedCommands.create.length > 0 && (
        <Command.Group heading="Create">
          {groupedCommands.create.map(cmd => (
            <CommandItem key={cmd.id} command={cmd} onSelect={onCommandSelect} />
          ))}
        </Command.Group>
      )}

      {/* Contextual commands (issue actions, cycle actions, etc.) */}
      {groupedCommands.contextual.length > 0 && (
        <Command.Group heading="Actions">
          {groupedCommands.contextual.map(cmd => (
            <CommandItem key={cmd.id} command={cmd} onSelect={onCommandSelect} />
          ))}
        </Command.Group>
      )}

      {/* Other groups... */}
    </>
  );
};
```

## Helper Function: Determine Route Context

```typescript
function determineRouteContext(pathname: string): RouteContext {
  if (pathname.includes('/cycles/') && pathname.split('/').length > 6) return 'cycle';
  if (pathname.includes('/modules/') && pathname.split('/').length > 6) return 'module';
  if (pathname.includes('/pages/') && pathname.split('/').length > 6) return 'page';
  if (pathname.includes('/views/') && pathname.split('/').length > 6) return 'view';
  if (pathname.includes('/work-item/') || pathname.includes('/-/')) return 'issue';
  if (pathname.includes('/projects/') && pathname.split('/').length > 4) return 'project';
  return 'workspace';
}
```

## Scoped Search Integration

To add scoped search (search only issues, only projects, etc.):

```typescript
// Add search scope state
const [searchScope, setSearchScope] = useState<SearchScope>('all');

// Filter search results based on scope
const filteredResults = useMemo(() => {
  if (searchScope === 'all') return results;

  return {
    ...results,
    results: {
      issues: searchScope === 'issues' ? results.results.issues : [],
      projects: searchScope === 'projects' ? results.results.projects : [],
      cycles: searchScope === 'cycles' ? results.results.cycles : [],
      // ... other entity types
    },
  };
}, [results, searchScope]);

// Add scope selector UI
<SearchScopeSelector
  activeScope={searchScope}
  onScopeChange={setSearchScope}
/>
```

## Migration Checklist

- [ ] Update `use-command-registry.ts` to build full context
- [ ] Update `command-modal.tsx` to determine route context
- [ ] Update `command-page-content.tsx` to handle new step types
- [ ] Update `command-renderer.tsx` to group contextual commands
- [ ] Add helper function to determine route context
- [ ] Wire up all modal toggles to creation commands
- [ ] Wire up update functions to contextual commands
- [ ] Test navigation flows (project → cycle, workspace → module, etc.)
- [ ] Test contextual commands appear only on correct routes
- [ ] Test permission-based filtering
- [ ] Add scoped search UI (optional)

## Testing Commands

### Test Navigation Commands

1. Open command palette
2. Type "op" → Should show project selector
3. Select project → Should navigate to project issues
4. Type "oc" → If in project, show cycles. If not, show project selector first
5. Type "om" → Similar to cycles

### Test Creation Commands

1. In project context, open palette
2. Should see: Create work item (c), Create cycle (q), Create module (m), Create view (v), Create page (d)
3. Outside project context, should only see: Create work item (c), Create project (p)

### Test Contextual Commands

1. Navigate to an issue page
2. Open palette
3. Should see issue-specific actions: Change state, Change priority, Assign to, etc.
4. These should NOT appear on other pages

### Test Extra Commands

1. Open palette from any page
2. Should see: Copy page URL, Toggle sidebar, Download apps, Sign out
3. "Invite members" only if user has workspace permissions

## Common Issues

**Commands not appearing:**
- Check `isVisible()` returns true for current context
- Check `isEnabled()` returns true
- Check route context matches `showOnRoutes` if specified

**Multi-step flow not working:**
- Ensure `dataKey` is set on selection steps
- Ensure route uses correct parameter names (`:projectId` not `:project`)
- Check `updateContext()` is called in execution context

**Contextual commands appearing everywhere:**
- Set `showOnRoutes` to limit where they appear
- Use `isVisible(context)` to check for required IDs

## Next Steps

After integration:
1. Add remaining contextual commands for all entities
2. Implement scoped search UI
3. Add keyboard shortcuts for all commands
4. Add command palette onboarding/tutorial
5. Add analytics for command usage

## Support

For questions or issues with the new command system, refer to:
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture overview
- [types.ts](./types.ts) - Type definitions with inline documentation
- [commands/](./commands/) - Example command definitions
