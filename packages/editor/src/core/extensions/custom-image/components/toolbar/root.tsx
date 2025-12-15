import type { Editor } from "@tiptap/core";
import { useState } from "react";
// plane imports
import { cn } from "@plane/utils";
// local imports
import type { TCustomImageAlignment } from "../../types";
import { ImageAlignmentAction } from "./alignment";
import { ImageDownloadAction } from "./download";
import { ImageFullScreenActionRoot } from "./full-screen";

type Props = {
  alignment: TCustomImageAlignment;
  editor: Editor;
  aspectRatio: number;
  downloadSrc: string;
  handleAlignmentChange: (alignment: TCustomImageAlignment) => void;
  height: string;
  isTouchDevice: boolean;
  src: string;
  width: string;
};

export function ImageToolbarRoot(props: Props) {
  const { alignment, editor, downloadSrc, handleAlignmentChange, isTouchDevice } = props;
  // states
  const [shouldShowToolbar, setShouldShowToolbar] = useState(false);
  // derived values
  const isEditable = editor.isEditable;

  return (
    <>
      <div
        className={cn(
          "absolute top-1 right-1 h-7 z-20 bg-black/80 rounded-sm flex items-center gap-2 px-2 opacity-0 pointer-events-none group-hover/image-component:opacity-100 group-hover/image-component:pointer-events-auto transition-opacity",
          {
            "opacity-100 pointer-events-auto": shouldShowToolbar,
          }
        )}
      >
        {!isTouchDevice && <ImageDownloadAction src={downloadSrc} />}
        {isEditable && (
          <ImageAlignmentAction
            activeAlignment={alignment}
            handleChange={handleAlignmentChange}
            isTouchDevice={isTouchDevice}
            toggleToolbarViewStatus={setShouldShowToolbar}
          />
        )}
        <ImageFullScreenActionRoot
          image={props}
          isTouchDevice={isTouchDevice}
          toggleToolbarViewStatus={setShouldShowToolbar}
        />
      </div>
    </>
  );
}
