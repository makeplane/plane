import { ActionCondition } from "@/plane-live/types/common";

/**
 * Registry of conditions that can be used to determine if an action should be applied
 */
export class ConditionRegistry {
  private static conditions: Map<string, ActionCondition> = new Map();

  /**
   * Register a new condition
   */
  static register(condition: ActionCondition): void {
    this.conditions.set(condition.name, condition);
  }

  /**
   * Get a condition by name
   */
  static get(name: string): ActionCondition | undefined {
    return this.conditions.get(name);
  }

  /**
   * Get all registered conditions
   */
  static getAll(): ActionCondition[] {
    return Array.from(this.conditions.values());
  }
}
