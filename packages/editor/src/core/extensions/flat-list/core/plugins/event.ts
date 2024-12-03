import { Plugin } from "@tiptap/pm/state";

import { handleListMarkerMouseDown } from "../dom-events";

/**
 * Handle DOM events for list.
 *
 * @public @group Plugins
 */
export function createListEventPlugin(): Plugin {
  return new Plugin({
    props: {
      handleDOMEvents: {
        mousedown: (view, event) => handleListMarkerMouseDown({ view, event }),
      },
    },
  });
}
