import { useEffect, useRef, useState } from "react";
import { Editor, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
// extensions
import { CustomImageBlock, CustomImageUploader, ImageAttributes } from "@/extensions/custom-image";

export type CustomImageComponentProps = {
  getPos: () => number;
  editor: Editor;
  node: NodeViewProps["node"] & {
    attrs: ImageAttributes;
  };
  updateAttributes: (attrs: ImageAttributes) => void;
  selected: boolean;
};

export type CustomImageNodeViewProps = NodeViewProps & CustomImageComponentProps;

export const CustomImageNode = (props: CustomImageNodeViewProps) => {
  const { getPos, editor, node, updateAttributes, selected } = props;
  const { src: remoteImageSrc } = node.attrs;

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
    if (remoteImageSrc) {
      setIsUploaded(true);
      setImageFromFileSystem(undefined);
    } else {
      setIsUploaded(false);
    }
  }, [remoteImageSrc]);

  return (
    <NodeViewWrapper>
      <div className="p-0 mx-0 my-2" data-drag-handle ref={imageComponentRef}>
        {(isUploaded || imageFromFileSystem) && !failedToLoadImage ? (
          <CustomImageBlock
            imageFromFileSystem={imageFromFileSystem}
            editorContainer={editorContainer}
            editor={editor}
            // @ts-expect-error function not expected here, but will still work
            src={editor?.commands?.getImageSource?.(remoteImageSrc)}
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
            maxFileSize={editor.storage.imageComponent.maxFileSize}
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
