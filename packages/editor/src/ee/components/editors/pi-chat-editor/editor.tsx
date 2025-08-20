import { EditorContent, useEditor } from "@tiptap/react";
// plane imports
import { cn } from "@plane/utils";
// plane editor imports
import { CORE_EXTENSIONS } from "@/constants/extension";
import { PiChatEditorExtensions } from "@/plane-editor/extensions/pi-chat-editor/extensions";

type IItem = {
  id: string;
  label: string;
  entity_name: string;
  entity_identifier: string;
  target: string;
  redirect_uri: string;
  name?: string;
  project__identifier?: string;
  sequence_id?: string;
  title: string;
  subTitle: string | undefined;
};

export type IMentions = {
  [key: string]: Partial<IItem>[] | undefined;
};

type PiChatEditorProps = {
  className?: string;
  setEditorCommand?: (command: any) => void;
  mentionSuggestions?: (query: string) => Promise<any>;
  handleSubmit?: (e?: any) => void;
  editable?: boolean;
  content?: string;
  editorClass?: string;
};

export const PiChatEditor = (props: PiChatEditorProps) => {
  const {
    className,
    setEditorCommand,
    mentionSuggestions,
    editable = true,
    content = "<p></p>",
    handleSubmit,
    editorClass = "",
  } = props;
  const editor = useEditor({
    editable,
    extensions: PiChatEditorExtensions({
      editorClass,
      handleSubmit,
      mentionSuggestions,
      setEditorCommand,
    }),
    content: content,
  });

  const handleContainerClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (event.target !== event.currentTarget) return;
    if (!editor) return;
    if (!editor.isEditable) return;
    try {
      if (editor.isFocused) return; // If editor is already focused, do nothing

      const { selection } = editor.state;
      const currentNode = selection.$from.node();

      editor?.chain().focus("end", { scrollIntoView: false }).run(); // Focus the editor at the end

      if (
        currentNode.content.size === 0 && // Check if the current node is empty
        !(
          editor.isActive(CORE_EXTENSIONS.ORDERED_LIST) ||
          editor.isActive(CORE_EXTENSIONS.BULLET_LIST) ||
          editor.isActive(CORE_EXTENSIONS.TASK_ITEM) ||
          editor.isActive(CORE_EXTENSIONS.TABLE) ||
          editor.isActive(CORE_EXTENSIONS.BLOCKQUOTE) ||
          editor.isActive(CORE_EXTENSIONS.CODE_BLOCK)
        ) // Check if it's an empty node within an orderedList, bulletList, taskItem, table, quote or code block
      ) {
        return;
      }

      // Get the last node in the document
      const docSize = editor.state.doc.content.size;
      const lastNodePos = editor.state.doc.resolve(Math.max(0, docSize - 2));
      const lastNode = lastNodePos.node();

      // Check if its last node and add new node
      if (lastNode) {
        const isLastNodeEmptyParagraph =
          lastNode.type.name === CORE_EXTENSIONS.PARAGRAPH && lastNode.content.size === 0;
        // Only insert a new paragraph if the last node is not an empty paragraph and not a doc node
        if (!isLastNodeEmptyParagraph && lastNode.type.name !== "doc") {
          const endPosition = editor?.state.doc.content.size;
          editor?.chain().insertContentAt(endPosition, { type: "paragraph" }).focus("end").run();
        }
      }
    } catch (error) {
      console.error("An error occurred while handling container click to insert new empty node at bottom:", error);
    }
  };

  if (!editor) return null;

  return (
    <div
      onClick={handleContainerClick}
      className={cn("w-full text-base editor-container", className, {
        "max-h-[185px] overflow-y-scroll": editable,
      })}
    >
      <div onFocus={() => editor?.chain().focus(undefined, { scrollIntoView: false }).run()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
