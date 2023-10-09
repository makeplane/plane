# README for @plane/editor-core

## Description

The `@plane/editor-core` package serves as the foundation for our editor system. It provides the base functionality for our other editor packages, but it will not be used directly in any of the projects.

## Key Features

- **Extensive Utilities**: We provide a wide range of utilities for extending the core itself. These include merging classes, adding new extensions, custom props, menu items, and their commands. This allows for extensive customization and flexibility in the Editors created using our `editor-core` package.
- **Content Trimming**: The Editor’s content is now automatically trimmed of empty line breaks from the start and end before submitting it to the backend. This ensures cleaner, more consistent data.
- **Value Cleaning**: The Editor’s value is cleaned at the editor core level, eliminating the need for additional validation before sending from our app. This results in cleaner code and less potential for errors.
- **Turbo Pipeline**: We have added a turbo pipeline for both dev and build tasks for the editor package. This results in faster, more efficient development and build processes.
