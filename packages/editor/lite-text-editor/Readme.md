# @plane/lite-text-editor

## Description

The `@plane/lite-text-editor` package extends from the `editor-core` package, inheriting its base functionality while adding its own unique features of Custom control over Enter key, etc.

## Key Features

- **Exported Components**: There are two components exported from the Lite text editor (with and without Ref), you can choose to use the `withRef` instance whenever you want to control the Editor’s state via a side effect of some external action from within the application code.

  `LiteTextEditor` & `LiteTextEditorWithRef`

- **Read Only Editor Instances**: We have added a really light weight _Read Only_ Editor instance for the Lite editor types (with and without Ref)
  `LiteReadOnlyEditor` &`LiteReadOnlyEditorWithRef`

## LiteTextEditor

| Prop                            | Type                                                             | Description                                                                                                                                                             |
| ------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uploadFile`                    | `(file: File) => Promise<string>`                                | A function that handles file upload. It takes a file as input and handles the process of uploading that file.                                                           |
| `deleteFile`                    | `(assetUrlWithWorkspaceId: string) => Promise<any>`              | A function that handles deleting an image. It takes the asset url from your bucket and handles the process of deleting that image.                                      |
| `value`                         | `html string`                                                    | The initial content of the editor.                                                                                                                                      |
| `onEnterKeyPress`               | `(e) => void`                                                    | The event that happens on Enter key press                                                                                                                               |
| `debouncedUpdatesEnabled`       | `boolean`                                                        | If set to true, the `onChange` event handler is debounced, meaning it will only be invoked after the specified delay (default 1500ms) once the user has stopped typing. |
| `onChange`                      | `(json: any, html: string) => void`                              | This function is invoked whenever the content of the editor changes. It is passed the new content in both JSON and HTML formats.                                        |
| `setIsSubmitting`               | `(isSubmitting: "submitting" \| "submitted" \| "saved") => void` | This function is called to update the submission status.                                                                                                                |
| `setShouldShowAlert`            | `(showAlert: boolean) => void`                                   | This function is used to show or hide an alert incase of content not being "saved".                                                                                     |
| `noBorder`                      | `boolean`                                                        | If set to true, the editor will not have a border.                                                                                                                      |
| `borderOnFocus`                 | `boolean`                                                        | If set to true, the editor will show a border when it is focused.                                                                                                       |
| `customClassName`               | `string`                                                         | This is a custom CSS class that can be applied to the editor.                                                                                                           |
| `editorContentCustomClassNames` | `string`                                                         | This is a custom CSS class that can be applied to the editor content.                                                                                                   |

### Usage

1. Here is an example of how to use the `RichTextEditor` component

```tsx
<LiteTextEditor
  onEnterKeyPress={handleSubmit(handleCommentUpdate)}
  uploadFile={fileService.getUploadFileFunction(workspaceSlug)}
  deleteFile={fileService.deleteImage}
  value={value}
  debouncedUpdatesEnabled={false}
  customClassName="min-h-[50px] p-3 shadow-sm"
  onChange={(comment_json: Object, comment_html: string) => {
    onChange(comment_html);
  }}
/>
```

2. Example of how to use the `LiteTextEditorWithRef` component

```tsx
const editorRef = useRef<any>(null);

// can use it to set the editor's value
editorRef.current?.setEditorValue(`${watch("description_html")}`);

// can use it to clear the editor
editorRef?.current?.clearEditor();

return (
  <LiteTextEditorWithRef
    onEnterKeyPress={handleSubmit(handleCommentUpdate)}
    uploadFile={fileService.getUploadFileFunction(workspaceSlug)}
    deleteFile={fileService.deleteImage}
    ref={editorRef}
    value={value}
    debouncedUpdatesEnabled={false}
    customClassName="min-h-[50px] p-3 shadow-sm"
    onChange={(comment_json: Object, comment_html: string) => {
      onChange(comment_html);
    }}
  />
);
```

## LiteReadOnlyEditor

| Prop                            | Type          | Description                                                           |
| ------------------------------- | ------------- | --------------------------------------------------------------------- |
| `value`                         | `html string` | The initial content of the editor.                                    |
| `noBorder`                      | `boolean`     | If set to true, the editor will not have a border.                    |
| `borderOnFocus`                 | `boolean`     | If set to true, the editor will show a border when it is focused.     |
| `customClassName`               | `string`      | This is a custom CSS class that can be applied to the editor.         |
| `editorContentCustomClassNames` | `string`      | This is a custom CSS class that can be applied to the editor content. |

### Usage

Here is an example of how to use the `RichReadOnlyEditor` component

```tsx
<LiteReadOnlyEditor
  value={comment.comment_html}
  customClassName="text-xs border border-custom-border-200 bg-custom-background-100"
/>
```
