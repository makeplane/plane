# README for @plane/editor-core

## Description

The `@plane/editor-core` package serves as the foundation for our editor system. It provides the base functionality for our other editor packages, but it will not be used directly in any of the projects but only for extending other editors.

## Utilities

We provide a wide range of utilities for extending the core itself.

1. Merging classes and custom styling
2. Adding new extensions
3. Adding custom props
4. Base menu items, and their commands

This allows for extensive customization and flexibility in the Editors created using our `editor-core` package.

### Here's a detailed overview of what's exported


## Core features

- **Content Trimming**: The Editor’s content is now automatically trimmed of empty line breaks from the start and end before submitting it to the backend. This ensures cleaner, more consistent data.
- **Value Cleaning**: The Editor’s value is cleaned at the editor core level, eliminating the need for additional validation before sending from our app. This results in cleaner code and less potential for errors.
- **Turbo Pipeline**: We have added a turbo pipeline for both dev and build tasks for the editor package. This results in faster, more efficient development and build processes.

## Base extensions included

- BulletList
- OrderedList
- Blockquote
- Code
- Gapcursor
- Link
- Image
- Basic Marks
  - Underline
  - TextStyle
  - Color
- TaskList
- Markdown
- Table