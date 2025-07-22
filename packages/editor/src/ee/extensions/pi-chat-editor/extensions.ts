import { Extension, type Extensions } from "@tiptap/core";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import StarterKit from "@tiptap/starter-kit";
// extensions
import { CustomCodeBlockExtension } from "@/extensions/code";
import { CustomCodeInlineExtension } from "@/extensions/code-inline";
// helpers
import { getTrimmedHTML } from "@/helpers/common";
// local imports
import { PiChatEditorEnterKeyExtension } from "./enter-key";
import { PiChatEditorMentionExtension } from "./mention/extension";

type Props = {
  editorClass: string;
  handleSubmit?: () => void;
  mentionSuggestions?: (query: string) => Promise<any>;
  setEditorCommand?: (command: any) => void;
};

export const PiChatEditorExtensions = (props: Props): Extensions => {
  const { editorClass, handleSubmit, mentionSuggestions, setEditorCommand } = props;

  return [
    StarterKit.configure({
      bold: false,
      blockquote: false,
      code: false,
      codeBlock: false,
      dropcursor: false,
      gapcursor: false,
      hardBreak: false,
      heading: false,
      horizontalRule: false,
      italic: false,
      paragraph: {
        HTMLAttributes: {
          class: `text-[14px] leading-5 font-normal ${editorClass}`,
        },
      },
      strike: false,
      bulletList: {
        HTMLAttributes: {
          class: "list-disc pl-7 space-y-[--list-spacing-y]",
        },
      },
      orderedList: {
        HTMLAttributes: {
          class: "list-decimal pl-7 space-y-[--list-spacing-y]",
        },
      },
      listItem: {
        HTMLAttributes: {
          class: "not-prose space-y-2",
        },
      },
    }),
    PiChatEditorMentionExtension({
      mentionSuggestions,
    }),
    PiChatEditorEnterKeyExtension(handleSubmit),
    TaskList.configure({
      HTMLAttributes: {
        class: "not-prose pl-2 space-y-2",
      },
    }),
    TaskItem.configure({
      HTMLAttributes: {
        class: "relative",
      },
      nested: true,
    }),
    CustomCodeBlockExtension.configure({
      HTMLAttributes: {
        class: "",
      },
    }),
    CustomCodeInlineExtension,
    Extension.create({
      onUpdate(this) {
        setEditorCommand?.({
          getHTML: () => getTrimmedHTML(this.editor?.getHTML()),
          clear: () => this.editor?.commands.clearContent(),
        });
      },
    }),
  ];
};
