import { useEffect, useRef, useState } from "react";
import { Editor, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
// extensions
import { CustomImageBlock, CustomImageUploader, ImageAttributes } from "@/extensions/custom-image";

export type CustoBaseImageNodeViewProps = {
  getPos: () => number;
  editor: Editor;
  node: NodeViewProps["node"] & {
    attrs: ImageAttributes;
  };
  updateAttributes: (attrs: Partial<ImageAttributes>) => void;
  selected: boolean;
};

export type CustomImageNodeProps = NodeViewProps & CustoBaseImageNodeViewProps;

export const CustomImageNode = (props: CustomImageNodeProps) => {
  const { getPos, editor, node, updateAttributes, selected } = props;
  const { src: imgNodeSrc } = node.attrs;

  const [isUploaded, setIsUploaded] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>(undefined);
  const [imageFromFileSystem, setImageFromFileSystem] = useState<string | undefined>(undefined);
  const [failedToLoadImage, setFailedToLoadImage] = useState(false);

  const [editorContainer, setEditorContainer] = useState<HTMLDivElement | null>(null);
  const imageComponentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closestEditorContainer = imageComponentRef.current?.closest(".editor-container");
    if (closestEditorContainer) {
      setEditorContainer(closestEditorContainer as HTMLDivElement);
    }
  }, []);

  // the image is already uploaded if the image-component node has src attribute
  // and we need to remove the blob from our file system
  useEffect(() => {
    if (resolvedSrc) {
      setIsUploaded(true);
      setImageFromFileSystem(undefined);
    } else {
      setIsUploaded(false);
    }
  }, [resolvedSrc]);

  useEffect(() => {
    const getImageSource = async () => {
      // @ts-expect-error function not expected here, but will still work and don't remove await
      const url: string = await editor?.commands?.getImageSource?.(imgNodeSrc);
      setResolvedSrc(url as string);
    };
    getImageSource();
  }, [imgNodeSrc]);

  return (
    <NodeViewWrapper>
      <div className="p-0 mx-0 my-2" data-drag-handle ref={imageComponentRef}>
        {(isUploaded || imageFromFileSystem) && !failedToLoadImage ? (
          <CustomImageBlock
            imageFromFileSystem={imageFromFileSystem}
            editorContainer={editorContainer}
            editor={editor}
            src={resolvedSrc}
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
