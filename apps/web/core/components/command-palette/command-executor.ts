"use client";

import {
  CommandConfig,
  CommandExecutionContext,
  CommandStep,
  CommandContext,
  StepExecutionResult,
  TPowerKPageKeys,
} from "./power-k/types";

/**
 * CommandExecutor handles execution of individual command steps.
 * It does NOT manage multi-step flow - that's handled by the modal component.
 */
export class CommandExecutor {
  /**
   * Execute a command - either a simple action or start multi-step flow
   */
  async executeCommand(command: CommandConfig, executionContext: CommandExecutionContext): Promise<void> {
    // Check if command is enabled
    if (command.isEnabled && !command.isEnabled(executionContext.context)) {
      console.warn(`Command ${command.id} is not enabled`);
      return;
    }

    // If it's a simple action command, execute and done
    if (command.action) {
      command.action(executionContext);
      return;
    }

    // If it has steps, execution will be handled by the modal component
    // This is just a passthrough - the modal will call executeSingleStep() for each step
  }

  /**
   * Execute a single step at a given index
   * Returns the result which tells the caller what to do next
   */
  async executeSingleStep(step: CommandStep, executionContext: CommandExecutionContext): Promise<StepExecutionResult> {
    // Check step condition
    if (step.condition && !step.condition(executionContext.context)) {
      // Skip this step, continue to next
      return { continue: true, skipped: true };
    }

    switch (step.type) {
      case "navigate":
        return this.executeNavigateStep(step, executionContext);

      case "action":
        return this.executeActionStep(step, executionContext);

      case "modal":
        return this.executeModalStep(step, executionContext);

      case "change-page-project":
      case "change-page-cycle":
      case "change-page-module":
      case "change-page-issue":
      case "change-page-page":
      case "change-page-view":
      case "change-page-state":
      case "change-page-priority":
      case "change-page-assignee":
        return this.executeSelectionStep(step, executionContext);

      default:
        console.warn(`Unknown step type: ${step.type}`);
        return { continue: false };
    }
  }

  /**
   * Execute a navigation step
   */
  private async executeNavigateStep(
    step: CommandStep,
    executionContext: CommandExecutionContext
  ): Promise<StepExecutionResult> {
    if (!step.route) {
      console.warn("Navigate step missing route");
      return { continue: false };
    }

    const route = typeof step.route === "function" ? step.route(executionContext.context) : step.route;

    // Replace route parameters with context values
    const resolvedRoute = this.resolveRouteParameters(route, executionContext.context);

    executionContext.router.push(resolvedRoute);
    executionContext.closePalette();

    return {
      continue: false,
      closePalette: true,
    };
  }

  /**
   * Execute an action step
   */
  private async executeActionStep(
    step: CommandStep,
    executionContext: CommandExecutionContext
  ): Promise<StepExecutionResult> {
    if (!step.action) {
      console.warn("Action step missing action function");
      return { continue: false };
    }

    await step.action(executionContext.context);

    return { continue: true };
  }

  /**
   * Execute a modal step (open a modal)
   */
  private async executeModalStep(
    step: CommandStep,
    executionContext: CommandExecutionContext
  ): Promise<StepExecutionResult> {
    if (!step.modalAction) {
      console.warn("Modal step missing modalAction function");
      return { continue: false };
    }

    step.modalAction(executionContext.context);
    executionContext.closePalette();

    return {
      continue: false,
      closePalette: true,
    };
  }

  /**
   * Execute a selection step (opens a selection page)
   * The modal component will handle waiting for user selection
   */
  private async executeSelectionStep(
    step: CommandStep,
    executionContext: CommandExecutionContext
  ): Promise<StepExecutionResult> {
    // Map step type to page identifier
    const pageMap: Record<string, TPowerKPageKeys> = {
      "select-project": "select-project",
      "select-cycle": "select-cycle",
      "select-module": "select-module",
      "select-issue": "select-issue",
      "select-page": "select-page",
      "select-view": "select-view",
      "select-state": "select-state",
      "select-priority": "select-priority",
      "select-assignee": "select-assignee",
    };

    const pageId = pageMap[step.type];
    if (!pageId) {
      console.warn(`Unknown selection step type: ${step.type}`);
      return { continue: false };
    }

    // Update UI state for the selection page
    // Placeholder is automatically derived from page key in modal component
    executionContext.setSearchTerm("");

    // Only add page if it's not already the active page (for backspace navigation support)
    executionContext.setPages((pages) => {
      const lastPage = pages[pages.length - 1];
      if (lastPage === pageId) {
        // Page already showing, don't add duplicate
        return pages;
      }
      // Add new page to stack
      return [...pages, pageId];
    });

    // Return that we need to wait for user interaction
    // The modal will handle this and call executeSingleStep again when selection is made
    return {
      continue: false,
      waitingForSelection: true,
      dataKey: step.dataKey, // Tell modal what key to use for storing selected data
    };
  }

  /**
   * Resolve route parameters using context values
   * Priority: stepData > direct context properties
   */
  resolveRouteParameters(route: string, context: CommandContext): string {
    let resolvedRoute = route;

    // First, handle stepData replacements (highest priority for multi-step flows)
    if (context.stepData) {
      Object.keys(context.stepData).forEach((key) => {
        const placeholder = `:${key}`;
        if (resolvedRoute.includes(placeholder)) {
          resolvedRoute = resolvedRoute.replace(new RegExp(placeholder, "g"), context.stepData![key]);
        }
      });
    }

    // Replace :workspace with workspaceSlug
    if (context.workspaceSlug && resolvedRoute.includes(":workspace")) {
      resolvedRoute = resolvedRoute.replace(/:workspace/g, context.workspaceSlug);
    }

    // Replace :project with projectId (only if not already replaced by stepData)
    if (context.projectId && resolvedRoute.includes(":project")) {
      resolvedRoute = resolvedRoute.replace(/:project/g, context.projectId);
    }

    // Replace :issue with issueId (only if not already replaced by stepData)
    if (context.issueId && resolvedRoute.includes(":issue")) {
      resolvedRoute = resolvedRoute.replace(/:issue/g, context.issueId);
    }

    // Replace :cycle with cycleId (only if not already replaced by stepData)
    if (context.cycleId && resolvedRoute.includes(":cycle")) {
      resolvedRoute = resolvedRoute.replace(/:cycle/g, context.cycleId);
    }

    // Replace :module with moduleId (only if not already replaced by stepData)
    if (context.moduleId && resolvedRoute.includes(":module")) {
      resolvedRoute = resolvedRoute.replace(/:module/g, context.moduleId);
    }

    // Replace :page with pageId (only if not already replaced by stepData)
    if (context.pageId && resolvedRoute.includes(":page")) {
      resolvedRoute = resolvedRoute.replace(/:page/g, context.pageId);
    }

    // Replace :view with viewId (only if not already replaced by stepData)
    if (context.viewId && resolvedRoute.includes(":view")) {
      resolvedRoute = resolvedRoute.replace(/:view/g, context.viewId);
    }

    return resolvedRoute;
  }
}

export const commandExecutor = new CommandExecutor();
