import { Maximize } from "lucide-react";
import { useEffect, useState } from "react";
// plane imports
import { Tooltip } from "@plane/ui";
// local imports
import { ImageFullScreenModal } from "./full-screen/modal";

type Props = {
  image: {
    width: string;
    height: string;
    aspectRatio: number;
    src: string;
  };
  toggleToolbarViewStatus: (val: boolean) => void;
};

export const ImageFullScreenAction: React.FC<Props> = (props) => {
  const { image, toggleToolbarViewStatus } = props;
  // state
  const [isFullScreenEnabled, setIsFullScreenEnabled] = useState(false);
  // derived values
  const { src, width, aspectRatio } = image;

  useEffect(() => {
    toggleToolbarViewStatus(isFullScreenEnabled);
  }, [isFullScreenEnabled, toggleToolbarViewStatus]);

  return (
    <>
      <ImageFullScreenModal
        aspectRatio={aspectRatio}
        isFullScreenEnabled={isFullScreenEnabled}
        src={src}
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
        >
          <Maximize className="size-3" />
        </button>
      </Tooltip>
    </>
  );
};
