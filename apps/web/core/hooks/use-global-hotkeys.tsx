/**
 * React hook for managing global keyboard shortcuts
 */

import { useEffect, useState, useCallback } from 'react';
import { UseGlobalHotkeysOptions, UseGlobalHotkeysReturn, PlaneOpenNewIssueEvent } from '../types/keyboard';
import { dispatchNewIssueEvent } from '../utils/custom-events';
import { shouldIgnoreKeyboardShortcut } from '../utils/focus-context';
import { createThrottledKeyboardHandler } from '../utils/throttle';
import { KEYBOARD_SHORTCUTS, KEYBOARD_CONFIG } from '../constants/keyboard-shortcuts';

export function useGlobalHotkeys(options: UseGlobalHotkeysOptions = {}): UseGlobalHotkeysReturn {
  const {
    enabled = true,
    throttleMs = KEYBOARD_CONFIG.THROTTLE_MS,
    onShortcut
  } = options;

  const [isListening, setIsListening] = useState(enabled);

  const handleKeyboardEvent = useCallback((event: KeyboardEvent) => {
    // Check if the key combination matches our shortcut
    const isTargetKey = event.key.toLowerCase() === KEYBOARD_SHORTCUTS.NEW_ISSUE.key;
    const isMacShortcut = event.metaKey && !event.ctrlKey;
    const isWindowsShortcut = event.ctrlKey && !event.metaKey;
    
    console.log('🔍 Keyboard event detected:', {
      key: event.key,
      metaKey: event.metaKey,
      ctrlKey: event.ctrlKey,
      isTargetKey,
      isMacShortcut,
      isWindowsShortcut
    });
    
    if (!isTargetKey || (!isMacShortcut && !isWindowsShortcut)) {
      console.log('🔍 Not our target shortcut, ignoring');
      return;
    }

    // Ignore if focused on editable element
    if (shouldIgnoreKeyboardShortcut()) {
      console.log('🔍 Focused on editable element, ignoring');
      return;
    }

    console.log('✅ Triggering keyboard shortcut!');
    
    // Prevent default browser behavior
    event.preventDefault();

    // Dispatch the custom event
    dispatchNewIssueEvent();

    // Call optional callback
    if (onShortcut) {
      // Create event detail for callback
      const eventDetail = {
        type: 'plane:open-new-issue' as const,
        detail: {
          source: 'keyboard' as const,
          keyCombination: event.metaKey ? 'meta+i' as const : 'ctrl+i' as const,
          timestamp: Date.now(),
          focusContext: {
            activeElement: document.activeElement?.tagName || 'UNKNOWN',
            isEditable: shouldIgnoreKeyboardShortcut()
          }
        }
      } as PlaneOpenNewIssueEvent;

      onShortcut(eventDetail);
    }
  }, [onShortcut]);

  const throttledHandler = useCallback(
    createThrottledKeyboardHandler(handleKeyboardEvent, throttleMs),
    [handleKeyboardEvent, throttleMs]
  );

  const enable = useCallback(() => {
    setIsListening(true);
  }, []);

  const disable = useCallback(() => {
    setIsListening(false);
  }, []);

  useEffect(() => {
    if (!isListening) {
      return;
    }

    document.addEventListener(KEYBOARD_CONFIG.EVENT_TYPE, throttledHandler);

    return () => {
      document.removeEventListener(KEYBOARD_CONFIG.EVENT_TYPE, throttledHandler);
    };
  }, [isListening, throttledHandler]);

  return {
    isListening,
    supportedKeys: ['⌘+I', 'Ctrl+I'],
    enable,
    disable
  };
}
