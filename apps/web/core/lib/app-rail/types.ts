/**
 * Type definitions for app-rail visibility context
 */

export interface IAppRailVisibilityContext {
  /**
   * Whether the app rail is enabled
   */
  isEnabled: boolean;

  /**
   * Whether the app rail is collapsed (user preference from localStorage)
   */
  isCollapsed: boolean;

  /**
   * Computed property: whether the app rail should actually render
   * True only if isEnabled && !isCollapsed
   */
  shouldRenderAppRail: boolean;

  /**
   * Toggle the collapse state of the app rail
   */
  toggleAppRail: () => void;
}
