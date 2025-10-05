import type { TPowerKCommandConfig, TPowerKContext, TPowerKCommandGroup } from "./types";

export interface IPowerKCommandRegistry {
  // Registration
  register(command: TPowerKCommandConfig): void;
  registerMultiple(commands: TPowerKCommandConfig[]): void;

  // Retrieval
  getCommand(id: string): TPowerKCommandConfig | undefined;
  getAllCommands(): TPowerKCommandConfig[];
  getVisibleCommands(ctx: TPowerKContext): TPowerKCommandConfig[];
  getCommandsByGroup(group: TPowerKCommandGroup, ctx: TPowerKContext): TPowerKCommandConfig[];

  // Shortcut lookup
  findByShortcut(key: string): TPowerKCommandConfig | undefined;
  findByKeySequence(sequence: string): TPowerKCommandConfig | undefined;
  findByModifierShortcut(shortcut: string): TPowerKCommandConfig | undefined;

  // Utility
  clear(): void;
}

/**
 * Simple, clean command registry
 * Stores commands and provides lookup by shortcuts, search, etc.
 */
class TPowerKCommandRegistryImpl implements IPowerKCommandRegistry {
  private commands = new Map<string, TPowerKCommandConfig>();
  private shortcutMap = new Map<string, string>(); // key -> command id
  private keySequenceMap = new Map<string, string>(); // sequence -> command id
  private modifierShortcutMap = new Map<string, string>(); // modifier shortcut -> command id

  // ============================================================================
  // Registration
  // ============================================================================

  register(command: TPowerKCommandConfig): void {
    this.commands.set(command.id, command);

    // Index shortcuts
    if (command.shortcut) {
      this.shortcutMap.set(command.shortcut.toLowerCase(), command.id);
    }

    if (command.keySequence) {
      this.keySequenceMap.set(command.keySequence.toLowerCase(), command.id);
    }

    if (command.modifierShortcut) {
      this.modifierShortcutMap.set(command.modifierShortcut.toLowerCase(), command.id);
    }
  }

  registerMultiple(commands: TPowerKCommandConfig[]): void {
    commands.forEach((command) => this.register(command));
  }

  // ============================================================================
  // Retrieval
  // ============================================================================

  getCommand(id: string): TPowerKCommandConfig | undefined {
    return this.commands.get(id);
  }

  getAllCommands(): TPowerKCommandConfig[] {
    return Array.from(this.commands.values());
  }

  getVisibleCommands(ctx: TPowerKContext): TPowerKCommandConfig[] {
    return Array.from(this.commands.values()).filter((command) => this.isCommandVisible(command, ctx));
  }

  getCommandsByGroup(group: TPowerKCommandGroup, ctx: TPowerKContext): TPowerKCommandConfig[] {
    return this.getVisibleCommands(ctx).filter((command) => command.group === group);
  }

  // ============================================================================
  // Shortcut Lookup
  // ============================================================================

  findByShortcut(key: string): TPowerKCommandConfig | undefined {
    const commandId = this.shortcutMap.get(key.toLowerCase());
    return commandId ? this.commands.get(commandId) : undefined;
  }

  findByKeySequence(sequence: string): TPowerKCommandConfig | undefined {
    const commandId = this.keySequenceMap.get(sequence.toLowerCase());
    return commandId ? this.commands.get(commandId) : undefined;
  }

  findByModifierShortcut(shortcut: string): TPowerKCommandConfig | undefined {
    const commandId = this.modifierShortcutMap.get(shortcut.toLowerCase());
    return commandId ? this.commands.get(commandId) : undefined;
  }

  // ============================================================================
  // Utility
  // ============================================================================

  clear(): void {
    this.commands.clear();
    this.shortcutMap.clear();
    this.keySequenceMap.clear();
    this.modifierShortcutMap.clear();
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private isCommandVisible(command: TPowerKCommandConfig, ctx: TPowerKContext): boolean {
    // Check custom visibility function
    if (command.isVisible && !command.isVisible(ctx)) {
      return false;
    }

    // Check context type filtering
    if ("contextType" in command) {
      // Command requires specific context
      if (!ctx.activeContext || ctx.activeContext !== command.contextType) {
        return false;
      }
    }

    return true;
  }
}

// Export singleton instance
export const commandRegistry = new TPowerKCommandRegistryImpl();
