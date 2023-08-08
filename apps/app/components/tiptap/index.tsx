import { useEditor, EditorContent } from '@tiptap/react';
import { useDebouncedCallback } from 'use-debounce';
import { EditorBubbleMenu } from './bubble-menu';
import { TiptapExtensions } from './extensions';
import { TiptapEditorProps } from './props';
import { Node } from "@tiptap/pm/model";
import { Editor as CoreEditor } from "@tiptap/core";
import { useCallback, useRef } from 'react';
import { EditorState } from '@tiptap/pm/state';
import fileService from 'services/file.service';

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
      checkForNodeDeletions(editor)
      debouncedUpdates({ onChange, editor });
    }
  });

  const previousState = useRef<EditorState>();

  const extractPath = useCallback((url: string, searchString: string) => {
    if (url.startsWith(searchString)) {
      console.log("chala", url, searchString)
      return url.substring(searchString.length);
    }
  }, []);

  const onNodeDeleted = useCallback(
    async (node: Node) => {
      if (node.type.name === 'image') {
        const assetUrlWithWorkspaceId = new URL(node.attrs.src).pathname.substring(1);
        const resStatus = await fileService.deleteFile(assetUrlWithWorkspaceId);
        if (resStatus === 204) {
          console.log("file deleted successfully");
        }
      }
    },
    [],
  );

  const checkForNodeDeletions = useCallback(
    (editor: CoreEditor) => {
      const prevNodesById: Record<string, Node> = {};
      previousState.current?.doc.forEach((node) => {
        if (node.attrs.id) {
          prevNodesById[node.attrs.id] = node;
        }
      });

      const nodesById: Record<string, Node> = {};
      editor.state?.doc.forEach((node) => {
        if (node.attrs.id) {
          nodesById[node.attrs.id] = node;
        }
      });

      previousState.current = editor.state;

      for (const [id, node] of Object.entries(prevNodesById)) {
        if (nodesById[id] === undefined) {
          onNodeDeleted(node);
        }
      }
    },
    [onNodeDeleted],
  );

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
