import Placeholder from '@tiptap/extension-placeholder';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { EditorBubbleMenu } from './EditorBubbleMenu';
import { TiptapEditorProps } from "./props";

type TiptapProps = {
  value: string;
  noBorder?: boolean;
  borderOnFocus?: boolean;
  customClassName?: string;
}

const Tiptap = ({ value, noBorder, borderOnFocus, customClassName }: TiptapProps) => {
  const editor = useEditor({
    editorProps: TiptapEditorProps,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Description...',
      })
    ],
    content: value,
  });

  const editorClassNames = `mt-2 p-3 relative focus:outline-none rounded-md focus:border-custom-border-200 
      ${noBorder ? '' : 'border border-custom-border-200'
    } ${borderOnFocus ? 'focus:border border-custom-border-200' : 'focus:border-0'
    } ${customClassName}`;

  return (
    <div
      onClick={() => {
        editor?.chain().focus().run();
      }}
      className={`tiptap-editor-container relative min-h-[150px] ${editorClassNames}`}
    >
      <EditorContent editor={editor} />
    </div>
  );
};

export default Tiptap;
