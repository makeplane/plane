import { useState } from "react";
// plane imports
import { cn } from "@plane/utils";
// local imports
import type { CustomImageExtensionOptions, TCustomImageAlignment } from "../../types";
import { ImageAlignmentAction } from "./alignment";
import { ImageDownloadAction } from "./download";
import { ImageFullScreenActionRoot } from "./full-screen";

type Props = {
  alignment: TCustomImageAlignment;
  aspectRatio: number;
  downloadSrc: string;
  extensionOptions: CustomImageExtensionOptions;
  handleAlignmentChange: (alignment: TCustomImageAlignment) => void;
  height: string;
  src: string;
  width: string;
};

export const ImageToolbarRoot: React.FC<Props> = (props) => {
  const { alignment, downloadSrc, extensionOptions, handleAlignmentChange } = props;
  // states
  const [shouldShowToolbar, setShouldShowToolbar] = useState(false);
  // derived values
  const { isTouchDevice } = extensionOptions;

  return (
    <>
      <div
        className={cn(
          "absolute top-1 right-1 h-7 z-20 bg-black/80 rounded flex items-center gap-2 px-2 opacity-0 pointer-events-none group-hover/image-component:opacity-100 group-hover/image-component:pointer-events-auto transition-opacity",
          {
            "opacity-100 pointer-events-auto": shouldShowToolbar,
          }
        )}
      >
        {!isTouchDevice && <ImageDownloadAction src={downloadSrc} />}
        <ImageAlignmentAction
          activeAlignment={alignment}
          handleChange={handleAlignmentChange}
          toggleToolbarViewStatus={setShouldShowToolbar}
        />
        <ImageFullScreenActionRoot
          extensionOptions={extensionOptions}
          image={props}
          toggleToolbarViewStatus={setShouldShowToolbar}
        />
      </div>
    </>
  );
};
