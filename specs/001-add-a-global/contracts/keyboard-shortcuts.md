# API Contract: Keyboard Shortcuts

**Feature**: Global Keyboard Shortcut for New Issue  
**Date**: 2024-12-09  
**Type**: Frontend Event Contract

## Event Contract

### Custom Event: `plane:open-new-issue`

**Purpose**: Dispatched when the global keyboard shortcut is activated

**Event Details**:
```typescript
interface PlaneOpenNewIssueEvent extends CustomEvent {
  type: 'plane:open-new-issue';
  detail: {
    source: 'keyboard';
    keyCombination: 'meta+n' | 'ctrl+n';
    timestamp: number;
    focusContext: {
      activeElement: string; // tagName of focused element
      isEditable: boolean;
    };
  };
}
```

**Event Dispatch**:
```typescript
// Triggered by useGlobalHotkeys hook
window.dispatchEvent(new CustomEvent('plane:open-new-issue', {
  detail: {
    source: 'keyboard',
    keyCombination: isMac ? 'meta+n' : 'ctrl+n',
    timestamp: Date.now(),
    focusContext: {
      activeElement: document.activeElement?.tagName || 'UNKNOWN',
      isEditable: isEditableElement(document.activeElement)
    }
  }
}));
```

**Event Consumption**:
```typescript
// Listened to by modal components
window.addEventListener('plane:open-new-issue', (event) => {
  const { source, keyCombination, focusContext } = event.detail;
  
  // Open modal if not already open
  if (!isModalOpen) {
    openNewIssueModal({
      triggerSource: source,
      preserveFocus: focusContext.isEditable
    });
  }
});
```

## Hook Contract

### `useGlobalHotkeys()`

**Purpose**: React hook for managing global keyboard shortcuts

**Interface**:
```typescript
interface UseGlobalHotkeysOptions {
  enabled?: boolean;
  throttleMs?: number;
  onShortcut?: (event: PlaneOpenNewIssueEvent) => void;
}

interface UseGlobalHotkeysReturn {
  isListening: boolean;
  supportedKeys: string[];
  enable: () => void;
  disable: () => void;
}

function useGlobalHotkeys(options?: UseGlobalHotkeysOptions): UseGlobalHotkeysReturn;
```

**Usage**:
```typescript
// In root layout component
const { isListening, supportedKeys } = useGlobalHotkeys({
  enabled: true,
  throttleMs: 100,
  onShortcut: (event) => {
    console.log('Shortcut activated:', event.detail);
  }
});
```

## Component Contracts

### Enhanced Button Component

**Purpose**: Button component with keyboard shortcut tooltip support

**Props Extension**:
```typescript
interface ButtonProps {
  // ... existing props
  keyboardShortcut?: {
    key: string;
    metaKey?: boolean;
    ctrlKey?: boolean;
    tooltip?: string;
  };
}

// Usage
<Button 
  onClick={openNewIssueModal}
  keyboardShortcut={{
    key: 'n',
    metaKey: true, // Shows ⌘+N on macOS
    ctrlKey: true, // Shows Ctrl+N on Windows/Linux
    tooltip: "New Issue (⌘ + N / Ctrl + N)"
  }}
>
  New Issue
</Button>
```

### Modal Integration Contract

**Purpose**: Contract for integrating with existing modal system

**Required Methods**:
```typescript
interface ModalSystem {
  // Existing methods
  isOpen: boolean;
  open: (options?: ModalOptions) => void;
  close: () => void;
  
  // Enhanced for keyboard shortcuts
  openWithKeyboard: (event: PlaneOpenNewIssueEvent) => void;
  preserveFocus: boolean;
}
```

## Error Handling Contract

### Keyboard Event Errors

**Error Types**:
```typescript
interface KeyboardShortcutError extends Error {
  code: 'INVALID_KEY_COMBINATION' | 'FOCUS_CONFLICT' | 'THROTTLE_EXCEEDED';
  keyCombination: string;
  focusContext: FocusContext;
  timestamp: number;
}
```

**Error Handling**:
```typescript
// Graceful degradation
try {
  handleKeyboardShortcut(event);
} catch (error) {
  if (error.code === 'FOCUS_CONFLICT') {
    // Log but don't show user error - this is expected behavior
    console.debug('Keyboard shortcut ignored due to focus conflict');
  } else {
    // Handle unexpected errors
    console.error('Keyboard shortcut error:', error);
  }
}
```

## Testing Contract

### Unit Test Interface

```typescript
// Mock implementation for testing
interface MockKeyboardEvent {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  preventDefault: () => void;
}

// Test utilities
function simulateKeyPress(key: string, options?: Partial<MockKeyboardEvent>): void;
function mockActiveElement(tagName: string, isEditable?: boolean): void;
function expectEventDispatched(eventType: string, detail?: any): void;
```

### Integration Test Contract

```typescript
// End-to-end test interface
interface KeyboardShortcutTest {
  setup: () => Promise<void>;
  simulateShortcut: (platform: 'mac' | 'windows') => Promise<void>;
  verifyModalOpened: () => Promise<boolean>;
  verifyFocusPreserved: () => Promise<boolean>;
  cleanup: () => Promise<void>;
}
```
