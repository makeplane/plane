import { Maximize } from "lucide-react";
import { useEffect, useState } from "react";
// plane imports
import { Tooltip } from "@plane/ui";
// local imports
import { ImageFullScreenModal } from "./modal";

type Props = {
  image: {
    downloadSrc: string;
    src: string;
    height: string;
    width: string;
    aspectRatio: number;
  };
  toggleToolbarViewStatus: (val: boolean) => void;
};

export const ImageFullScreenActionRoot: React.FC<Props> = (props) => {
  const { image, toggleToolbarViewStatus } = props;
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
        isFullScreenEnabled={isFullScreenEnabled}
        src={src}
        downloadSrc={downloadSrc}
        width={width}
        toggleFullScreenMode={setIsFullScreenEnabled}
      />
      <Tooltip tooltipContent="View in full screen">
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
