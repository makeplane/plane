import { Editor } from "@tiptap/core";
import { EditorView } from "@tiptap/pm/view";
import { UploadImage } from "src/types/upload-image";
import { uploadKey } from "./constants";
import { uploadAndValidateImage } from "./upload-validate-image-handler";

// utilities
import { v4 as uuidv4 } from "uuid";
import { removePlaceholder, findPlaceholder } from "src/ui/plugins/image/utils/placeholder";
import { isFileValid } from "src/ui/plugins/image/utils/validate-file";

export async function startImageUpload(
  editor: Editor,
  file: File,
  view: EditorView,
  pos: number | null,
  uploadFile: UploadImage
) {
  editor.storage.image.uploadInProgress = true;

  if (!isFileValid(file)) {
    editor.storage.image.uploadInProgress = false;
    return;
  }

  const id = uuidv4();

  const tr = view.state.tr;
  if (!tr.selection.empty) tr.deleteSelection();

  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => {
    tr.setMeta(uploadKey, {
      add: {
        id,
        pos,
        src: reader.result,
      },
    });
    view.dispatch(tr);
  };

  // Handle FileReader errors
  reader.onerror = (error) => {
    console.error("FileReader error: ", error);
    removePlaceholder(uploadKey, editor, view, id);
    return;
  };

  try {
    const src = await uploadAndValidateImage(file, uploadFile);

    if (src == null) {
      throw new Error("Resolved image URL is undefined.");
    }

    const { schema } = view.state;
    pos = findPlaceholder(uploadKey, view.state, id);

    if (pos == null) {
      editor.storage.image.uploadInProgress = false;
      return;
    }
    const imageSrc = typeof src === "object" ? reader.result : src;

    const node = schema.nodes.image.create({ src: imageSrc });

    if (pos < 0 || pos > view.state.doc.content.size) {
      throw new Error("Invalid position to insert the image node.");
    }

    // insert the image node at the position of the placeholder and remove the placeholder
    const transaction = view.state.tr.insert(pos - 1, node).setMeta(uploadKey, { remove: { id } });

    view.dispatch(transaction);
    if (view.hasFocus()) view.focus();
    editor.storage.image.uploadInProgress = false;
  } catch (error) {
    console.log("Error in uploading and inserting image: ", error);
    removePlaceholder(uploadKey, editor, view, id);
  }
}
