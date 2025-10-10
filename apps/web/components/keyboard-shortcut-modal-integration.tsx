/**
 * Modal integration for keyboard shortcuts
 */

'use client';

import { useEffect } from 'react';
import { useCommandPalette } from '../core/hooks/store/use-command-palette';
import { CUSTOM_EVENTS } from '../core/constants/keyboard-shortcuts';

export function KeyboardShortcutModalIntegration() {
  const {
    isCreateIssueModalOpen,
    toggleCreateIssueModal
  } = useCommandPalette();

  useEffect(() => {
    const handleKeyboardShortcut = () => {
      console.log('🎯 Modal integration received keyboard shortcut event');
      console.log('🎯 Current modal state:', isCreateIssueModalOpen);
      
      // Open the modal if it's not already open
      if (!isCreateIssueModalOpen) {
        console.log('🎯 Opening new issue modal...');
        toggleCreateIssueModal(true);
      } else {
        console.log('🎯 Modal already open, not opening duplicate');
      }
    };

    // Listen for the custom event from our keyboard shortcut
    window.addEventListener(CUSTOM_EVENTS.OPEN_NEW_ISSUE, handleKeyboardShortcut);

    return () => {
      window.removeEventListener(CUSTOM_EVENTS.OPEN_NEW_ISSUE, handleKeyboardShortcut);
    };
  }, [isCreateIssueModalOpen, toggleCreateIssueModal]);

  // Don't render any modal - let the existing IssueLevelModals handle it
  return null;
}
