/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useRef } from "react";
import { observer } from "mobx-react";
import { useRouter, useSearchParams } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
// hooks
import { useIssueDetails } from "@/hooks/store/use-issue-details";
// local imports
import { FullScreenPeekView } from "./full-screen-peek-view";
import { SidePeekView } from "./side-peek-view";

type TIssuePeekOverview = {
  anchor: string;
  peekId: string;
  handlePeekClose?: () => void;
};

export const IssuePeekOverview = observer(function IssuePeekOverview(props: TIssuePeekOverview) {
  const { anchor, peekId, handlePeekClose } = props;
  const router = useRouter();
  const searchParams = useSearchParams();
  // query params
  const board = searchParams.get("board") || undefined;
  const state = searchParams.get("state") || undefined;
  const priority = searchParams.get("priority") || undefined;
  const labels = searchParams.get("labels") || undefined;
  // store
  const { peekMode, setPeekId, getIssueById, fetchIssueDetails } = useIssueDetails();
  // translation
  const { t } = useTranslation();
  // derived values
  const issueDetails = peekId ? getIssueById(peekId.toString()) : undefined;
  // state
  const isSidePeekOpen = !!peekId && peekMode === "side";
  const isModalPeekOpen = !!peekId && (peekMode === "modal" || peekMode === "full");
  // exactly one of the two panels is ever mounted, so both share the panel ref
  const isPeekOpen = isSidePeekOpen || isModalPeekOpen;
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (anchor && peekId) {
      fetchIssueDetails(anchor, peekId.toString());
    }
  }, [anchor, fetchIssueDetails, peekId]);

  const handleClose = useCallback(() => {
    // if close logic is passed down, call that instead of the below logic
    if (handlePeekClose) {
      handlePeekClose();
      return;
    }

    setPeekId(null);
    let queryParams: any = {
      board,
    };
    if (priority && priority.length > 0) queryParams = { ...queryParams, priority: priority };
    if (state && state.length > 0) queryParams = { ...queryParams, state: state };
    if (labels && labels.length > 0) queryParams = { ...queryParams, labels: labels };
    queryParams = new URLSearchParams(queryParams).toString();
    router.push(`/issues/${anchor}?${queryParams}`);
  }, [anchor, board, handlePeekClose, labels, priority, router, setPeekId, state]);

  // propel (ruling 36): the peek was a Headless UI `Dialog` + `Transition`. Propel's `DialogContent`
  // ladder cannot express the `w-1/2` side sheet or the `h-[70%] w-3/5` / `size-[95%]` modal/full
  // geometry, so (as in EE) both panels are hand-rolled: Escape and outside-press close, Tab is
  // trapped inside the panel, and focus moves in on open and back to the trigger on close.
  // A click on another work item's card (`peekId=` link) switches the peek instead of closing it.
  useEffect(() => {
    if (!isPeekOpen) return;

    // Portalled popups opened from inside the panel (peek-mode select, comment actions menu,
    // reaction pickers) live outside it in the DOM; interacting with them must not close the peek.
    const isInsideNestedPopup = (target: EventTarget | null) =>
      target instanceof Element &&
      !panelRef.current?.contains(target) &&
      !!target.closest('[data-prevent-outside-click], [role="menu"], [role="listbox"], [role="dialog"]');

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (event.defaultPrevented || isInsideNestedPopup(event.target)) return;
        handleClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      // Portalled popups opened from the panel manage their own focus.
      if (isInsideNestedPopup(document.activeElement)) return;

      // Keep Tab/Shift+Tab confined to the panel, as the legacy modal Dialog did.
      const focusableElements = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      // Focus starts on the panel itself (tabIndex={-1}), outside the tab order — treat it as a boundary too,
      // as well as focus that has escaped the panel (e.g. dropped to <body> when a focused child unmounted).
      const isAtBoundary =
        document.activeElement === panelRef.current || !panelRef.current.contains(document.activeElement);

      if (event.shiftKey && (document.activeElement === firstElement || isAtBoundary)) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && (document.activeElement === lastElement || isAtBoundary)) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (panelRef.current?.contains(target)) return;
      if (isInsideNestedPopup(target)) return;
      if (target.closest('a[href*="peekId="]')) return;
      handleClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [handleClose, isPeekOpen]);

  // Remember what had focus when the peek first opened and restore it when the peek closes. This is
  // keyed on `isPeekOpen` only, so switching peek modes does not re-capture the (unmounting) mode select.
  useEffect(() => {
    if (!isPeekOpen) return;

    previouslyFocusedElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    return () => {
      previouslyFocusedElementRef.current?.focus();
      previouslyFocusedElementRef.current = null;
    };
  }, [isPeekOpen]);

  // Move focus into the panel on open and whenever the mounted panel changes (side <-> modal/full),
  // as mounting each legacy Headless UI Dialog did; otherwise focus falls to <body> and escapes the trap.
  useEffect(() => {
    if (!isPeekOpen) return;
    panelRef.current?.focus();
  }, [isPeekOpen, isSidePeekOpen, peekMode]);

  const panelLabel = issueDetails?.name || t("common.work_item");

  return (
    <>
      {isSidePeekOpen && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={panelLabel}
          tabIndex={-1}
          className="fixed top-0 right-0 z-20 h-full w-1/2 border-l border-subtle-1 bg-surface-1 shadow-raised-200 outline-none"
        >
          <SidePeekView anchor={anchor} handleClose={handleClose} issueDetails={issueDetails} />
        </div>
      )}
      {isModalPeekOpen && (
        <>
          <div
            aria-hidden="true"
            className="fixed inset-0 z-20 animate-fade-in bg-backdrop motion-reduce:animate-none"
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={panelLabel}
            tabIndex={-1}
            className={`fixed top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 animate-fade-in rounded-lg bg-surface-1 transition-all duration-300 outline-none motion-reduce:animate-none ${
              peekMode === "modal" ? "h-[70%] w-3/5" : "size-[95%]"
            }`}
          >
            {peekMode === "modal" && (
              <SidePeekView anchor={anchor} handleClose={handleClose} issueDetails={issueDetails} />
            )}
            {peekMode === "full" && (
              <FullScreenPeekView anchor={anchor} handleClose={handleClose} issueDetails={issueDetails} />
            )}
          </div>
        </>
      )}
    </>
  );
});
