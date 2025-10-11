# Quickstart: Global Keyboard Shortcut

**Feature**: Global Keyboard Shortcut for New Issue  
**Date**: 2024-12-09

## Overview

The global keyboard shortcut allows users to quickly open the New Issue modal from anywhere in the Plane application using a simple key combination.

## Usage

### Basic Usage

**macOS**: Press `⌘ + N`  
**Windows/Linux**: Press `Ctrl + N`

The New Issue modal will open immediately, allowing you to create a new issue without navigating to a specific page.

### Smart Focus Management

The shortcut intelligently handles focus states:

- ✅ **Works normally**: When clicking on buttons, links, or empty areas
- ✅ **Preserves editing**: When typing in text fields, the modal opens without disrupting your text input
- ✅ **Respects context**: When editing in rich text editors or code areas

### Visual Feedback

- **Button Tooltips**: Hover over the "New Issue" button to see the keyboard shortcut hint
- **Consistent Behavior**: The shortcut works the same way across all pages and components

## Examples

### Scenario 1: Quick Issue Creation
1. You're viewing a project dashboard
2. Press `⌘ + N` (or `Ctrl + N`)
3. New Issue modal opens instantly
4. Fill in the issue details and save

### Scenario 2: While Editing
1. You're typing in a text field or comment box
2. Press `⌘ + N` (or `Ctrl + N`)
3. New Issue modal opens
4. Your text input remains intact and focused
5. You can continue editing after closing the modal

### Scenario 3: Discovery
1. Hover over the "New Issue" button
2. See tooltip: "New Issue (⌘ + N / Ctrl + N)"
3. Learn about the keyboard shortcut
4. Use it for faster workflow

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Troubleshooting

### Shortcut Not Working
- Ensure you're pressing the correct key combination for your operating system
- Check that you're not in a text input field (the shortcut is disabled to preserve editing)
- Verify your browser supports the required APIs

### Modal Not Opening
- Check browser console for any JavaScript errors
- Ensure the application is fully loaded
- Try refreshing the page and testing again

### Performance Issues
- The shortcut has built-in throttling to prevent rapid firing
- If experiencing delays, check browser performance and available memory
- Ensure no browser extensions are interfering with keyboard events

## Technical Details

- **Response Time**: <100ms from keypress to modal opening
- **Event Handling**: Uses native DOM events with React integration
- **Focus Management**: Intelligent detection of editable elements
- **Cross-Platform**: Automatic detection of macOS vs Windows/Linux key combinations
