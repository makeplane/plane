"use client";

import { CommandConfig, CommandExecutionContext, CommandGroup } from "./types";

export class CommandRegistry {
  private commands = new Map<string, CommandConfig>();
  private keySequenceMap = new Map<string, string>();
  private shortcutMap = new Map<string, string>();

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

  getVisibleCommands(): CommandConfig[] {
    return Array.from(this.commands.values()).filter((command) => {
      if (command.isVisible && !command.isVisible()) {
        return false;
      }
      if (command.isEnabled && !command.isEnabled()) {
        return false;
      }
      return true;
    });
  }

  getCommandsByGroup(group: CommandGroup): CommandConfig[] {
    return this.getVisibleCommands().filter((command) => command.group === group);
  }

  executeCommand(commandId: string, _executionContext: CommandExecutionContext): void {
    const command = this.getCommand(commandId);
    if (command && (!command.isEnabled || command.isEnabled())) {
      command.action();
    }
  }

  executeKeySequence(sequence: string, _executionContext: CommandExecutionContext): boolean {
    const command = this.getCommandByKeySequence(sequence);
    if (command && (!command.isEnabled || command.isEnabled())) {
      command.action();
      return true;
    }
    return false;
  }

  executeShortcut(shortcut: string, _executionContext: CommandExecutionContext): boolean {
    const command = this.getCommandByShortcut(shortcut);
    if (command && (!command.isEnabled || command.isEnabled())) {
      command.action();
      return true;
    }
    return false;
  }

  getAllCommands(): CommandConfig[] {
    return Array.from(this.commands.values());
  }

  clear(): void {
    this.commands.clear();
    this.keySequenceMap.clear();
    this.shortcutMap.clear();
  }
}

export const commandRegistry = new CommandRegistry();
