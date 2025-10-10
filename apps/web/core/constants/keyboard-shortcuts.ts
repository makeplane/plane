/**
 * Keyboard shortcut constants and configurations
 */

export const KEYBOARD_SHORTCUTS = {
  NEW_ISSUE: {
    key: 'i',
    macKey: 'metaKey',
    windowsKey: 'ctrlKey'
  }
} as const;

export const KEYBOARD_CONFIG = {
  THROTTLE_MS: 100,
  EVENT_TYPE: 'keydown' as const
} as const;

export const CUSTOM_EVENTS = {
  OPEN_NEW_ISSUE: 'plane:open-new-issue'
} as const;
