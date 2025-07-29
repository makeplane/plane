import { Maximize } from "lucide-react";
import { useEffect, useState } from "react";
// plane imports
import { Tooltip } from "@plane/ui";
// local imports
import { ImageFullScreenModal } from "./modal";

type Props = {
  image: {
    aspectRatio: number;
    downloadSrc: string;
    height: string;
    src: string;
    width: string;
  };
  isTouchDevice: boolean;
  toggleToolbarViewStatus: (val: boolean) => void;
};

export const ImageFullScreenActionRoot: React.FC<Props> = (props) => {
  const { image, isTouchDevice, toggleToolbarViewStatus } = props;
  // states
  const [isFullScreenEnabled, setIsFullScreenEnabled] = useState(false);
  // derived values
  const { downloadSrc, src, width, aspectRatio } = image;

  useEffect(() => {
    toggleToolbarViewStatus(isFullScreenEnabled);
  }, [isFullScreenEnabled, toggleToolbarViewStatus]);

  return (
    <>
      <ImageFullScreenModal
        aspectRatio={aspectRatio}
        downloadSrc={downloadSrc}
        isFullScreenEnabled={isFullScreenEnabled}
        isTouchDevice={isTouchDevice}
        src={src}
        width={width}
        toggleFullScreenMode={setIsFullScreenEnabled}
      />
      <Tooltip tooltipContent="View in full screen" disabled={isTouchDevice}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsFullScreenEnabled(true);
          }}
          className="flex-shrink-0 h-full grid place-items-center text-white/60 hover:text-white transition-colors"
          aria-label="View image in full screen"
        >
          <Maximize className="size-3" />
        </button>
      </Tooltip>
    </>
  );
};
