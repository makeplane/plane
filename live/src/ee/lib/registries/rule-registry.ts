import { ActionRule } from "@/plane-live/types/common"

/**
 * Registry of rules that determine which actions to apply based on conditions
 */
export class RuleRegistry {
  private static rules: ActionRule[] = [];

  /**
   * Register a new rule
   */
  static register(rule: ActionRule): void {
    this.rules.push(rule);
    // Sort rules by priority (higher priority first)
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get all registered rules
   */
  static getAll(): ActionRule[] {
    return this.rules;
  }
}
