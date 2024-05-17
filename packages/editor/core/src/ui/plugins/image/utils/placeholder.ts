import { Editor } from "@tiptap/core";
import { EditorState, PluginKey } from "@tiptap/pm/state";
import { DecorationSet, EditorView } from "@tiptap/pm/view";

export function findPlaceholder(uploadKey: PluginKey, state: EditorState, id: string): number | null {
  const decos = uploadKey.getState(state) as DecorationSet;
  const found = decos.find(undefined, undefined, (spec: { id: string }) => spec.id === id);
  return found.length ? found[0].from : null;
}

export function removePlaceholder(uploadKey: PluginKey, editor: Editor, view: EditorView, id: string) {
  const removePlaceholderTr = view.state.tr.setMeta(uploadKey, { remove: { id } });
  view.dispatch(removePlaceholderTr);
  editor.storage.image.uploadInProgress = false;
}
