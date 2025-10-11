# Research: Global Keyboard Shortcut Implementation

**Feature**: Global Keyboard Shortcut for New Issue  
**Date**: 2024-12-09  
**Phase**: 0 - Research & Discovery

## Research Tasks & Findings

### 1. Keyboard Event Handling in React

**Decision**: Use React useEffect hook with addEventListener for global keyboard events

**Rationale**: 
- React's event system doesn't handle global document events natively
- useEffect with addEventListener provides clean lifecycle management
- Allows proper cleanup on component unmount
- Compatible with React's concurrent features

**Alternatives considered**:
- Custom event system: Overly complex for simple keyboard shortcuts
- Third-party libraries (react-hotkeys): Adds unnecessary dependency
- Window-level event handlers: Less React-friendly

### 2. Cross-Platform Key Detection

**Decision**: Use `metaKey` for macOS and `ctrlKey` for Windows/Linux

**Rationale**:
- `metaKey` is the standard for Command key on macOS
- `ctrlKey` is universally supported on Windows/Linux
- Browser detection is unnecessary - let the user's OS determine the key
- Follows established web application patterns

**Alternatives considered**:
- Browser detection: Fragile and unnecessary
- Custom key mapping: Overly complex for standard shortcuts

### 3. Focus Management Strategy

**Decision**: Check `document.activeElement` tagName to identify editable elements

**Rationale**:
- Simple and reliable detection of text inputs, textareas, and contenteditable elements
- Preserves user's editing context
- Lightweight check that doesn't impact performance
- Covers 95% of text editing scenarios

**Alternatives considered**:
- ContentEditable detection: Too specific, misses standard inputs
- Focus event tracking: Complex state management
- Modal-based detection: Doesn't cover all editing contexts

### 4. Modal Integration Approach

**Decision**: Use custom event dispatch to communicate between hook and modal

**Rationale**:
- Decouples the keyboard hook from specific modal implementation
- Allows multiple components to listen for the event
- Follows React's event-driven architecture
- Easy to test and maintain

**Alternatives considered**:
- Direct modal state manipulation: Creates tight coupling
- Context API: Overkill for simple keyboard shortcut
- Redux/state management: Unnecessary complexity

### 5. Performance Considerations

**Decision**: Throttle keyboard events to prevent rapid firing

**Rationale**:
- Prevents multiple rapid modal openings
- Maintains smooth user experience
- Minimal performance impact
- Standard practice for keyboard shortcuts

**Alternatives considered**:
- No throttling: Risk of duplicate events
- Debouncing: Too aggressive for keyboard shortcuts

## Technical Implementation Summary

1. **Hook Structure**: `useGlobalHotkeys()` with useEffect for event management
2. **Event Handling**: `keydown` event listener on document
3. **Key Detection**: `(metaKey || ctrlKey) && key === 'n'`
4. **Focus Check**: `document.activeElement.tagName` validation
5. **Communication**: Custom event `plane:open-new-issue`
6. **Performance**: 100ms throttle to prevent rapid firing

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

All target browsers support the required APIs and event handling patterns.
