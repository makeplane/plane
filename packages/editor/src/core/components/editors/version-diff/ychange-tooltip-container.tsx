/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { autoUpdate, flip, hide, offset, shift, useDismiss, useFloating, useInteractions } from "@floating-ui/react";
import type { Editor } from "@tiptap/react";
import type { FC } from "react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
// local
import { getUserColor } from "./user-colors";
// types
import type { TUserInfo } from "./user-tooltip";

type Props = {
  editor: Editor;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  editorId?: string;
  userMap?: Map<string, TUserInfo> | null;
  getUserInfo?: (userId: string) => TUserInfo | null;
  /** Fallback text when user display_name is not available. Defaults to "Unknown user" */
  unknownUserText?: string;
};

type TYChangeTooltipProps = {
  userId: string;
  changeType: "added" | "removed" | null;
  userInfo: TUserInfo | null;
};

export const YChangeTooltipContainer: FC<Props> = ({
  editor,
  containerRef,
  editorId,
  userMap,
  getUserInfo,
  unknownUserText = "Unknown user",
}) => {
  const tooltipId = useId();
  const [tooltipProps, setTooltipProps] = useState<TYChangeTooltipProps | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [virtualElement, setVirtualElement] = useState<Element | null>(null);
  const hoverTimeoutRef = useRef<number | null>(null);

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    elements: {
      reference: virtualElement,
    },
    middleware: [
      offset(8),
      flip({
        fallbackPlacements: ["top", "bottom"],
      }),
      shift({
        padding: 5,
      }),
      hide(),
    ],
    whileElementsMounted: autoUpdate,
    placement: "top",
  });

  const dismiss = useDismiss(context);
  const { getFloatingProps } = useInteractions([dismiss]);

  const clearHoverTimeout = useCallback(() => {
    if (hoverTimeoutRef.current) {
      window.clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  const setCloseTimeout = useCallback(() => {
    clearHoverTimeout();
    hoverTimeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
    }, 200);
  }, [clearHoverTimeout]);

  // Track the current target to prevent redundant updates for same element
  const currentTargetRef = useRef<Element | null>(null);

  const handleYChangeHover = useCallback(
    (event: MouseEvent) => {
      if (!editor) return;

      const eventTarget = event.target as HTMLElement;
      if (!eventTarget) return;

      // Find the innermost ychange element - prioritize the element itself if it's a ychange
      // This prevents nested blocks from causing tooltip flickering
      let target: Element | null = null;

      // Check if the event target itself is a ychange element (innermost)
      if (eventTarget.matches("ychange") || eventTarget.matches("[data-ychange-user]")) {
        target = eventTarget;
      } else {
        // Find the closest ychange element, but we want the innermost one
        // Check for both <ychange> tags (inline marks) and elements with data-ychange-user (NodeViews)
        target = eventTarget.closest("ychange");
        if (!target) {
          target = eventTarget.closest("[data-ychange-user]");
        }
      }

      if (!target) return;

      const userId = target.getAttribute("data-ychange-user") || target.getAttribute("ychange_user");
      const changeType = (target.getAttribute("data-ychange-type") || target.getAttribute("ychange_type")) as
        | "added"
        | "removed"
        | null;

      if (!userId) return;

      // Skip if we're already showing tooltip for this exact element
      if (currentTargetRef.current === target && isOpen) {
        clearHoverTimeout();
        return;
      }

      // Try getUserInfo callback first, then fall back to userMap
      let userInfo: TUserInfo | null = null;
      if (getUserInfo) {
        userInfo = getUserInfo(userId);
      }
      if (!userInfo && userMap) {
        userInfo = userMap.get(userId) ?? null;
      }

      // Set aria-describedby for accessibility (only string attributes, not functions)
      target.setAttribute("aria-describedby", tooltipId);

      currentTargetRef.current = target;
      refs.setReference(target);
      setVirtualElement(target);
      clearHoverTimeout();

      setTooltipProps({
        userId,
        changeType,
        userInfo,
      });
      setIsOpen(true);
    },
    [editor, userMap, getUserInfo, tooltipId, refs, clearHoverTimeout, isOpen]
  );

  const handleFloatingMouseEnter = useCallback(() => {
    clearHoverTimeout();
  }, [clearHoverTimeout]);

  const handleFloatingMouseLeave = useCallback(() => {
    setCloseTimeout();
  }, [setCloseTimeout]);

  // Get container element either from ref or by ID
  const getContainer = useCallback(() => {
    if (containerRef?.current) return containerRef.current;
    if (editorId) return document.getElementById(`editor-container-${editorId}`);
    return null;
  }, [containerRef, editorId]);

  const handleContainerMouseLeave = useCallback(
    (event: MouseEvent) => {
      if (!editor || !isOpen) return;

      const relatedTarget = event.relatedTarget as HTMLElement;
      const container = getContainer();
      const floatingElement = refs.floating;

      if (
        container &&
        relatedTarget &&
        !container.contains(relatedTarget) &&
        (!floatingElement || !floatingElement.current?.contains(relatedTarget))
      ) {
        setCloseTimeout();
      }
    },
    [editor, isOpen, setCloseTimeout, refs.floating, getContainer]
  );

  const handleMouseOut = useCallback(
    (event: MouseEvent) => {
      const relatedTarget = event.relatedTarget as HTMLElement;
      const eventTarget = event.target as HTMLElement;

      // Check if we're leaving a ychange element
      const leavingTarget = eventTarget?.matches("ychange, [data-ychange-user]")
        ? eventTarget
        : eventTarget?.closest("ychange, [data-ychange-user]");

      if (!leavingTarget) return;

      // Check if we're entering another ychange element
      const enteringTarget = relatedTarget?.matches("ychange, [data-ychange-user]")
        ? relatedTarget
        : relatedTarget?.closest("ychange, [data-ychange-user]");

      // If we're leaving a ychange element and not entering another one (or entering a different one)
      if (!enteringTarget) {
        currentTargetRef.current = null;
        setCloseTimeout();
      } else if (enteringTarget !== leavingTarget) {
        // Moving between different ychange elements - let handleYChangeHover handle the new one
        // but don't close immediately
        currentTargetRef.current = null;
      }
    },
    [setCloseTimeout]
  );

  useEffect(() => {
    const container = getContainer();
    if (!container) return;

    container.addEventListener("mouseover", handleYChangeHover);
    container.addEventListener("mouseout", handleMouseOut);
    container.addEventListener("mouseleave", handleContainerMouseLeave);

    return () => {
      container.removeEventListener("mouseover", handleYChangeHover);
      container.removeEventListener("mouseout", handleMouseOut);
      container.removeEventListener("mouseleave", handleContainerMouseLeave);
    };
  }, [getContainer, handleYChangeHover, handleMouseOut, handleContainerMouseLeave]);

  useEffect(() => () => clearHoverTimeout(), [clearHoverTimeout]);

  // Memoize userColor to avoid recalculation on every render (rerender-dependencies)
  const userColor = useMemo(
    () => (tooltipProps?.userId ? getUserColor(tooltipProps.userId) : null),
    [tooltipProps?.userId]
  );

  // Memoize merged styles to avoid creating new object every render (rerender-dependencies)
  const mergedFloatingStyles = useMemo(() => ({ ...floatingStyles, zIndex: 100 }), [floatingStyles]);

  // Get display name with fallback
  const displayName = tooltipProps?.userInfo?.display_name?.trim() || unknownUserText;

  return (
    <>
      {isOpen && tooltipProps && virtualElement ? (
        <div
          ref={refs.setFloating}
          style={mergedFloatingStyles}
          role="tooltip"
          id={tooltipId}
          {...getFloatingProps()}
          onMouseEnter={handleFloatingMouseEnter}
          onMouseLeave={handleFloatingMouseLeave}
        >
          <div
            className="rounded-[3px_3px_3px_0] text-white text-11 font-semibold py-0.5 px-1.5 whitespace-nowrap shadow-md"
            style={{
              backgroundColor: userColor?.solid,
            }}
          >
            {displayName}
          </div>
        </div>
      ) : null}
    </>
  );
};
