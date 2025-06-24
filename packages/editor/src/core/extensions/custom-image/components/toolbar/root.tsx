import { useState } from "react";
// plane imports
import { cn } from "@plane/utils";
// local imports
import { ImageFullScreenActionRoot } from "./full-screen";

type Props = {
  containerClassName?: string;
  image: {
    width: string;
    height: string;
    aspectRatio: number;
    src: string;
  };
};

export const ImageToolbarRoot: React.FC<Props> = (props) => {
  const { containerClassName, image } = props;
  // state
  const [isFullScreenEnabled, setIsFullScreenEnabled] = useState(false);

  return (
    <>
      <div
        className={cn(containerClassName, {
          "opacity-100 pointer-events-auto": isFullScreenEnabled,
        })}
      >
        <ImageFullScreenActionRoot
          image={image}
          isOpen={isFullScreenEnabled}
          toggleFullScreenMode={(val) => setIsFullScreenEnabled(val)}
        />
      </div>
    </>
  );
};
