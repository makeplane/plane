import { Editor } from "@tiptap/core";
import { useEditorState } from "@tiptap/react";

type Props = {
  editor: Editor;
  nodeId: string;
};

export const ImageUploadStatus: React.FC<Props> = (props) => {
  const { editor, nodeId } = props;
  // subscribe to image upload status
  const uploadStatus: number | undefined = useEditorState({
    editor,
    selector: ({ editor }) => editor.storage.imageComponent.assetsUploadStatus[nodeId],
  });

  if (uploadStatus === undefined) return null;

  return (
    <div className="absolute top-1 right-1 z-20 bg-black/60 rounded text-xs font-medium w-10 text-center">
      {uploadStatus}%
    </div>
  );
};
