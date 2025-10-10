/**
 * Unit tests for keyboard event utilities
 */

import { isEditableElement, getFocusContext, shouldIgnoreKeyboardShortcut } from '../../../core/utils/focus-context';
import { isMacOS, createKeyboardEventDetail, dispatchNewIssueEvent } from '../../../core/utils/custom-events';

describe('focus-context utilities', () => {
  describe('isEditableElement', () => {
    it('should return true for input elements', () => {
      const input = document.createElement('input');
      expect(isEditableElement(input)).toBe(true);
    });

    it('should return true for textarea elements', () => {
      const textarea = document.createElement('textarea');
      expect(isEditableElement(textarea)).toBe(true);
    });

    it('should return true for contentEditable elements', () => {
      const div = document.createElement('div');
      div.setAttribute('contenteditable', 'true');
      expect(isEditableElement(div)).toBe(true);
    });

    it('should return false for non-editable elements', () => {
      const button = document.createElement('button');
      expect(isEditableElement(button)).toBe(false);
    });

    it('should return false for null elements', () => {
      expect(isEditableElement(null)).toBe(false);
    });
  });

  describe('getFocusContext', () => {
    it('should return focus context with correct properties', () => {
      const input = document.createElement('input');
      input.focus();
      
      const context = getFocusContext();
      
      expect(context).toHaveProperty('activeElement');
      expect(context).toHaveProperty('tagName');
      expect(context).toHaveProperty('isEditable');
      expect(context).toHaveProperty('contentEditable');
    });
  });

  describe('shouldIgnoreKeyboardShortcut', () => {
    it('should return true when focused on editable element', () => {
      const input = document.createElement('input');
      input.focus();
      
      expect(shouldIgnoreKeyboardShortcut()).toBe(true);
    });

    it('should return false when focused on non-editable element', () => {
      const button = document.createElement('button');
      button.focus();
      
      expect(shouldIgnoreKeyboardShortcut()).toBe(false);
    });
  });
});

describe('custom-events utilities', () => {
  describe('isMacOS', () => {
    it('should detect macOS platform', () => {
      // Mock navigator.platform
      Object.defineProperty(navigator, 'platform', {
        value: 'MacIntel',
        configurable: true
      });
      
      expect(isMacOS()).toBe(true);
    });

    it('should detect non-macOS platform', () => {
      Object.defineProperty(navigator, 'platform', {
        value: 'Win32',
        configurable: true
      });
      
      expect(isMacOS()).toBe(false);
    });
  });

  describe('createKeyboardEventDetail', () => {
    it('should create event detail with correct structure', () => {
      const detail = createKeyboardEventDetail();
      
      expect(detail).toHaveProperty('source', 'keyboard');
      expect(detail).toHaveProperty('keyCombination');
      expect(detail).toHaveProperty('timestamp');
      expect(detail).toHaveProperty('focusContext');
      expect(detail.focusContext).toHaveProperty('activeElement');
      expect(detail.focusContext).toHaveProperty('isEditable');
    });
  });

  describe('dispatchNewIssueEvent', () => {
    it('should dispatch custom event', () => {
      const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');
      
      dispatchNewIssueEvent();
      
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'plane:open-new-issue'
        })
      );
    });
  });
});
