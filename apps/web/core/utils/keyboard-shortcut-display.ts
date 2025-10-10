/**
 * Utility functions for displaying keyboard shortcuts
 */

/**
 * Get platform-specific keyboard shortcut display text
 */
export function getKeyboardShortcutDisplay(): string {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  return isMac ? '⌘+N' : 'Ctrl+N';
}

/**
 * Get keyboard shortcut tooltip content
 */
export function getKeyboardShortcutTooltip(): string {
  return `Create new work item (${getKeyboardShortcutDisplay()})`;
}
