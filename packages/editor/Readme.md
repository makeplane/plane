# @plane/editor

## Description

The `@plane/editor` package is Plane's rich text editor, built on [Tiptap](https://tiptap.dev/). It ships ready-to-use React editors that the apps import directly (for example `apps/web` and `apps/space`), plus helpers, constants and types for building on top of them.

## Entry points

| Import                 | What it contains                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| `@plane/editor`        | React editors, helpers, constants, extension lists and types                                         |
| `@plane/editor/lib`    | Framework-free pieces: core extensions without props, document collaboration events, Yjs utilities   |
| `@plane/editor/server` | Node entry (used by `apps/live`): everything in `lib` plus HTML/JSON/Yjs document conversion helpers |
| `@plane/editor/styles` | Editor CSS (also available as `@plane/editor/styles.css`)                                            |

### Here's a detailed overview of what's exported

1. Editors - React components with a forwarded ref (`EditorRefApi`) to control the editor from outside:
   - `RichTextEditorWithRef` (`IRichTextEditorProps`)
   - `LiteTextEditorWithRef` (`ILiteTextEditorProps`), used for comments
   - `DocumentEditorWithRef` (`IDocumentEditorProps`)
   - `CollaborativeDocumentEditorWithRef` (`ICollaborativeDocumentEditorProps`), real-time editing through `apps/live`

2. Common props (`IEditorProps` in `src/types/editor.ts`). The most important ones:

   | Prop                                       | Type                                                                              | Description                                                      |
   | ------------------------------------------ | --------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
   | `id`                                       | `string`                                                                          | Unique id of the editor instance                                 |
   | `initialValue` / `value`                   | `string`                                                                          | Initial and controlled HTML content                              |
   | `editable`                                 | `boolean`                                                                         | Whether the content can be edited                                |
   | `onChange`                                 | `(json: object, html: string, options?: { isMigrationUpdate?: boolean }) => void` | Called whenever the content changes, with JSON and HTML          |
   | `fileHandler`                              | `TFileHandler`                                                                    | Upload, delete, restore and resolve assets (images, attachments) |
   | `mentionHandler`                           | `TMentionHandler`                                                                 | Search and render `@` mentions                                   |
   | `disabledExtensions` / `flaggedExtensions` | `TExtensions[]`                                                                   | Turn extensions off, or mark them as behind a feature flag       |
   | `extensions`                               | `Extensions`                                                                      | Extra Tiptap extensions to add                                   |
   | `editorProps`                              | `EditorProps`                                                                     | Extra ProseMirror editor props                                   |
   | `forwardedRef`                             | `React.MutableRefObject<EditorRefApi \| null>`                                    | Ref used to control the editor from an external component        |
   | `containerClassName` / `editorClassName`   | `string`                                                                          | Extra classes for the container and the editable area            |
   | `placeholder`                              | `string \| ((isFocused: boolean, value: string) => string)`                       | Placeholder text                                                 |

3. Extension lists - `CORE_EXTENSIONS`, `ADDITIONAL_EXTENSIONS` and the `TrailingNode` extension.

4. Extending with Custom Styles

```ts
const customEditorClassNames = getEditorClassNames({
  noBorder,
  borderOnFocus,
  containerClassName,
});
```

The internal `EditorContainer` and `EditorContentWrapper` components (in `src/components/editors`) apply these classes; they are not exported from the package.

## Core features

- **Content Trimming**: The Editor’s content is now automatically trimmed of empty line breaks from the start and end before submitting it to the backend. This ensures cleaner, more consistent data.
- **Value Cleaning**: The Editor’s value is cleaned at the editor core level, eliminating the need for additional validation before sending from our app. This results in cleaner code and less potential for errors.
- **Turbo Pipeline**: Added a turbo pipeline for both dev and build tasks for projects depending on the editor package.

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
