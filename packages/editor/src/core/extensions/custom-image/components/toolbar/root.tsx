import { useState } from "react";
// plane utils
import { cn } from "@plane/utils";
// components
import { ImageFullScreenAction } from "./full-screen";

type Props = {
  containerClassName?: string;
  image: {
    src: string;
    height: string;
    width: string;
    aspectRatio: number;
  };
  showExternalLink: boolean;
};

export const ImageToolbarRoot: React.FC<Props> = (props) => {
  const { containerClassName, image, showExternalLink } = props;
  // state
  const [isFullScreenEnabled, setIsFullScreenEnabled] = useState(false);

  return (
    <>
      <div
        className={cn(containerClassName, {
          "opacity-100 pointer-events-auto": isFullScreenEnabled,
        })}
      >
        <ImageFullScreenAction
          image={image}
          isOpen={isFullScreenEnabled}
          showExternalLink={showExternalLink}
          toggleFullScreenMode={(val) => setIsFullScreenEnabled(val)}
        />
      </div>
    </>
  );
};
