import { Maximize } from "lucide-react";
// local imports
import { ImageFullScreenModal } from "./modal";

type Props = {
  image: {
    src: string;
    height: string;
    width: string;
    aspectRatio: number;
  };
  isOpen: boolean;
  toggleFullScreenMode: (val: boolean) => void;
};

export const ImageFullScreenActionRoot: React.FC<Props> = (props) => {
  const { image, isOpen: isFullScreenEnabled, toggleFullScreenMode } = props;
  // derived values
  const { src, width, aspectRatio } = image;

  return (
    <>
      <ImageFullScreenModal
        aspectRatio={aspectRatio}
        isFullScreenEnabled={isFullScreenEnabled}
        src={src}
        width={width}
        toggleFullScreenMode={toggleFullScreenMode}
      />
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFullScreenMode(true);
        }}
        className="size-5 grid place-items-center hover:bg-black/40 text-white rounded transition-colors"
      >
        <Maximize className="size-3" />
      </button>
    </>
  );
};
