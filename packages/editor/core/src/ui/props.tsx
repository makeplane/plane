import { EditorProps } from "@tiptap/pm/view";
import { cn } from "src/lib/utils";

export function CoreEditorProps(editorClassName: string): EditorProps {
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
    transformPastedHTML(html) {
      return html.replace(/<img.*?>/g, "");
    },
  };
}
