import { ReactNode, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { cn } from "@plane/utils";

interface IContentOverflowWrapper {
  children: ReactNode;
  maxHeight?: number;
  gradientColor?: string;
  buttonClassName?: string;
  containerClassName?: string;
  fallback?: ReactNode;
  customButton?: ReactNode;
}

export const ContentOverflowWrapper = observer((props: IContentOverflowWrapper) => {
  const {
    children,
    maxHeight = 625,
    buttonClassName = "text-sm font-medium text-custom-primary-100",
    containerClassName,
    fallback = null,
    customButton,
  } = props;

  // states
  const [containerHeight, setContainerHeight] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // refs
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef?.current) return;

    const updateHeight = () => {
      if (contentRef.current) {
        const height = contentRef.current.getBoundingClientRect().height;
        setContainerHeight(height);
      }
    };

    // Initial height measurement
    updateHeight();

    // Create ResizeObserver for size changes
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(contentRef.current);

    // Create MutationObserver for content changes
    const mutationObserver = new MutationObserver((mutations) => {
      const shouldUpdate = mutations.some(
        (mutation) =>
          mutation.type === "childList" ||
          (mutation.type === "attributes" && (mutation.attributeName === "style" || mutation.attributeName === "class"))
      );

      if (shouldUpdate) {
        updateHeight();
      }
    });

    mutationObserver.observe(contentRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["style", "class"],
    });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [contentRef?.current]);

  useEffect(() => {
    if (!containerRef.current) return;

    const handleTransitionEnd = () => {
      setIsTransitioning(false);
    };

    containerRef.current.addEventListener("transitionend", handleTransitionEnd);

    return () => {
      containerRef.current?.removeEventListener("transitionend", handleTransitionEnd);
    };
  }, []);

  const handleToggle = () => {
    setIsTransitioning(true);
    setShowAll((prev) => !prev);
  };

  if (!children) return fallback;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative",
        {
          [`overflow-hidden transition-[height] duration-300 ease-in-out`]: containerHeight > maxHeight,
        },
        containerClassName
      )}
      style={{
        height: showAll ? `${containerHeight}px` : `${Math.min(maxHeight, containerHeight)}px`,
      }}
    >
      <div
        ref={contentRef}
        className={cn("h-auto", {
          "pb-6": showAll,
        })}
      >
        {children}
      </div>

      {containerHeight > maxHeight && (
        <div
          className={cn(
            "bottom-0 left-0 w-full transition-all duration-300 ease-in-out",
            `bg-gradient-to-t from-custom-background-100 to-transparent flex flex-col items-center justify-end`,
            "text-center",
            {
              "absolute h-[100px] opacity-100": !showAll,
              "absolute h-[30px] opacity-70": showAll,
            }
          )}
          style={{
            pointerEvents: isTransitioning ? "none" : "auto",
          }}
        >
          {customButton || (
            <button
              className={cn(
                "gap-1 w-full text-custom-primary-100 text-sm font-medium transition-opacity duration-300",
                buttonClassName
              )}
              onClick={handleToggle}
              disabled={isTransitioning}
            >
              {showAll ? "Show less" : "Show all"}
            </button>
          )}
        </div>
      )}
    </div>
  );
});
