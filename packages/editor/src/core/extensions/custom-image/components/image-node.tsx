import { useEffect, useState } from "react";
import { Node as ProsemirrorNode } from "@tiptap/pm/model";
import { Editor, NodeViewWrapper } from "@tiptap/react";
// extensions
import { CustomImageBlock, CustomImageUploader, ImageAttributes } from "@/extensions/custom-image";

export type CustomImageNodeViewProps = {
  localImage: string | undefined;
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

  const [isUploaded, setIsUploaded] = useState(!!node.attrs.src);
  const [localImage, setLocalImage] = useState<string | undefined>(undefined);

  // the image is already uploaded if the image-component node has src attribute
  useEffect(() => {
    if (node.attrs.src) {
      setIsUploaded(true);
    }
  }, [node.attrs.src]);

  return (
    <NodeViewWrapper>
      <div className="p-0 mx-0 my-2" data-drag-handle>
        {isUploaded || localImage ? (
          <CustomImageBlock
            localImage={localImage}
            editor={editor}
            getPos={getPos}
            node={node}
            updateAttributes={updateAttributes}
            selected={selected}
          />
        ) : (
          <CustomImageUploader
            updateAttributes={updateAttributes}
            setIsUploaded={setIsUploaded}
            node={node}
            editor={editor}
            setLocalImage={setLocalImage}
            selected={selected}
          />
        )}
      </div>
    </NodeViewWrapper>
  );
};
