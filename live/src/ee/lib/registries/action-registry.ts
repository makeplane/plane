import { DocumentAction } from "@/ee/types/common";

/**
 * Registry of actions that can be performed on the document
 */
export class ActionRegistry {
  private static actions: Map<string, DocumentAction> = new Map();

  /**
   * Register a new action
   */
  static register(action: DocumentAction): void {
    this.actions.set(action.name, action);
  }

  /**
   * Get an action by name
   */
  static get(name: string): DocumentAction | undefined {
    return this.actions.get(name);
  }

  /**
   * Get all registered actions
   */
  static getAll(): DocumentAction[] {
    return Array.from(this.actions.values());
  }
}
