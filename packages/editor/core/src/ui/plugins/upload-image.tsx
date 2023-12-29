import { EditorState, Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet, EditorView } from "@tiptap/pm/view";
import { UploadImage } from "src/types/upload-image";

const uploadKey = new PluginKey("upload-image");

export const UploadImagesPlugin = (cancelUploadImage?: () => any) =>
  new Plugin({
    key: uploadKey,
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

          const placeholder = document.createElement("div");
          placeholder.setAttribute("class", "img-placeholder");
          const image = document.createElement("img");
          image.setAttribute("class", "opacity-10 rounded-lg border border-custom-border-300");
          image.src = src;
          placeholder.appendChild(image);

          // Create cancel button
          const cancelButton = document.createElement("button");
          cancelButton.style.position = "absolute";
          cancelButton.style.right = "3px";
          cancelButton.style.top = "3px";
          cancelButton.setAttribute("class", "opacity-90 rounded-lg");

          cancelButton.onclick = () => {
            cancelUploadImage?.();
          };

          // Create an SVG element from the SVG string
          const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x-circle"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>`;
          const parser = new DOMParser();
          const svgElement = parser.parseFromString(svgString, "image/svg+xml").documentElement;

          cancelButton.appendChild(svgElement);
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

function findPlaceholder(state: EditorState, id: {}) {
  const decos = uploadKey.getState(state);
  const found = decos.find(undefined, undefined, (spec: { id: number | undefined }) => spec.id == id);
  return found.length ? found[0].from : null;
}

const removePlaceholder = (view: EditorView, id: {}) => {
  const removePlaceholderTr = view.state.tr.setMeta(uploadKey, {
    remove: { id },
  });
  view.dispatch(removePlaceholderTr);
};

export async function startImageUpload(
  file: File,
  view: EditorView,
  pos: number,
  uploadFile: UploadImage,
  setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void
) {
  if (!file) {
    alert("No file selected. Please select a file to upload.");
    return;
  }

  if (!file.type.includes("image/")) {
    alert("Invalid file type. Please select an image file.");
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert("File size too large. Please select a file smaller than 5MB.");
    return;
  }

  const id = {};

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
    removePlaceholder(view, id);
    return;
  };

  setIsSubmitting?.("submitting");

  try {
    const src = await UploadImageHandler(file, uploadFile);
    const { schema } = view.state;
    pos = findPlaceholder(view.state, id);

    if (pos == null) return;
    const imageSrc = typeof src === "object" ? reader.result : src;

    const node = schema.nodes.image.create({ src: imageSrc });
    const transaction = view.state.tr.insert(pos - 1, node).setMeta(uploadKey, { remove: { id } });

    view.dispatch(transaction);
  } catch (error) {
    console.error("Upload error: ", error);
    removePlaceholder(view, id);
  }
}

const UploadImageHandler = (file: File, uploadFile: UploadImage): Promise<string> => {
  try {
    return new Promise(async (resolve, reject) => {
      try {
        const imageUrl = await uploadFile(file);

        const image = new Image();
        image.src = imageUrl;
        image.onload = () => {
          resolve(imageUrl);
        };
      } catch (error) {
        if (error instanceof Error) {
          console.log(error.message);
        }
        reject(error);
      }
    });
  } catch (error) {
    return Promise.reject(error);
  }
};
