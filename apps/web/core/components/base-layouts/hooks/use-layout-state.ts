import { useEffect, useRef, useState, useCallback } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";

interface UseLayoutStateProps {
  /** Groups that should be collapsed externally */
  externalCollapsedGroups?: string[];

  /** External handler to toggle a group’s collapsed state */
  externalOnToggleGroup?: (groupId: string) => void;

  /** Enables automatic scrolling during drag-and-drop */
  enableAutoScroll?: boolean;
}

/**
 * Hook for managing layout state including:
 * - Collapsed/expanded group tracking (internal or external)
 * - Auto-scroll setup for drag-and-drop
 */
export const useLayoutState = ({
  externalCollapsedGroups,
  externalOnToggleGroup,
  enableAutoScroll = true,
}: UseLayoutStateProps = {}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Internal fallback state
  const [internalCollapsedGroups, setInternalCollapsedGroups] = useState<string[]>([]);

  // Stable internal toggle function
  const internalToggleGroup = useCallback((groupId: string) => {
    setInternalCollapsedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  }, []);

  // Use external state/handlers if provided
  const collapsedGroups = externalCollapsedGroups ?? internalCollapsedGroups;
  const onToggleGroup = externalOnToggleGroup ?? internalToggleGroup;

  // Enable auto-scroll for DnD
  useEffect(() => {
    const element = containerRef.current;
    if (!element || !enableAutoScroll) return;

    const cleanup = combine(
      autoScrollForElements({
        element,
      })
    );

    return cleanup;
  }, [enableAutoScroll]);

  return {
    containerRef,
    collapsedGroups,
    onToggleGroup,
  };
};
