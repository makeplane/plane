/**
 * Client component for providing global keyboard shortcuts
 */

'use client';

import { useGlobalHotkeys } from '../core/hooks/use-global-hotkeys';
import { KeyboardShortcutModalIntegration } from './keyboard-shortcut-modal-integration';
import { KeyboardShortcutTest } from './keyboard-shortcut-test';

export function KeyboardShortcutProvider({ children }: { children: React.ReactNode }) {
  // Initialize the global hotkeys hook
  useGlobalHotkeys({
    enabled: true,
    throttleMs: 100,
    onShortcut: (event) => {
      console.log('🎹 Keyboard shortcut activated:', event.detail);
      console.log('🎹 Event type:', event.type);
      console.log('🎹 Key combination:', event.detail.keyCombination);
    }
  });

  return (
    <>
      {children}
      <KeyboardShortcutModalIntegration />
      <KeyboardShortcutTest />
    </>
  );
}
