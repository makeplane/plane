import { useCallback, useRef } from "react";

type ScrollBehavior = "auto" | "smooth" | "instant";
export const useScrollManager = <T = string>(containerRef: React.RefObject<HTMLElement>) => {
  const itemRefsMap = useRef<Map<T, HTMLElement>>(new Map());

  // Function to create ref setter for items
  const setItemRef = useCallback(
    (itemId: T) => (el: HTMLElement | null) => {
      if (el) {
        itemRefsMap.current.set(itemId, el);
      } else {
        itemRefsMap.current.delete(itemId);
      }
    },
    []
  );

  // Scroll to specific item by ID
  const scrollToItem = useCallback(
    (
      itemId: T,
      options?: { behavior?: ScrollBehavior; block?: "start" | "center" | "end"; offset?: number; highlight?: boolean }
    ) => {
      const container = containerRef.current;
      const targetElement = itemRefsMap.current.get(itemId);

      if (!container || !targetElement) return;

      const { behavior = "smooth", block = "center", offset = 0, highlight = false } = options || {};

      // Add highlight effect if requested
      if (highlight) {
        targetElement.classList.add("bg-custom-background-90", "transition-all", "duration-300");
        setTimeout(() => {
          targetElement.classList.remove("bg-custom-background-90", "transition-all", "duration-300");
        }, 2000);
      }

      setTimeout(() => {
        const containerRect = container.getBoundingClientRect();
        const itemRect = targetElement.getBoundingClientRect();
        const scrollTop = container.scrollTop;
        const containerHeight = containerRect.height;
        const itemTop = itemRect.top - containerRect.top + scrollTop;
        const itemHeight = itemRect.height;

        let targetScrollTop: number;

        switch (block) {
          case "start":
            targetScrollTop = itemTop + offset;
            break;
          case "end":
            targetScrollTop = itemTop - containerHeight + itemHeight + offset;
            break;
          case "center":
          default:
            targetScrollTop = itemTop - containerHeight / 2 + itemHeight / 2 + offset;
            break;
        }

        container.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior,
        });
      }, 100);
    },
    [containerRef]
  );

  // Scroll to specific element directly
  const scrollToElement = useCallback(
    (
      element: HTMLElement,
      options?: { behavior?: ScrollBehavior; block?: "start" | "center" | "end"; offset?: number }
    ) => {
      const container = containerRef.current;
      if (!container) return;

      const { behavior = "smooth", block = "center", offset = 0 } = options || {};

      const containerRect = container.getBoundingClientRect();
      const itemRect = element.getBoundingClientRect();
      const scrollTop = container.scrollTop;
      const containerHeight = containerRect.height;
      const itemTop = itemRect.top - containerRect.top + scrollTop;
      const itemHeight = itemRect.height;

      let targetScrollTop: number;

      switch (block) {
        case "start":
          targetScrollTop = itemTop + offset;
          break;
        case "end":
          targetScrollTop = itemTop - containerHeight + itemHeight + offset;
          break;
        case "center":
        default:
          targetScrollTop = itemTop - containerHeight / 2 + itemHeight / 2 + offset;
          break;
      }

      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior,
      });
    },
    [containerRef]
  );

  // Scroll to position
  const scrollTo = useCallback(
    (position: number, behavior: ScrollBehavior = "smooth") => {
      const container = containerRef.current;
      if (!container) return;

      container.scrollTo({
        top: position,
        behavior,
      });
    },
    [containerRef]
  );

  return {
    setItemRef,
    scrollToItem,
    scrollToElement,
    scrollTo,
  };
};
