"use client";

// local imports
import { commandExecutor } from "./command-executor";
import type { CommandConfig, CommandExecutionContext, CommandGroup, CommandContext } from "./power-k/types";

interface ICommandRegistry {
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

/**
 * Enhanced CommandRegistry with context-aware filtering and multi-step execution
 */
export class CommandRegistry implements ICommandRegistry {
  private commands = new Map<string, CommandConfig>();
  private keySequenceMap = new Map<string, string>();
  private shortcutMap = new Map<string, string>();

  // ============================================================================
  // Registration
  // ============================================================================

  register(command: CommandConfig): void {
    this.commands.set(command.id, command);

    if (command.keySequence) {
      this.keySequenceMap.set(command.keySequence, command.id);
    }

    if (command.shortcut) {
      this.shortcutMap.set(command.shortcut, command.id);
    }
  }

  registerMultiple(commands: CommandConfig[]): void {
    commands.forEach((command) => this.register(command));
  }

  // ============================================================================
  // Command Retrieval
  // ============================================================================

  getCommand(id: string): CommandConfig | undefined {
    return this.commands.get(id);
  }

  getCommandByKeySequence(sequence: string): CommandConfig | undefined {
    const commandId = this.keySequenceMap.get(sequence);
    return commandId ? this.commands.get(commandId) : undefined;
  }

  getCommandByShortcut(shortcut: string): CommandConfig | undefined {
    const commandId = this.shortcutMap.get(shortcut);
    return commandId ? this.commands.get(commandId) : undefined;
  }

  getAllCommands(): CommandConfig[] {
    return Array.from(this.commands.values());
  }

  // ============================================================================
  // Context-Aware Filtering
  // ============================================================================

  /**
   * Get all visible commands based on context
   * Filters by visibility, enablement, and route context
   */
  getVisibleCommands(context: CommandContext): CommandConfig[] {
    return Array.from(this.commands.values()).filter((command) => this.isCommandVisible(command, context));
  }

  /**
   * Get commands by group with context filtering
   */
  getCommandsByGroup(group: CommandGroup, context: CommandContext): CommandConfig[] {
    return this.getVisibleCommands(context).filter((command) => command.group === group);
  }

  /**
   * Get contextual commands - commands that are specific to the current route
   * These are commands that only appear when you're on a specific page/entity
   */
  getContextualCommands(context: CommandContext): CommandConfig[] {
    return this.getVisibleCommands(context).filter(
      (command) => command.type === "contextual" || command.showOnRoutes?.length
    );
  }

  /**
   * Check if a command should be visible in the current context
   */
  private isCommandVisible(command: CommandConfig, context: CommandContext): boolean {
    // Check visibility function
    if (command.isVisible && !command.isVisible(context)) {
      return false;
    }

    // Check enabled function
    if (command.isEnabled && !command.isEnabled(context)) {
      return false;
    }

    // Check route-based filtering
    if (!this.isCommandVisibleForRoute(command, context)) {
      return false;
    }

    return true;
  }

  /**
   * Check if command should be visible based on route context
   */
  private isCommandVisibleForRoute(command: CommandConfig, context: CommandContext): boolean {
    const currentRoute = context.routeContext;

    // If command specifies routes to show on
    if (command.showOnRoutes && command.showOnRoutes.length > 0) {
      if (!currentRoute || !command.showOnRoutes.includes(currentRoute)) {
        return false;
      }
    }

    // If command specifies routes to hide on
    if (command.hideOnRoutes && command.hideOnRoutes.length > 0) {
      if (currentRoute && command.hideOnRoutes.includes(currentRoute)) {
        return false;
      }
    }

    return true;
  }

  // ============================================================================
  // Command Execution
  // ============================================================================

  /**
   * Execute a command using the new multi-step executor
   */
  async executeCommand(commandId: string, executionContext: CommandExecutionContext): Promise<void> {
    const command = this.getCommand(commandId);
    if (!command) {
      console.warn(`Command ${commandId} not found`);
      return;
    }

    // Use the command executor for proper multi-step handling
    await commandExecutor.executeCommand(command, executionContext);
  }

  /**
   * Execute a key sequence command
   */
  async executeKeySequence(sequence: string, executionContext: CommandExecutionContext): Promise<boolean> {
    const command = this.getCommandByKeySequence(sequence);
    if (!command) {
      return false;
    }

    if (command.isEnabled && !command.isEnabled(executionContext.context)) {
      return false;
    }

    await commandExecutor.executeCommand(command, executionContext);
    return true;
  }

  /**
   * Execute a shortcut command
   */
  async executeShortcut(shortcut: string, executionContext: CommandExecutionContext): Promise<boolean> {
    const command = this.getCommandByShortcut(shortcut);
    if (!command) {
      return false;
    }

    if (command.isEnabled && !command.isEnabled(executionContext.context)) {
      return false;
    }

    await commandExecutor.executeCommand(command, executionContext);
    return true;
  }

  // ============================================================================
  // Utility
  // ============================================================================

  clear(): void {
    this.commands.clear();
    this.keySequenceMap.clear();
    this.shortcutMap.clear();
  }
}

export const commandRegistry = new CommandRegistry();
