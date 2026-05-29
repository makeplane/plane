import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TNavigationItem } from "./tab-navigation-root";

export type TResponsiveTabLayout = {
  visibleItems: TNavigationItem[];
  overflowItems: TNavigationItem[];
  hasOverflow: boolean;
  itemRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  containerRef: (node: HTMLDivElement | null) => void;
};

type UseResponsiveTabLayoutProps = {
  visibleNavigationItems: TNavigationItem[];
  hiddenNavigationItems: TNavigationItem[];
  isActive: (item: TNavigationItem) => boolean;
};

/**
 * Custom hook for managing responsive tab layout
 * Calculates which tabs fit in the visible area and which overflow
 * Implements smart pinning to keep active tabs visible
 *
 * @param visibleNavigationItems - Items that are not user-hidden
 * @param hiddenNavigationItems - Items that user explicitly hid
 * @param isActive - Function to check if a tab is active
 * @returns Layout information and refs for rendering
 */
export const useResponsiveTabLayout = ({
  visibleNavigationItems,
  hiddenNavigationItems,
  isActive,
}: UseResponsiveTabLayoutProps): TResponsiveTabLayout => {
  // Refs for measuring items
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // State for responsive behavior
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [visibleCount, setVisibleCount] = useState<number>(visibleNavigationItems.length);

  // Constants
  const gap = 4; // gap-1 = 4px
  const overflowButtonWidth = 40;

  // Callback ref that sets up ResizeObserver when element is attached
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    // Clean up previous observer if it exists
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
      resizeObserverRef.current = null;
    }

    // If node is null (unmounting), just clean up
    if (!node) {
      setContainerWidth(0);
      return;
    }

    // Set initial width immediately
    setContainerWidth(node.offsetWidth);

    // Create and set up new ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserverRef.current = resizeObserver;
    resizeObserver.observe(node);
  }, []); // Empty deps - callback function remains stable

  // Cleanup effect to disconnect observer on component unmount
  useEffect(
    () => () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    },
    []
  );

  // Calculate how many items can fit
  useEffect(() => {
    if (!containerWidth || itemRefs.current.length === 0) return;

    let totalWidth = 0;
    let count = 0;

    for (let i = 0; i < itemRefs.current.length; i++) {
      const item = itemRefs.current[i];
      if (!item) continue;

      const itemWidth = item.offsetWidth;
      const widthWithGap = itemWidth + (count > 0 ? gap : 0);

      // If we still have items to show, reserve space for overflow button
      const remainingItems = visibleNavigationItems.length - (i + 1);
      const reservedSpace = remainingItems > 0 ? overflowButtonWidth + gap : 0;

      if (totalWidth + widthWithGap + reservedSpace <= containerWidth) {
        totalWidth += widthWithGap;
        count++;
      } else {
        break;
      }
    }

    // Ensure at least one item is visible if there's space
    if (count === 0 && visibleNavigationItems.length > 0 && containerWidth > overflowButtonWidth) {
      count = 1;
    }

    setVisibleCount(count);
  }, [containerWidth, visibleNavigationItems.length, gap, overflowButtonWidth]);

  // Memoize active tab index to prevent unnecessary re-renders
  const activeTabIndex = useMemo(
    () => visibleNavigationItems.findIndex((item) => isActive(item)),
    [visibleNavigationItems, isActive]
  );

  // Smart pinning logic: calculate visible and overflow items
  const { visibleItems, overflowItems, hasOverflow } = useMemo(() => {
    // Start with responsive calculation: which items fit in available space
    let visible = visibleNavigationItems.slice(0, visibleCount);
    let overflow = visibleNavigationItems.slice(visibleCount);

    // If active tab would be in overflow, swap it with last visible item
    if (activeTabIndex !== -1 && activeTabIndex >= visibleCount && visibleCount > 0) {
      const activeItem = visibleNavigationItems[activeTabIndex];
      const replacedItem = visible[visibleCount - 1];

      visible = [...visible.slice(0, visibleCount - 1), activeItem];
      // Add replaced item to overflow, maintain order
      overflow = [
        replacedItem,
        ...visibleNavigationItems.slice(visibleCount, activeTabIndex),
        ...visibleNavigationItems.slice(activeTabIndex + 1),
      ];
    }

    // Combine space-overflowed items with user-hidden items
    // User-hidden items (in hiddenNavigationItems) will show "Eye" icon
    // Space-overflowed items (in overflow from visibleNavigationItems) will NOT show "Eye" icon
    const allOverflow = [...overflow, ...hiddenNavigationItems];

    return {
      visibleItems: visible,
      overflowItems: allOverflow,
      hasOverflow: allOverflow.length > 0,
    };
  }, [visibleNavigationItems, hiddenNavigationItems, visibleCount, activeTabIndex]);

  return {
    visibleItems,
    overflowItems,
    hasOverflow,
    itemRefs,
    containerRef,
  };
};
