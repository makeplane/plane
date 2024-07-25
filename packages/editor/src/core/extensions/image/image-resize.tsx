import { useState } from "react";
import { Editor } from "@tiptap/react";
import Moveable from "react-moveable";

type Props = {
  editor: Editor;
  id: string;
};

const getImageElement = (editorId: string): HTMLImageElement | null =>
  document.querySelector(`#editor-container-${editorId}.active-editor .ProseMirror-selectednode`);

export const ImageResizer = (props: Props) => {
  const { editor, id } = props;
  // states
  const [aspectRatio, setAspectRatio] = useState(1);

  const updateMediaSize = () => {
    const imageElement = getImageElement(id);

    if (!imageElement) return;

    const selection = editor.state.selection;

    // Use the style width/height if available, otherwise fall back to the element's natural width/height
    const width = imageElement.style.width
      ? Number(imageElement.style.width.replace("px", ""))
      : imageElement.getAttribute("width");
    const height = imageElement.style.height
      ? Number(imageElement.style.height.replace("px", ""))
      : imageElement.getAttribute("height");

    editor.commands.setImage({
      src: imageElement.src,
      width: width,
      height: height,
    } as any);
    editor.commands.setNodeSelection(selection.from);
  };

  return (
    <Moveable
      target={getImageElement(id)}
      container={null}
      origin={false}
      edge={false}
      throttleDrag={0}
      keepRatio
      resizable
      throttleResize={0}
      onResizeStart={() => {
        const imageElement = getImageElement(id);
        if (imageElement) {
          const originalWidth = Number(imageElement.width);
          const originalHeight = Number(imageElement.height);
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
  );
};
