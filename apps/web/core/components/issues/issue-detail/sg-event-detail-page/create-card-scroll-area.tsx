import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@plane/utils";

type Props = {
  children: ReactNode;
  className?: string;
  hidden?: boolean;
  id?: string;
  message?: string;
  refreshKey?: string | number;
};

type ScrollIndicatorState = {
  hasMoreBelow: boolean;
  hasOverflow: boolean;
  thumbHeightPercent: number;
  thumbOffsetPercent: number;
};

const INITIAL_SCROLL_INDICATOR_STATE: ScrollIndicatorState = {
  hasMoreBelow: false,
  hasOverflow: false,
  thumbHeightPercent: 100,
  thumbOffsetPercent: 0,
};

export const CreateCardScrollArea = ({
  children,
  className,
  hidden = false,
  id,
  message = "Scroll for more",
  refreshKey,
}: Props) => {
  const scrollElementRef = useRef<HTMLDivElement | null>(null);
  const [scrollIndicator, setScrollIndicator] = useState<ScrollIndicatorState>(INITIAL_SCROLL_INDICATOR_STATE);

  const updateOverflowIndicator = useCallback(() => {
    const element = scrollElementRef.current;
    if (!element || hidden) {
      setScrollIndicator(INITIAL_SCROLL_INDICATOR_STATE);
      return;
    }

    const scrollRange = Math.max(0, element.scrollHeight - element.clientHeight);
    const hasOverflow = scrollRange > 2;
    const thumbHeightPercent = hasOverflow ? Math.max(16, (element.clientHeight / element.scrollHeight) * 100) : 100;
    const thumbOffsetPercent = hasOverflow ? (element.scrollTop / scrollRange) * (100 - thumbHeightPercent) : 0;
    const nextState = {
      hasMoreBelow: hasOverflow && scrollRange - element.scrollTop > 2,
      hasOverflow,
      thumbHeightPercent,
      thumbOffsetPercent,
    };

    setScrollIndicator((currentState) =>
      currentState.hasMoreBelow === nextState.hasMoreBelow &&
      currentState.hasOverflow === nextState.hasOverflow &&
      currentState.thumbHeightPercent === nextState.thumbHeightPercent &&
      currentState.thumbOffsetPercent === nextState.thumbOffsetPercent
        ? currentState
        : nextState
    );
  }, [hidden]);

  useEffect(() => {
    updateOverflowIndicator();

    const element = scrollElementRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(updateOverflowIndicator);
    observer.observe(element);
    return () => observer.disconnect();
  }, [refreshKey, updateOverflowIndicator]);

  return (
    <div className="relative min-h-0" hidden={hidden}>
      <div
        ref={scrollElementRef}
        id={id}
        onScroll={updateOverflowIndicator}
        className={cn(
          "vertical-scrollbar scrollbar-md overflow-y-auto overscroll-contain [scrollbar-gutter:stable]",
          className
        )}
      >
        {children}
      </div>
      {scrollIndicator.hasOverflow ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-2 right-1 top-2 w-1 rounded-full bg-custom-border-300/80"
        >
          <span
            className="absolute inset-x-0 rounded-full bg-custom-primary-100 shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
            style={{
              height: `${scrollIndicator.thumbHeightPercent}%`,
              top: `${scrollIndicator.thumbOffsetPercent}%`,
            }}
          />
        </div>
      ) : null}
      {scrollIndicator.hasMoreBelow ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-custom-background-90 via-custom-background-90/90 to-transparent pb-2 pt-7"
        >
          <span className="inline-flex items-center gap-1 rounded-full border border-custom-border-300 bg-custom-background-100/95 px-2 py-1 text-[10px] font-medium text-custom-text-200 shadow-sm backdrop-blur">
            {message}
            <ChevronDown className="h-3 w-3" />
          </span>
        </div>
      ) : null}
    </div>
  );
};
