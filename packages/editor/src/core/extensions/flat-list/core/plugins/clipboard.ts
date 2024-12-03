import { type Schema } from "@tiptap/pm/model";
import { Plugin } from "@tiptap/pm/state";

import { ListDOMSerializer } from "../utils/list-serializer";
import { unwrapListSlice } from "../utils/unwrap-list-slice";

/**
 * Serialize list nodes into native HTML list elements (i.e. `<ul>`, `<ol>`) to
 * clipboard. See {@link ListDOMSerializer}.
 *
 * @public @group Plugins
 */
export function createListClipboardPlugin(schema: Schema): Plugin {
  return new Plugin({
    props: {
      clipboardSerializer: ListDOMSerializer.fromSchema(schema),

      transformCopied: unwrapListSlice,
    },
  });
}
