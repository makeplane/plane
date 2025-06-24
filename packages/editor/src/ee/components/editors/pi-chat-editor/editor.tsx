import { EditorContent, useEditor } from "@tiptap/react";
// plane imports
import { cn } from "@plane/utils";
// plane editor imports
import { PiChatEditorExtensions } from "@/plane-editor/extensions/pi-chat-editor/extensions";

interface IItem {
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
}

export interface IMentions {
  [key: string]: Partial<IItem>[] | undefined;
}

type PiChatEditorProps = {
  setEditorCommand?: (command: any) => void;
  mentionSuggestions?: (query: string) => Promise<any>;
  handleSubmit?: (e?: any) => void;
  editable?: boolean;
  content?: string;
  editorClass?: string;
};

export const PiChatEditor = (props: PiChatEditorProps) => {
  const {
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

  if (!editor) return null;

  return (
    <div
      className={cn("w-full m-auto text-base", {
        "max-h-[185px] overflow-y-scroll": editable,
      })}
    >
      <EditorContent editor={editor} />
    </div>
  );
};
