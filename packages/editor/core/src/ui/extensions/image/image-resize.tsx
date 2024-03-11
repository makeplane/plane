import { Editor } from "@tiptap/react";
import { useState } from "react";
import Moveable from "react-moveable";

export const ImageResizer = ({ editor }: { editor: Editor }) => {
  const updateMediaSize = () => {
    const imageInfo = document.querySelector(".ProseMirror-selectednode") as HTMLImageElement;
    if (imageInfo) {
      const selection = editor.state.selection;
      editor.commands.setImage({
        src: imageInfo.src,
        width: Number(imageInfo.style.width.replace("px", "")),
        height: Number(imageInfo.style.height.replace("px", "")),
      } as any);
      editor.commands.setNodeSelection(selection.from);
    }
  };

  const [aspectRatio, setAspectRatio] = useState(1);

  return (
    <>
      <Moveable
        target={document.querySelector(".ProseMirror-selectednode") as any}
        container={null}
        origin={false}
        edge={false}
        throttleDrag={0}
        keepRatio
        resizable
        throttleResize={0}
        onResizeStart={() => {
          const imageInfo = document.querySelector(".ProseMirror-selectednode") as HTMLImageElement;
          if (imageInfo) {
            const originalWidth = Number(imageInfo.width);
            const originalHeight = Number(imageInfo.height);
            setAspectRatio(originalWidth / originalHeight);
          }
        }}
        onResize={({ target, width, height, delta }: any) => {
          if (delta[0]) {
            const newWidth = Math.max(width, 100);
            const newHeight = newWidth / aspectRatio;
            target!.style.width = `${newWidth}px`;
            target!.style.height = `${newHeight}px`;
          }
          if (delta[1]) {
            const newHeight = Math.max(height, 100);
            const newWidth = newHeight * aspectRatio;
            target!.style.height = `${newHeight}px`;
            target!.style.width = `${newWidth}px`;
          }
        }}
        onResizeEnd={() => {
          updateMediaSize();
        }}
        scalable
        renderDirections={["w", "e"]}
        onScale={({ target, transform }: any) => {
          target!.style.transform = transform;
        }}
      />
    </>
  );
};
