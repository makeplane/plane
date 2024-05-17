import { Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet, EditorView } from "@tiptap/pm/view";

// utilities
import { v4 as uuidv4 } from "uuid";

// types
import { type UploadImage } from "src/types/upload-image";
import { findPlaceholder, removePlaceholder } from "src/ui/plugins/image/utils/placeholder";
import { isFileValid } from "src/ui/plugins/image/utils/validate-file";
import { uploadAndValidateImage } from "src/ui/plugins/image/upload-validate-image-handler";

// Plugin key for the upload image plugin
const uploadKey = new PluginKey("upload-image");

export const UploadImagesPlugin = (editor: Editor, cancelUploadImage?: () => void) => {
  let currentView: EditorView | null = null;

  const createPlaceholder = (src: string): HTMLElement => {
    const placeholder = document.createElement("div");
    placeholder.setAttribute("class", "img-placeholder");
    const image = document.createElement("img");
    image.setAttribute("class", "opacity-60 rounded-lg border border-custom-border-300");
    image.src = src;
    placeholder.appendChild(image);

    return placeholder;
  };

  const createCancelButton = (id: string): HTMLButtonElement => {
    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.style.position = "absolute";
    cancelButton.style.right = "3px";
    cancelButton.style.top = "3px";
    cancelButton.setAttribute("class", "opacity-90 rounded-lg");

    cancelButton.onclick = () => {
      if (currentView) {
        cancelUploadImage?.();
        removePlaceholder(editor, currentView, id);
      }
    };

    // Create an SVG element from the SVG string
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-circle"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`;
    const parser = new DOMParser();
    const svgElement = parser.parseFromString(svgString, "image/svg+xml").documentElement;

    cancelButton.appendChild(svgElement);

    return cancelButton;
  };

  return new Plugin({
    key: uploadKey,
    view(editorView) {
      currentView = editorView;
      return {
        destroy() {
          currentView = null;
        },
      };
    },
    state: {
      init() {
        return DecorationSet.empty;
      },
      apply(tr, set) {
        set = set.map(tr.mapping, tr.doc);
        // See if the transaction adds or removes any placeholders
        const action = tr.getMeta(uploadKey);
        if (action && action.add) {
          const { id, pos, src } = action.add;

          const placeholder = createPlaceholder(src);
          const cancelButton = createCancelButton(id);

          placeholder.appendChild(cancelButton);

          const deco = Decoration.widget(pos, placeholder, {
            id,
          });
          set = set.add(tr.doc, [deco]);
        } else if (action && action.remove) {
          set = set.remove(set.find(undefined, undefined, (spec) => spec.id == action.remove.id));
        }
        return set;
      },
    },
    props: {
      decorations(state) {
        return this.getState(state);
      },
    },
  });
};

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
    const src = await uploadAndValidateImage(file, uploadFile);

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
    const transaction = view.state.tr.insert(pos - 1, node).setMeta(uploadKey, { remove: { id } });

    view.dispatch(transaction);
    if (view.hasFocus()) view.focus();
    editor.storage.image.uploadInProgress = false;
  } catch (error) {
    console.error("Error in uploading and inserting image: ", error);
    removePlaceholder(editor, view, id);
  }
}
