import { Editor } from "@tiptap/react";
import Moveable from "react-moveable";

export const ImageResizer = ({ editor }: { editor: Editor }) => {
  const updateMediaSize = () => {
    const imageInfo = document.querySelector(
      ".ProseMirror-selectednode",
    ) as HTMLImageElement;
    if (imageInfo) {
      const selection = editor.state.selection;
      editor.commands.setImage({
        src: imageInfo.src,
        width: Number(imageInfo.style.width.replace("px", "")),
        height: Number(imageInfo.style.height.replace("px", "")),
      });
      editor.commands.setNodeSelection(selection.from);
    }
  };

  return (
    <>
      <Moveable
        target={document.querySelector(".ProseMirror-selectednode") as any}
        container={null}
        origin={false}
        /* Resize event edges */
        edge={false}
        throttleDrag={0}
        /* When resize or scale, keeps a ratio of the width, height. */
        keepRatio={true}
        /* resizable*/
        /* Only one of resizable, scalable, warpable can be used. */
        resizable={true}
        throttleResize={0}
        onResize={({
          target,
          width,
          height,
          // dist,
          delta,
        }: // direction,
          // clientX,
          // clientY,
          any) => {
          delta[0] && (target!.style.width = `${width}px`);
          delta[1] && (target!.style.height = `${height}px`);
        }}
        // { target, isDrag, clientX, clientY }: any
        onResizeEnd={() => {
          updateMediaSize();
        }}
        /* scalable */
        /* Only one of resizable, scalable, warpable can be used. */
        scalable={true}
        throttleScale={0}
        /* Set the direction of resizable */
        renderDirections={["w", "e"]}
        onScale={({
          target,
          // scale,
          // dist,
          // delta,
          transform,
        }: // clientX,
          // clientY,
          any) => {
          target!.style.transform = transform;
        }}
      />
    </>
  );
};

