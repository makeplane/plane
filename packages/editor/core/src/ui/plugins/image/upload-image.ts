import { Editor } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet, EditorView } from "@tiptap/pm/view";

// utils
import { removePlaceholder } from "src/ui/plugins/image/utils/placeholder";

// constants
import { uploadKey } from "src/ui/plugins/image/constants";

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
