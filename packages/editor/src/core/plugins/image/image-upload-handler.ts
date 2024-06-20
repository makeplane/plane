import { Editor } from "@tiptap/core";
import { EditorView } from "@tiptap/pm/view";
import { v4 as uuidv4 } from "uuid";
// plugins
import { findPlaceholder, isFileValid, removePlaceholder, uploadKey } from "@/plugins/image";
// types
import { UploadImage } from "@/types";

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
    removePlaceholder(editor, view, id);
    return;
  };

  try {
    const fileNameTrimmed = trimFileName(file.name);
    const fileWithTrimmedName = new File([file], fileNameTrimmed, { type: file.type });

    const resolvedPos = view.state.doc.resolve(pos ?? 0);
    const nodeBefore = resolvedPos.nodeBefore;

    // if the image is at the start of the line i.e. when nodeBefore is null
    if (nodeBefore === null) {
      if (pos) {
        // so that the image is not inserted at the next line, else incase the
        // image is inserted at any line where there's some content, the
        // position is kept as it is to be inserted at the next line
        pos -= 1;
      }
    }

    view.focus();

    const src = await uploadAndValidateImage(fileWithTrimmedName, uploadFile);

    if (src == null) {
      throw new Error("Resolved image URL is undefined.");
    }

    const { schema } = view.state;
    pos = findPlaceholder(view.state, id);

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
    const transaction = view.state.tr.insert(pos, node).setMeta(uploadKey, { remove: { id } });

    view.dispatch(transaction);

    editor.storage.image.uploadInProgress = false;
  } catch (error) {
    console.error("Error in uploading and inserting image: ", error);
    removePlaceholder(editor, view, id);
  }
}

async function uploadAndValidateImage(file: File, uploadFile: UploadImage): Promise<string | undefined> {
  try {
    const imageUrl = await uploadFile(file);

    if (imageUrl == null) {
      throw new Error("Image URL is undefined.");
    }

    await new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.src = imageUrl;
      image.onload = () => {
        resolve();
      };
      image.onerror = (error) => {
        console.error("Error in loading image: ", error);
        reject(error);
      };
    });

    return imageUrl;
  } catch (error) {
    console.error("Error in uploading image: ", error);
    // throw error to remove the placeholder
    throw error;
  }
}

function trimFileName(fileName: string, maxLength = 100) {
  if (fileName.length > maxLength) {
    const extension = fileName.split(".").pop();
    const nameWithoutExtension = fileName.slice(0, -(extension?.length ?? 0 + 1));
    const allowedNameLength = maxLength - (extension?.length ?? 0) - 1; // -1 for the dot
    return `${nameWithoutExtension.slice(0, allowedNameLength)}.${extension}`;
  }

  return fileName;
}
