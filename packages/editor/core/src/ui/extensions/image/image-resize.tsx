import { Editor } from "@tiptap/react";
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

  return (
    <>
      <Moveable
        target={document.querySelector(".ProseMirror-selectednode") as any}
        container={null}
        origin={false}
        edge={false}
        throttleDrag={0}
        keepRatio={true}
        resizable={true}
        throttleResize={0}
        onResize={({ target, width, height, delta }: any) => {
          delta[0] && (target!.style.width = `${width}px`);
          delta[1] && (target!.style.height = `${height}px`);
        }}
        onResizeEnd={() => {
          updateMediaSize();
        }}
        scalable={true}
        renderDirections={["w", "e"]}
        onScale={({ target, transform }: any) => {
          target!.style.transform = transform;
        }}
      />
    </>
  );
};
