/**
 * Focus context utilities for keyboard shortcut management
 */

import { FocusContext } from '../types/keyboard';

/**
 * Check if an element is editable (text input, textarea, contentEditable)
 */
export function isEditableElement(element: HTMLElement | null): boolean {
  if (!element) return false;
  
  const tagName = element.tagName.toLowerCase();
  const contentEditable = element.getAttribute('contenteditable') === 'true';
  
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    contentEditable
  );
}

/**
 * Get current focus context
 */
export function getFocusContext(): FocusContext {
  const activeElement = document.activeElement as HTMLElement;
  const tagName = activeElement?.tagName || 'UNKNOWN';
  const isEditable = isEditableElement(activeElement);
  const contentEditable = activeElement?.getAttribute('contenteditable') === 'true';
  
  return {
    activeElement,
    tagName,
    isEditable,
    contentEditable
  };
}

/**
 * Check if keyboard shortcut should be ignored due to focus
 */
export function shouldIgnoreKeyboardShortcut(): boolean {
  const focusContext = getFocusContext();
  return focusContext.isEditable;
}
