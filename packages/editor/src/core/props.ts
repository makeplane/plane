import { EditorProps } from "@tiptap/pm/view";
// plane utils
import { cn } from "@plane/utils";

type TArgs = {
  editorClassName: string;
};

const stripCommentMarksFromHTML = (html: string): string => {
  const sanitizedHtml = html.replace(/<img.*?>/g, "");

  const wrapper = document.createElement("div");
  wrapper.innerHTML = sanitizedHtml;

  const commentNodes = Array.from(wrapper.querySelectorAll("span[data-comment-id]"));
  commentNodes.forEach((node) => {
    const parentNode = node.parentNode;
    if (!parentNode) return;

    while (node.firstChild) {
      parentNode.insertBefore(node.firstChild, node);
    }

    parentNode.removeChild(node);
  });

  return wrapper.innerHTML;
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
          if (slashCommand) return true;
        }
      },
    },
    transformPastedHTML(html) {
      return stripCommentMarksFromHTML(html);
    },
  };
};
