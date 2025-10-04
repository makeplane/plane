"use client";

import {
  CommandConfig,
  CommandExecutionContext,
  CommandStep,
  CommandContext,
  StepExecutionResult,
} from "./power-k/types";

/**
 * CommandExecutor handles the execution of commands with multi-step flows.
 * It orchestrates step execution, context passing, and navigation.
 */
export class CommandExecutor {
  /**
   * Execute a command with its configured steps or action
   */
  async executeCommand(command: CommandConfig, executionContext: CommandExecutionContext): Promise<void> {
    // Check if command is enabled
    if (command.isEnabled && !command.isEnabled(executionContext.context)) {
      console.warn(`Command ${command.id} is not enabled`);
      return;
    }

    // Execute based on configuration
    if (command.steps && command.steps.length > 0) {
      await this.executeSteps(command.steps, executionContext);
    } else if (command.action) {
      // Fallback to simple action
      command.action(executionContext);
    } else {
      console.warn(`Command ${command.id} has no execution strategy`);
    }
  }

  /**
   * Execute a sequence of steps
   */
  private async executeSteps(steps: CommandStep[], executionContext: CommandExecutionContext): Promise<void> {
    let currentContext = { ...executionContext.context };

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      // Check step condition
      if (step.condition && !step.condition(currentContext)) {
        continue; // Skip this step
      }

      // Execute the step
      const result = await this.executeStep(step, {
        ...executionContext,
        context: currentContext,
      });

      // Update context if step provided updates
      if (result.updatedContext) {
        currentContext = {
          ...currentContext,
          ...result.updatedContext,
        };
        executionContext.updateContext(result.updatedContext);
      }

      // If step says to close palette, do it
      if (result.closePalette) {
        executionContext.closePalette();
        return;
      }

      // If step says not to continue, stop
      if (!result.continue) {
        return;
      }
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(
    step: CommandStep,
    executionContext: CommandExecutionContext
  ): Promise<StepExecutionResult> {
    switch (step.type) {
      case "navigate":
        return this.executeNavigateStep(step, executionContext);

      case "action":
        return this.executeActionStep(step, executionContext);

      case "modal":
        return this.executeModalStep(step, executionContext);

      case "select-project":
      case "select-cycle":
      case "select-module":
      case "select-issue":
      case "select-page":
      case "select-view":
      case "select-state":
      case "select-priority":
      case "select-assignee":
        return this.executeSelectionStep(step, executionContext);

      default:
        console.warn(`Unknown step type: ${step.type}`);
        return { continue: true };
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
   */
  private async executeSelectionStep(
    step: CommandStep,
    executionContext: CommandExecutionContext
  ): Promise<StepExecutionResult> {
    // Map step type to page identifier
    const pageMap: Record<string, string> = {
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
    if (step.placeholder) {
      executionContext.setPlaceholder(step.placeholder);
    }
    executionContext.setSearchTerm("");
    executionContext.setPages((pages) => [...pages, pageId]);

    // Selection steps are interactive - they don't continue automatically
    // The selection will be handled by the UI component and will trigger
    // the next step when a selection is made
    return { continue: false };
  }

  /**
   * Resolve route parameters using context values
   */
  private resolveRouteParameters(route: string, context: CommandContext): string {
    let resolvedRoute = route;

    // Replace :workspace with workspaceSlug
    if (context.workspaceSlug) {
      resolvedRoute = resolvedRoute.replace(/:workspace/g, context.workspaceSlug);
    }

    // Replace :project with projectId
    if (context.projectId) {
      resolvedRoute = resolvedRoute.replace(/:project/g, context.projectId);
    }

    // Replace :issue with issueId
    if (context.issueId) {
      resolvedRoute = resolvedRoute.replace(/:issue/g, context.issueId);
    }

    // Replace :cycle with cycleId
    if (context.cycleId) {
      resolvedRoute = resolvedRoute.replace(/:cycle/g, context.cycleId);
    }

    // Replace :module with moduleId
    if (context.moduleId) {
      resolvedRoute = resolvedRoute.replace(/:module/g, context.moduleId);
    }

    // Replace :page with pageId
    if (context.pageId) {
      resolvedRoute = resolvedRoute.replace(/:page/g, context.pageId);
    }

    // Replace :view with viewId
    if (context.viewId) {
      resolvedRoute = resolvedRoute.replace(/:view/g, context.viewId);
    }

    // Handle stepData replacements
    if (context.stepData) {
      Object.keys(context.stepData).forEach((key) => {
        const placeholder = `:${key}`;
        if (resolvedRoute.includes(placeholder)) {
          resolvedRoute = resolvedRoute.replace(new RegExp(placeholder, "g"), context.stepData![key]);
        }
      });
    }

    return resolvedRoute;
  }
}

export const commandExecutor = new CommandExecutor();
