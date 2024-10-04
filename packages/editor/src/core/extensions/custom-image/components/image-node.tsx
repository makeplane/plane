import { useEffect, useRef, useState } from "react";
import { Node as ProsemirrorNode } from "@tiptap/pm/model";
import { Editor, NodeViewWrapper } from "@tiptap/react";
// extensions
import { CustomImageBlock, CustomImageUploader, ImageAttributes } from "@/extensions/custom-image";

export type CustomImageNodeViewProps = {
  getPos: () => number;
  editor: Editor;
  node: ProsemirrorNode & {
    attrs: ImageAttributes;
  };
  updateAttributes: (attrs: Record<string, any>) => void;
  selected: boolean;
};

export const CustomImageNode = (props: CustomImageNodeViewProps) => {
  const { getPos, editor, node, updateAttributes, selected } = props;

  const [isUploaded, setIsUploaded] = useState(false);
  const [imageFromFileSystem, setImageFromFileSystem] = useState<string | undefined>(undefined);
  const [failedToLoadImage, setFailedToLoadImage] = useState(false);

  const [editorContainer, setEditorContainer] = useState<HTMLDivElement | null>(null);
  const imageComponentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closestEditorContainer = imageComponentRef.current?.closest(".editor-container");
    if (!closestEditorContainer) {
      console.error("Editor container not found");
      return;
    }

    setEditorContainer(closestEditorContainer as HTMLDivElement);
  }, []);

  // the image is already uploaded if the image-component node has src attribute
  // and we need to remove the blob from our file system
  useEffect(() => {
    const remoteImageSrc = node.attrs.src;
    if (remoteImageSrc) {
      setIsUploaded(true);
      setImageFromFileSystem(undefined);
    } else {
      setIsUploaded(false);
    }
  }, [node.attrs.src]);

  return (
    <NodeViewWrapper>
      <div className="p-0 mx-0 my-2" data-drag-handle ref={imageComponentRef}>
        {(isUploaded || imageFromFileSystem) && !failedToLoadImage ? (
          <CustomImageBlock
            imageFromFileSystem={imageFromFileSystem}
            editorContainer={editorContainer}
            editor={editor}
            getPos={getPos}
            node={node}
            setEditorContainer={setEditorContainer}
            setFailedToLoadImage={setFailedToLoadImage}
            selected={selected}
            updateAttributes={updateAttributes}
          />
        ) : (
          <CustomImageUploader
            editor={editor}
            failedToLoadImage={failedToLoadImage}
            getPos={getPos}
            loadImageFromFileSystem={setImageFromFileSystem}
            node={node}
            setIsUploaded={setIsUploaded}
            selected={selected}
            updateAttributes={updateAttributes}
          />
        )}
      </div>
    </NodeViewWrapper>
  );
};
