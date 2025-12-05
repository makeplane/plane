import { DOMParser } from "@tiptap/pm/model";
import type { EditorProps } from "@tiptap/pm/view";
// plane utils
import { cn } from "@plane/utils";
// helpers
import { processAssetDuplication } from "@/helpers/paste-asset";

type TArgs = {
  editorClassName: string;
};

export const CoreEditorProps = (props: TArgs): EditorProps => {
  const { editorClassName } = props;

  return {
    attributes: {
      class: cn(
        "prose prose-brand max-w-full prose-headings:font-display font-default focus:outline-none",
        editorClassName
      ),
    },
    handleDOMEvents: {
      keydown: (_view, event) => {
        // prevent default event listeners from firing when slash command is active
        if (["ArrowUp", "ArrowDown", "Enter"].includes(event.key)) {
          const slashCommand = document.querySelector("#slash-command");
          if (slashCommand) {
            return true;
          }
        }
      },
    },
    handlePaste: (view, event) => {
      if (!event.clipboardData) return false;

      const htmlContent = event.clipboardData.getData("text/plane-editor-html");
      if (!htmlContent) return false;

      // Process the HTML content using the registry
      const { processedHtml, hasChanges } = processAssetDuplication(htmlContent);
      if (!hasChanges) return false;

      event.preventDefault();

      // Parse the processed HTML and insert it
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = processedHtml;
      const slice = DOMParser.fromSchema(view.state.schema).parseSlice(tempDiv);
      const tr = view.state.tr.replaceSelection(slice);
      view.dispatch(tr);

      return true;
    },
  };
};
