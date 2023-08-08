import { useEditor, EditorContent } from '@tiptap/react';
import { useDebouncedCallback } from 'use-debounce';
import { EditorBubbleMenu } from './EditorBubbleMenu';
import { TiptapExtensions } from './extensions';
import { TiptapEditorProps } from './props';

type TiptapProps = {
  value: string;
  noBorder?: boolean;
  borderOnFocus?: boolean;
  customClassName?: string;
  onChange?: (json: any, html: string) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
}

const Tiptap = ({ onChange, setIsSubmitting, value, noBorder, borderOnFocus, customClassName }: TiptapProps) => {
  const editor = useEditor({
    editorProps: TiptapEditorProps,
    extensions: TiptapExtensions,
    content: value,
    onUpdate: async ({ editor }) => {
      setIsSubmitting(true);
      debouncedUpdates({ onChange, editor });
    }
  });

  const debouncedUpdates = useDebouncedCallback(async ({ onChange, editor }) => {
    setTimeout(async () => {
      if (onChange) {
        onChange(editor.getJSON(), editor.getHTML());
      }
    }, 500);
  }, 1000);

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
      {editor && <EditorBubbleMenu editor={editor} />}
      <div className="pt-8">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default Tiptap;
