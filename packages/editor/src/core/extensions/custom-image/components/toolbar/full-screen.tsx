import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Maximize, Minus, Plus, X } from "lucide-react";
// helpers
import { cn } from "@/helpers/common";

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

const MAGNIFICATION_VALUES = [0.5, 0.75, 1, 1.5, 1.75, 2];

export const ImageFullScreenAction: React.FC<Props> = (props) => {
  const { image, isOpen: isFullScreenEnabled, toggleFullScreenMode } = props;
  const { src, width, aspectRatio } = image;
  // states
  const [magnification, setMagnification] = useState(1);
  // refs
  const modalRef = useRef<HTMLDivElement>(null);
  // derived values
  const widthInNumber = useMemo(() => Number(width?.replace("px", "")), [width]);
  // close handler
  const handleClose = useCallback(() => {
    toggleFullScreenMode(false);
    setTimeout(() => {
      setMagnification(1);
    }, 200);
  }, [toggleFullScreenMode]);
  // download handler
  const handleOpenInNewTab = () => {
    const link = document.createElement("a");
    link.href = src;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  // magnification decrease handler
  const handleDecreaseMagnification = useCallback(() => {
    const currentIndex = MAGNIFICATION_VALUES.indexOf(magnification);
    if (currentIndex === 0) return;
    setMagnification(MAGNIFICATION_VALUES[currentIndex - 1]);
  }, [magnification]);
  // magnification increase handler
  const handleIncreaseMagnification = useCallback(() => {
    const currentIndex = MAGNIFICATION_VALUES.indexOf(magnification);
    if (currentIndex === MAGNIFICATION_VALUES.length - 1) return;
    setMagnification(MAGNIFICATION_VALUES[currentIndex + 1]);
  }, [magnification]);
  // keydown handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "+" || e.key === "=" || e.key === "-") {
        e.preventDefault();
        e.stopPropagation();

        if (e.key === "Escape") handleClose();
        if (e.key === "+" || e.key === "=") handleIncreaseMagnification();
        if (e.key === "-") handleDecreaseMagnification();
      }
    },
    [handleClose, handleDecreaseMagnification, handleIncreaseMagnification]
  );
  // click outside handler
  const handleClickOutside = useCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (modalRef.current && e.target === modalRef.current) {
        handleClose();
      }
    },
    [handleClose]
  );
  // register keydown listener
  useEffect(() => {
    if (isFullScreenEnabled) {
      document.addEventListener("keydown", handleKeyDown);

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [handleKeyDown, isFullScreenEnabled]);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 size-full z-20 bg-black/90 opacity-0 pointer-events-none cursor-default transition-opacity",
          {
            "opacity-100 pointer-events-auto": isFullScreenEnabled,
          }
        )}
      >
        <div ref={modalRef} onClick={handleClickOutside} className="relative size-full grid place-items-center">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-10 right-10 size-8 grid place-items-center"
          >
            <X className="size-8 text-white/60 hover:text-white transition-colors" />
          </button>
          <img
            src={src}
            className="read-only-image rounded-lg transition-all duration-200"
            style={{
              width: `${widthInNumber * magnification}px`,
              aspectRatio,
            }}
          />
        </div>
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1 rounded-md border border-white/20 py-2 divide-x divide-white/20 bg-black">
          <div className="flex items-center">
            <button
              type="button"
              onClick={handleDecreaseMagnification}
              className="size-6 grid place-items-center text-white/60 hover:text-white disabled:text-white/30 transition-colors duration-200"
              disabled={magnification === MAGNIFICATION_VALUES[0]}
            >
              <Minus className="size-4" />
            </button>
            <span className="text-sm w-12 text-center text-white">{(100 * magnification).toFixed(0)}%</span>
            <button
              type="button"
              onClick={handleIncreaseMagnification}
              className="size-6 grid place-items-center text-white/60 hover:text-white disabled:text-white/30 transition-colors duration-200"
              disabled={magnification === MAGNIFICATION_VALUES[MAGNIFICATION_VALUES.length - 1]}
            >
              <Plus className="size-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={handleOpenInNewTab}
            className="flex-shrink-0 size-8 grid place-items-center text-white/60 hover:text-white transition-colors duration-200"
          >
            <ExternalLink className="size-4" />
          </button>
        </div>
      </div>
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
