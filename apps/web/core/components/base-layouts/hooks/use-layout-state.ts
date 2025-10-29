import { useEffect, useRef, useState, useCallback } from "react";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import { autoScrollForElements } from "@atlaskit/pragmatic-drag-and-drop-auto-scroll/element";

type UseLayoutStateProps =
  | {
      mode: "external";
      externalCollapsedGroups: string[];
      externalOnToggleGroup: (groupId: string) => void;
      enableAutoScroll?: boolean;
    }
  | {
      mode?: "internal";
      enableAutoScroll?: boolean;
    };

/**
 * Hook for managing layout state including:
 * - Collapsed/expanded group tracking (internal or external)
 * - Auto-scroll setup for drag-and-drop
 */
export const useLayoutState = (props: UseLayoutStateProps = { mode: "internal" }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Internal fallback state
  const [internalCollapsedGroups, setInternalCollapsedGroups] = useState<string[]>([]);

  // Stable internal toggle function
  const internalToggleGroup = useCallback((groupId: string) => {
    setInternalCollapsedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  }, []);

  const useExternal = props.mode === "external";
  const collapsedGroups = useExternal ? props.externalCollapsedGroups : internalCollapsedGroups;
  const onToggleGroup = useExternal ? props.externalOnToggleGroup : internalToggleGroup;

  // Enable auto-scroll for DnD
  useEffect(() => {
    const element = containerRef.current;
    if (!element || !props.enableAutoScroll) return;

    const cleanup = combine(
      autoScrollForElements({
        element,
      })
    );

    return cleanup;
  }, [props.enableAutoScroll]);

  return {
    containerRef,
    collapsedGroups,
    onToggleGroup,
  };
};
