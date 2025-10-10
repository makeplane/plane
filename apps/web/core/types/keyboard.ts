/**
 * TypeScript types for keyboard shortcut functionality
 */

export interface KeyboardEventDetail {
  source: 'keyboard';
  keyCombination: 'meta+n' | 'ctrl+n';
  timestamp: number;
  focusContext: {
    activeElement: string;
    isEditable: boolean;
  };
}

export interface PlaneOpenNewIssueEvent extends CustomEvent {
  type: 'plane:open-new-issue';
  detail: KeyboardEventDetail;
}

export interface UseGlobalHotkeysOptions {
  enabled?: boolean;
  throttleMs?: number;
  onShortcut?: (event: PlaneOpenNewIssueEvent) => void;
}

export interface UseGlobalHotkeysReturn {
  isListening: boolean;
  supportedKeys: string[];
  enable: () => void;
  disable: () => void;
}

export interface FocusContext {
  activeElement: HTMLElement | null;
  tagName: string;
  isEditable: boolean;
  contentEditable: boolean;
}
