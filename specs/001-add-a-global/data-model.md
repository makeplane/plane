# Data Model: Global Keyboard Shortcut

**Feature**: Global Keyboard Shortcut for New Issue  
**Date**: 2024-12-09  
**Phase**: 1 - Design & Contracts

## Entities

### KeyboardShortcut

**Purpose**: Represents a global keyboard shortcut configuration

**Attributes**:
- `key`: string - The key being pressed (e.g., 'n')
- `metaKey`: boolean - Whether Command key is pressed (macOS)
- `ctrlKey`: boolean - Whether Ctrl key is pressed (Windows/Linux)
- `shiftKey`: boolean - Whether Shift key is pressed (not used in this feature)
- `altKey`: boolean - Whether Alt key is pressed (not used in this feature)
- `eventType`: string - Type of keyboard event ('keydown', 'keyup')

### FocusContext

**Purpose**: Tracks the current focus state to determine if shortcut should be ignored

**Attributes**:
- `activeElement`: HTMLElement - Currently focused DOM element
- `tagName`: string - Tag name of focused element ('INPUT', 'TEXTAREA', etc.)
- `isEditable`: boolean - Whether the focused element is editable
- `contentEditable`: boolean - Whether element has contentEditable attribute

### ModalState

**Purpose**: Manages the state of the New Issue modal (existing entity, enhanced)

**Attributes**:
- `isOpen`: boolean - Whether the modal is currently open
- `triggerSource`: string - What triggered the modal ('button', 'keyboard', 'api')
- `previousFocus`: HTMLElement - Element that had focus before modal opened

## State Transitions

### KeyboardShortcut State Flow

```
Idle → KeyPressed → Validated → Dispatched → Idle
  ↓         ↓           ↓           ↓
  └─ Invalid Key ──────┴─ Focus Conflict ──┘
```

1. **Idle**: No keyboard input detected
2. **KeyPressed**: User presses key combination
3. **Validated**: Check if key combination matches and focus allows it
4. **Dispatched**: Custom event sent to modal system
5. **Idle**: Return to waiting state

### ModalState Enhancement

```
Closed → Opening → Open → Closing → Closed
  ↓         ↓        ↓        ↓
  └─ Keyboard Trigger ───────┘
```

The existing modal state is enhanced to track the trigger source, allowing the keyboard shortcut to open the modal without interfering with existing button-based flows.

## Validation Rules

### KeyboardShortcut Validation

- **Key Combination**: Must be exactly ⌘+N (macOS) or Ctrl+N (Windows/Linux)
- **Event Type**: Must be 'keydown' event
- **Focus Check**: Must not be triggered when focused on editable elements
- **Throttling**: Must not fire more than once per 100ms

### FocusContext Validation

- **Editable Elements**: INPUT, TEXTAREA, elements with contentEditable="true"
- **Special Cases**: Code editors, rich text editors, terminal-like interfaces
- **Exclusions**: Buttons, links, non-interactive elements

## Integration Points

### Existing Modal System

- **Event Listener**: Modal component listens for 'plane:open-new-issue' custom event
- **State Management**: Integrates with existing modal state management
- **Focus Management**: Preserves existing focus restoration behavior

### UI Components

- **Button Tooltips**: Enhanced to show keyboard shortcut hint
- **Help Documentation**: Updated to include keyboard shortcuts section
- **Accessibility**: Maintains existing ARIA labels and keyboard navigation
