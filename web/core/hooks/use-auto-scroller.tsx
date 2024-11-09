import { RefObject, useEffect, useRef } from "react";

const SCROLL_BY = 3;

const AUTO_SCROLL_THRESHOLD = 15;
const MAX_SPEED_THRESHOLD = 5;

export const useAutoScroller = (
  containerRef: RefObject<HTMLDivElement>,
  shouldScroll = false,
  leftOffset = 0,
  topOffset = 0
) => {
  const containerDimensions = useRef<DOMRect | undefined>();
  const intervalId = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const mousePosition = useRef<{ clientX: number; clientY: number } | undefined>(undefined);

  const clearRegisteredTimeout = () => {
    clearInterval(intervalId.current);
  };

  const onDragEnd = () => clearRegisteredTimeout();

  const handleAutoScroll = (e: MouseEvent) => {
    const rect = containerDimensions.current;
    clearInterval(intervalId.current);

    if (!rect || !shouldScroll || (e.clientX === 0 && e.clientY === 0)) return;

    let diffX = 0,
      diffY = 0;

    if (mousePosition.current) {
      diffX = e.clientX - mousePosition.current.clientX;
      diffY = e.clientY - mousePosition.current.clientY;
    }

    mousePosition.current = { clientX: e.clientX, clientY: e.clientY };
    const { left, top, width, height } = rect;

    const mouseX = e.clientX - left - leftOffset;
    const mouseY = e.clientY - top - topOffset;

    const currWidth = width - leftOffset;
    const currHeight = height - topOffset;

    // Get Threshold in percentages
    const thresholdX = (currWidth / 100) * AUTO_SCROLL_THRESHOLD;
    const thresholdY = (currHeight / 100) * AUTO_SCROLL_THRESHOLD;
    const maxSpeedX = (currWidth / 100) * MAX_SPEED_THRESHOLD;
    const maxSpeedY = (currHeight / 100) * MAX_SPEED_THRESHOLD;

    let scrollByX = 0,
      scrollByY = 0;

    // Check mouse positions against thresholds
    if (mouseX < thresholdX && diffX <= 0) {
      scrollByX = -1 * SCROLL_BY;
      if (mouseX < maxSpeedX) {
        scrollByX *= 2;
      }
    }

    if (mouseX > currWidth - thresholdX && diffX >= 0) {
      scrollByX = SCROLL_BY;
      if (mouseX > currWidth - maxSpeedX) {
        scrollByX *= 2;
      }
    }

    if (mouseY < thresholdY && diffY <= 0) {
      scrollByY = -1 * SCROLL_BY;
      if (mouseX < maxSpeedY) {
        scrollByY *= 2;
      }
    }

    if (mouseY > currHeight - thresholdY && diffY >= 0) {
      scrollByY = SCROLL_BY;
      if (mouseY > currHeight - maxSpeedY) {
        scrollByY *= 2;
      }
    }

    // if mouse position breaches threshold, then start to scroll
    if (scrollByX || scrollByY) {
      containerRef.current?.scrollBy(scrollByX, scrollByY);
      intervalId.current = setInterval(() => {
        containerRef.current?.scrollBy(scrollByX, scrollByY);
      }, 16);
    }
  };

  useEffect(() => {
    const containerElement = containerRef.current;

    if (!containerElement || !shouldScroll) return;

    containerElement.addEventListener("drag", handleAutoScroll);
    containerElement.addEventListener("mousemove", handleAutoScroll);
    document.addEventListener("mouseup", onDragEnd);
    document.addEventListener("dragend", onDragEnd);

    return () => {
      containerElement?.removeEventListener("drag", handleAutoScroll);
      containerElement?.removeEventListener("mousemove", handleAutoScroll);
      document.removeEventListener("mouseup", onDragEnd);
      document.removeEventListener("dragend", onDragEnd);
    };
  }, [shouldScroll, intervalId]);

  useEffect(() => {
    const containerElement = containerRef.current;

    if (!containerElement || !shouldScroll) {
      clearRegisteredTimeout();
      containerDimensions.current = undefined;
    }

    containerDimensions.current = containerElement?.getBoundingClientRect();
  }, [shouldScroll]);
};
