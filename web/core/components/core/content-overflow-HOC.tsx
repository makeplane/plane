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
}

export const ContentOverflowWrapper = observer((props: IContentOverflowWrapper) => {
  const {
    children,
    maxHeight = 625,
    buttonClassName = "text-sm font-medium text-custom-primary-100",
    containerClassName,
    fallback = null,
  } = props;

  // states
  const [containerHeight, setContainerHeight] = useState(0);
  const [showAll, setShowAll] = useState(false);

  // refs
  const contentRef = useRef<HTMLDivElement>(null);

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

  if (!children) return fallback;

  return (
    <div
      className={cn(
        "relative",
        {
          [`overflow-hidden`]: !showAll,
          "overflow-visible": showAll,
        },
        containerClassName
      )}
      style={{ maxHeight: showAll ? "100%" : `${maxHeight}px` }}
    >
      <div ref={contentRef}>{children}</div>

      {containerHeight > maxHeight && (
        <div
          className={cn(
            "bottom-0 left-0 w-full",
            `bg-gradient-to-t from-custom-background-100 to-transparent flex flex-col items-center justify-end`,
            "text-center",
            {
              "absolute h-[100px]": !showAll,
              "h-[30px]": showAll,
            }
          )}
        >
          <button
            className={cn("gap-1 w-full text-custom-primary-100 text-sm font-medium", buttonClassName)}
            onClick={() => setShowAll((prev) => !prev)}
          >
            {showAll ? "Show less" : "Show all"}
          </button>
        </div>
      )}
    </div>
  );
});
