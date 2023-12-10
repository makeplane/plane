# @plane/rich-text-editor

## Description

The `@plane/rich-text-editor` package extends from the `editor-core` package, inheriting its base functionality while adding its own unique features of Slash Commands and many more.

## Key Features

- **Exported Components**: There are two components exported from the Rich text editor (with and without Ref), you can choose to use the `withRef` instance whenever you want to control the Editor’s state via a side effect of some external action from within the application code.

  `RichTextEditor` & `RichTextEditorWithRef`

- **Read Only Editor Instances**: We have added a really light weight _Read Only_ Editor instance for the Rich editor types (with and without Ref)
  `RichReadOnlyEditor` &`RichReadOnlyEditorWithRef`

## RichTextEditor

| Prop                            | Type                                                             | Description                                                                                                                                                             |
| ------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `uploadFile`                    | `(file: File) => Promise<string>`                                | A function that handles file upload. It takes a file as input and handles the process of uploading that file.                                                           |
| `deleteFile`                    | `(assetUrlWithWorkspaceId: string) => Promise<any>`              | A function that handles deleting an image. It takes the asset url from your bucket and handles the process of deleting that image.                                      |
| `value`                         | `html string`                                                    | The initial content of the editor.                                                                                                                                      |
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
<RichTextEditor
  uploadFile={fileService.getUploadFileFunction(workspaceSlug)}
  deleteFile={fileService.deleteImage}
  value={value}
  debouncedUpdatesEnabled={true}
  setShouldShowAlert={setShowAlert}
  setIsSubmitting={setIsSubmitting}
  customClassName={isAllowed ? "min-h-[150px] shadow-sm" : "!p-0 !pt-2 text-custom-text-200"}
  noBorder={!isAllowed}
  onChange={(description: Object, description_html: string) => {
    setShowAlert(true);
    setIsSubmitting("submitting");
    onChange(description_html);
    // custom stuff you want to do
  }}
/>
```

2. Example of how to use the `RichTextEditorWithRef` component

```tsx
const editorRef = useRef<any>(null);

// can use it to set the editor's value
editorRef.current?.setEditorValue(`${watch("description_html")}`);

// can use it to clear the editor
editorRef?.current?.clearEditor();

return (
  <RichTextEditorWithRef
    uploadFile={fileService.getUploadFileFunction(workspaceSlug as string)}
    deleteFile={fileService.deleteImage}
    ref={editorRef}
    debouncedUpdatesEnabled={false}
    value={value}
    customClassName="min-h-[150px]"
    onChange={(description: Object, description_html: string) => {
      onChange(description_html);
      // custom stuff you want to do
    }}
  />
);
```

## RichReadOnlyEditor

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
<RichReadOnlyEditor value={issueDetails.description_html} customClassName="p-3 min-h-[50px] shadow-sm" />
```
