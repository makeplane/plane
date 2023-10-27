# @plane/editor-core

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

1. useEditor - A hook that you can use to extend the Plane editor.

    | Prop | Type | Description |
    | --- | --- | --- |
    | `extensions` | `Extension[]` | An array of custom extensions you want to add into the editor to extend it's core features |
    | `editorProps` | `EditorProps` | Extend the editor props by passing in a custom props object |
    | `uploadFile` | `(file: File) => Promise<string>` | A function that handles file upload. It takes a file as input and handles the process of uploading that file. |
    | `deleteFile` | `(assetUrlWithWorkspaceId: string) => Promise<any>` | A function that handles deleting an image. It takes the asset url from your bucket and handles the process of deleting that image. |
    | `value` | `html string` | The initial content of the editor. |
    | `debouncedUpdatesEnabled` | `boolean` | If set to true, the `onChange` event handler is debounced, meaning it will only be invoked after the specified delay (default 1500ms) once the user has stopped typing. |
    | `onChange` | `(json: any, html: string) => void` | This function is invoked whenever the content of the editor changes. It is passed the new content in both JSON and HTML formats. |
    | `setIsSubmitting` | `(isSubmitting: "submitting" \| "submitted" \| "saved") => void` | This function is called to update the submission status. |
    | `setShouldShowAlert` | `(showAlert: boolean) => void` | This function is used to show or hide an alert in case of content not being "saved". |
    | `forwardedRef` | `any` | Pass this in whenever you want to control the editor's state from an external component |

2. useReadOnlyEditor - A hook that can be used to extend a Read Only instance of the core editor.

    | Prop | Type | Description |
    | --- | --- | --- |
    | `value` | `string` | The initial content of the editor. |
    | `forwardedRef` | `any` | Pass this in whenever you want to control the editor's state from an external component |
    | `extensions` | `Extension[]` | An array of custom extensions you want to add into the editor to extend it's core features |
    | `editorProps` | `EditorProps` | Extend the editor props by passing in a custom props object |

3. Items and Commands - H1, H2, H3, task list, quote, code block, etc's methods.

4. UI Wrappers

- `EditorContainer` - Wrap your Editor Container with this to apply base classes and styles.
- `EditorContentWrapper` - Use this to get Editor's Content and base menus.

5. Extending with Custom Styles

```ts
const customEditorClassNames = getEditorClassNames({ noBorder, borderOnFocus, customClassName });
```

## Core features

- **Content Trimming**: The Editor’s content is now automatically trimmed of empty line breaks from the start and end before submitting it to the backend. This ensures cleaner, more consistent data.
- **Value Cleaning**: The Editor’s value is cleaned at the editor core level, eliminating the need for additional validation before sending from our app. This results in cleaner code and less potential for errors.
- **Turbo Pipeline**: Added a turbo pipeline for both dev and build tasks for projects depending on the editor package.

```json
    "web#develop": {
      "cache": false,
      "persistent": true,
      "dependsOn": [
        "@plane/lite-text-editor#build",
        "@plane/rich-text-editor#build"
      ]
    },
    "space#develop": {
      "cache": false,
      "persistent": true,
      "dependsOn": [
        "@plane/lite-text-editor#build",
        "@plane/rich-text-editor#build"
      ]
    },
    "web#build": {
      "cache": true,
      "dependsOn": [
        "@plane/lite-text-editor#build",
        "@plane/rich-text-editor#build"
      ]
    },
    "space#build": {
      "cache": true,
      "dependsOn": [
        "@plane/lite-text-editor#build",
        "@plane/rich-text-editor#build"
      ]
    },

```

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
