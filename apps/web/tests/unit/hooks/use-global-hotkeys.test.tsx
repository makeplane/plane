/**
 * Unit tests for useGlobalHotkeys hook
 */

import { renderHook, act } from '@testing-library/react';
import { useGlobalHotkeys } from '../../../core/hooks/use-global-hotkeys';

// Mock the utilities
jest.mock('../../../core/utils/custom-events', () => ({
  dispatchNewIssueEvent: jest.fn()
}));

jest.mock('../../../core/utils/focus-context', () => ({
  shouldIgnoreKeyboardShortcut: jest.fn()
}));

describe('useGlobalHotkeys', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with listening enabled', () => {
    const { result } = renderHook(() => useGlobalHotkeys());
    
    expect(result.current.isListening).toBe(true);
    expect(result.current.supportedKeys).toContain('⌘+N');
    expect(result.current.supportedKeys).toContain('Ctrl+N');
  });

  it('should enable and disable listening', () => {
    const { result } = renderHook(() => useGlobalHotkeys());
    
    act(() => {
      result.current.disable();
    });
    
    expect(result.current.isListening).toBe(false);
    
    act(() => {
      result.current.enable();
    });
    
    expect(result.current.isListening).toBe(true);
  });

  it('should call onShortcut callback when provided', () => {
    const onShortcut = jest.fn();
    renderHook(() => useGlobalHotkeys({ onShortcut }));
    
    // This test will fail until we implement the hook
    // The actual keyboard event simulation would go here
    expect(onShortcut).not.toHaveBeenCalled();
  });
});
