# @plane/rich-text-editor

## Description

The `@plane/lite-text-editor` package extends from the `editor-core` package, inheriting its base functionality while adding its own unique features and primarily powers the comment editor.

## Key Features

- **Comment Editor**: A new Comment editor (lite-text-editor). This editor includes a fixed menu and has built-in support for toggling access modifiers, adding marks, images, tables and lists.
- **Exported Components**: There are two components exported from each type of Editor (with and without Ref), you can choose to use the `withRef` instance whenever you want to control the Editor’s state via a side effect of some external action from within the application code.
- **Read Only Editor Instances**: We have added a really light weight `Read Only` Editor instance for both the Rich and Lite editor types.
- **WorkspaceSlug Removal**: There is no longer a need to pass in WorkspaceSlug to the Editor Instance. This simplifies the process of using our editor instances.

## Props

| Prop | Type | Description |
| --- | --- | --- |
| `uploadFile` | `UploadImage` | A function that handles file upload. It takes a file as input and handles the process of uploading that file. |
| `deleteFile` | `DeleteImage` | A function that handles deleting an image. It takes the workspaceImageIdSlug as input and handles the process of deleting that image. |
| `value` | `string` | The initial content of the editor. |
| `debouncedUpdatesEnabled` | `boolean` | If set to true, the `onChange` event handler is debounced, meaning it will only be invoked after the specified delay (default 1500ms) once the user has stopped typing. |
| `onChange` | `(json: any, html: string) => void` | This function is invoked whenever the content of the editor changes. It is passed the new content in both JSON and HTML formats. |
| `setIsSubmitting` | `(isSubmitting: "submitting" \| "submitted" \| "saved") => void` | This function is called to update the submission status. |
| `setShouldShowAlert` | `(showAlert: boolean) => void` | This function is used to show or hide an alert incase of content not being "saved". |
| `noBorder` | `boolean` | If set to true, the editor will not have a border. |
| `borderOnFocus` | `boolean` | If set to true, the editor will show a border when it is focused. |
| `customClassName` | `string` | This is a custom CSS class that can be applied to the editor. |
| `editorContentCustomClassNames` | `string` | This is a custom CSS class that can be applied to the editor content. |

## Usage

Here is an example of how to use the `LiteTextEditor` component:

```jsx
<LiteTextEditor
  uploadFile={fileService.uploadFile}
  deleteFile={fileService.deleteImage}
  value={value}
  debouncedUpdatesEnabled={true}
  setShouldShowAlert={setShowAlert}
  setIsSubmitting={setIsSubmitting}
  customClassName={
    isAllowed ? "min-h-[150px] shadow-sm" : "!p-0 !pt-2 text-custom-text-200"
  }
  noBorder={!isAllowed}
  onChange={(description: Object, description_html: string) => {
    setShowAlert(true);
    setIsSubmitting("submitting");
    onChange(description_html);
    handleSubmit(handleDescriptionFormSubmit)().finally(() =>
      setIsSubmitting("submitted")
    );
  }}
/>
```
