import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { ExternalLink, Maximize, Minus, Plus, X } from "lucide-react";
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

const MAGNIFICATION_VALUES = [0.5, 0.75, 1, 1.5, 1.75, 2] as const;

export const ImageFullScreenAction: React.FC<Props> = (props) => {
  const { image, isOpen: isFullScreenEnabled, toggleFullScreenMode } = props;
  const { src, width, aspectRatio } = image;

  const [magnification, setMagnification] = useState<(typeof MAGNIFICATION_VALUES)[number]>(1);
  const [initialMagnification, setInitialMagnification] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const dragOffset = useRef({ x: 0, y: 0 });
  const modalRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const widthInNumber = useMemo(() => Number(width?.replace("px", "")), [width]);

  const setImageRef = useCallback(
    (node: HTMLImageElement | null) => {
      if (!node || !isFullScreenEnabled) return;

      imgRef.current = node;

      const viewportWidth = window.innerWidth * 0.9;
      const viewportHeight = window.innerHeight * 0.75;
      const imageWidth = widthInNumber;
      const imageHeight = imageWidth / aspectRatio;

      const widthRatio = viewportWidth / imageWidth;
      const heightRatio = viewportHeight / imageHeight;

      setInitialMagnification(Math.min(widthRatio, heightRatio));
      setMagnification(1);

      // Reset image position
      node.style.left = "0px";
      node.style.top = "0px";
    },
    [isFullScreenEnabled, widthInNumber, aspectRatio]
  );

  const handleClose = useCallback(() => {
    if (isDragging) return;
    toggleFullScreenMode(false);
    setMagnification(1);
  }, [isDragging, toggleFullScreenMode]);

  const handleOpenInNewTab = () => window.open(src, "_blank");

  const handleMagnification = useCallback((direction: "increase" | "decrease") => {
    setMagnification((prev) => {
      const currentIndex = MAGNIFICATION_VALUES.indexOf(prev);
      if (direction === "increase" && currentIndex < MAGNIFICATION_VALUES.length - 1) {
        return MAGNIFICATION_VALUES[currentIndex + 1];
      }
      if (direction === "decrease" && currentIndex > 0) {
        return MAGNIFICATION_VALUES[currentIndex - 1];
      }
      return prev;
    });
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "+" || e.key === "=" || e.key === "-") {
        e.preventDefault();
        e.stopPropagation();

        if (e.key === "Escape") handleClose();
        if (e.key === "+" || e.key === "=") handleMagnification("increase");
        if (e.key === "-") handleMagnification("decrease");
      }
    },
    [handleClose, handleMagnification]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imgRef.current) return;

    const imgWidth = imgRef.current.offsetWidth * magnification;
    const imgHeight = imgRef.current.offsetHeight * magnification;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (imgWidth > viewportWidth || imgHeight > viewportHeight) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      dragStart.current = { x: e.clientX, y: e.clientY };
      dragOffset.current = {
        x: parseInt(imgRef.current.style.left || "0"),
        y: parseInt(imgRef.current.style.top || "0"),
      };
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !imgRef.current) return;

      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;

      // Apply the scale factor to the drag movement
      const scaledDx = dx / magnification;
      const scaledDy = dy / magnification;

      imgRef.current.style.left = `${dragOffset.current.x + scaledDx}px`;
      imgRef.current.style.top = `${dragOffset.current.y + scaledDy}px`;
    },
    [isDragging, magnification]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !imgRef.current) return;
    setIsDragging(false);
  }, [isDragging]);

  // Event listeners
  useEffect(() => {
    if (!isFullScreenEnabled) return;

    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isFullScreenEnabled, handleKeyDown, handleMouseMove, handleMouseUp]);

  return (
    <>
      <div
        className={cn("fixed inset-0 size-full z-20 bg-black/90 opacity-0 pointer-events-none transition-opacity", {
          "opacity-100 pointer-events-auto": isFullScreenEnabled,
          "cursor-default": !isDragging,
          "cursor-grabbing": isDragging,
        })}
      >
        <div
          ref={modalRef}
          onMouseDown={(e) => e.target === modalRef.current && handleClose()}
          className="relative size-full grid place-items-center overflow-hidden"
        >
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-10 right-10 size-8 grid place-items-center"
          >
            <X className="size-8 text-white/60 hover:text-white transition-colors" />
          </button>
          <img
            ref={setImageRef}
            src={src}
            className="read-only-image rounded-lg"
            style={{
              width: `${widthInNumber * initialMagnification}px`,
              maxWidth: "none",
              maxHeight: "none",
              aspectRatio,
              position: "relative",
              transform: `scale(${magnification})`,
              transformOrigin: "center",
              transition: "width 0.2s ease, transform 0.2s ease",
            }}
            onMouseDown={handleMouseDown}
          />
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1 rounded-md border border-white/20 py-2 divide-x divide-white/20 bg-black">
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => handleMagnification("decrease")}
                className="size-6 grid place-items-center text-white/60 hover:text-white disabled:text-white/30 transition-colors duration-200"
                disabled={magnification === MAGNIFICATION_VALUES[0]}
              >
                <Minus className="size-4" />
              </button>
              <span className="text-sm w-12 text-center text-white">{(100 * magnification).toFixed(0)}%</span>
              <button
                type="button"
                onClick={() => handleMagnification("increase")}
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
