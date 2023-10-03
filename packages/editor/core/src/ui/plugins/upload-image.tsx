import { UploadImage } from "../../types/upload-image";
import { EditorState, Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet, EditorView } from "@tiptap/pm/view";

const uploadKey = new PluginKey("upload-image");

const UploadImagesPlugin = () =>
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
          const deco = Decoration.widget(pos + 1, placeholder, {
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

export default UploadImagesPlugin;

function findPlaceholder(state: EditorState, id: {}) {
  const decos = uploadKey.getState(state);
  const found = decos.find(
    undefined,
    undefined,
    (spec: { id: number | undefined }) => spec.id == id
  );
  return found.length ? found[0].from : null;
}

export async function startImageUpload(
  file: File,
  view: EditorView,
  pos: number,
  uploadFile: UploadImage,
  setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void
) {
  if (!file.type.includes("image/")) {
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

  setIsSubmitting?.("submitting");
  const src = await UploadImageHandler(file, uploadFile);
  const { schema } = view.state;
  pos = findPlaceholder(view.state, id);

  if (pos == null) return;
  const imageSrc = typeof src === "object" ? reader.result : src;

  const node = schema.nodes.image.create({ src: imageSrc });
  const transaction = view.state.tr
    .replaceWith(pos, pos, node)
    .setMeta(uploadKey, { remove: { id } });
  view.dispatch(transaction);
}

const UploadImageHandler = (file: File,
  uploadFile: UploadImage
): Promise<string> => {
  try {
    return new Promise(async (resolve, reject) => {
      try {
        const imageUrl = await uploadFile(file)

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
    if (error instanceof Error) {
      console.log(error.message);
    }
    return Promise.reject(error);
  }
};
