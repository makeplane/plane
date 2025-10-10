/**
 * Custom event utilities for keyboard shortcuts
 */

import { PlaneOpenNewIssueEvent, KeyboardEventDetail } from '../types/keyboard';
import { getFocusContext } from './focus-context';

/**
 * Detect if running on macOS
 */
export function isMacOS(): boolean {
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}

/**
 * Create keyboard shortcut event detail
 */
export function createKeyboardEventDetail(): KeyboardEventDetail {
  const focusContext = getFocusContext();
  const keyCombination = isMacOS() ? 'meta+n' : 'ctrl+n';
  
  return {
    source: 'keyboard',
    keyCombination,
    timestamp: Date.now(),
    focusContext: {
      activeElement: focusContext.tagName,
      isEditable: focusContext.isEditable
    }
  };
}

/**
 * Dispatch the plane:open-new-issue custom event
 */
export function dispatchNewIssueEvent(): void {
  const detail = createKeyboardEventDetail();
  
  const event = new CustomEvent('plane:open-new-issue', {
    detail
  }) as PlaneOpenNewIssueEvent;
  
  window.dispatchEvent(event);
}
