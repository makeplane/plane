import { useState } from "react";
import { Editor } from "@tiptap/react";
import Moveable from "react-moveable";

export const ImageResizer = ({ editor }: { editor: Editor }) => {
  const updateMediaSize = () => {
    const imageInfo = document.querySelector(".ProseMirror-selectednode") as HTMLImageElement;
    if (imageInfo) {
      const selection = editor.state.selection;

      // Use the style width/height if available, otherwise fall back to the element's natural width/height
      const width = imageInfo.style.width
        ? Number(imageInfo.style.width.replace("px", ""))
        : imageInfo.getAttribute("width");
      const height = imageInfo.style.height
        ? Number(imageInfo.style.height.replace("px", ""))
        : imageInfo.getAttribute("height");

      editor.commands.setImage({
        src: imageInfo.src,
        width: width,
        height: height,
      } as any);
      editor.commands.setNodeSelection(selection.from);
    }
  };

  const [aspectRatio, setAspectRatio] = useState(1);

  return (
    <>
      <Moveable
        target={document.querySelector(".ProseMirror-selectednode") as HTMLElement}
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
        onResize={({ target, width, height, delta }) => {
          if (delta[0] || delta[1]) {
            let newWidth, newHeight;
            if (delta[0]) {
              // Width change detected
              newWidth = Math.max(width, 100);
              newHeight = newWidth / aspectRatio;
            } else if (delta[1]) {
              // Height change detected
              newHeight = Math.max(height, 100);
              newWidth = newHeight * aspectRatio;
            }
            target.style.width = `${newWidth}px`;
            target.style.height = `${newHeight}px`;
          }
        }}
        onResizeEnd={() => {
          updateMediaSize();
        }}
        scalable
        renderDirections={["se"]}
        onScale={({ target, transform }) => {
          target.style.transform = transform;
        }}
      />
    </>
  );
};
