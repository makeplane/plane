/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane hooks
import { useOutsideClickDetector } from "@plane/hooks";
// plane ui
import { AddOutline, CloseOutline, MultipleStickyOutline, StickyNoteOutline } from "@makeplane/propel/icons";
import { PreviewCard, PreviewCardContent, PreviewCardTrigger } from "@makeplane/propel/components/preview-card";
import { Tooltip } from "@makeplane/propel/components/tooltip";
// plane utils
import { cn } from "@plane/utils";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useSticky } from "@/hooks/use-stickies";
// components
import { STICKY_COLORS_LIST } from "../editor/sticky-editor/color-palette";
import { AllStickiesModal } from "./modal";
import { StickyNote } from "./sticky";

export const StickyActionBar = observer(function StickyActionBar() {
  // states
  const [isExpanded, setIsExpanded] = useState(false);
  const [newSticky, setNewSticky] = useState(false);
  const [showRecentSticky, setShowRecentSticky] = useState(false);
  // navigation
  const { workspaceSlug } = useParams();
  // refs
  const ref = useRef(null);
  // store hooks
  const { stickies, activeStickyId, recentStickyId, updateActiveStickyId, fetchRecentSticky, toggleShowNewSticky } =
    useSticky();
  const { toggleAllStickiesModal, allStickiesModal } = useCommandPalette();
  // derived values
  const recentStickyBackgroundColor = recentStickyId
    ? STICKY_COLORS_LIST.find((c) => c.key === stickies[recentStickyId].background_color)?.backgroundColor
    : STICKY_COLORS_LIST[0].backgroundColor;

  useSWR(
    workspaceSlug ? `WORKSPACE_STICKIES_RECENT_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchRecentSticky(workspaceSlug.toString()) : null
  );

  useOutsideClickDetector(ref, () => {
    setNewSticky(false);
    setShowRecentSticky(false);
    setIsExpanded(false);
  });

  const recentStickyButton = (
    <button
      className="btn btn--icon shadow-sm flex h-10 w-10 items-center justify-center rounded-full bg-surface-1"
      onClick={() => setShowRecentSticky(true)}
      style={{ color: recentStickyBackgroundColor }}
    >
      <StickyNoteOutline className={cn("size-5 rotate-90")} color={recentStickyBackgroundColor} />
    </button>
  );

  return (
    <div
      ref={ref}
      className="sticky-action-bar__item flex flex-col overflow-hidden rounded-full border-2 border-accent-strong/10 bg-surface-2 p-[2px]"
    >
      <div
        className={`flex origin-bottom flex-col gap-2 transition-all duration-300 ease-in-out ${isExpanded ? "mb-2 scale-y-100 opacity-100 " : "h-0 scale-y-0 opacity-0"}`}
      >
        <Tooltip label="All stickies" side="left">
          <button
            className="btn btn--icon shadow-sm flex h-10 w-10 items-center justify-center rounded-full bg-surface-1"
            onClick={() => toggleAllStickiesModal(true)}
          >
            <MultipleStickyOutline className="size-5 rotate-90 text-tertiary" />
          </button>
        </Tooltip>
        {recentStickyId &&
          (showRecentSticky ? (
            recentStickyButton
          ) : (
            <PreviewCard>
              <PreviewCardTrigger render={recentStickyButton} />
              <PreviewCardContent side="left">
                <div className="relative max-h-[150px] overflow-hidden rounded-lg">
                  <StickyNote
                    className="w-full"
                    workspaceSlug={workspaceSlug.toString()}
                    stickyId={newSticky ? activeStickyId : recentStickyId}
                  />
                  <div
                    className="absolute top-0 right-0 h-full w-full"
                    style={{
                      background: `linear-gradient(to top, ${recentStickyBackgroundColor}, transparent)`,
                    }}
                  />
                </div>
              </PreviewCardContent>
            </PreviewCard>
          ))}
        <Tooltip label="Add sticky" side="left">
          <button
            className="btn btn--icon shadow-sm flex h-10 w-10 items-center justify-center rounded-full bg-surface-1"
            onClick={() => {
              updateActiveStickyId("");
              toggleShowNewSticky(true);
              setNewSticky(true);
            }}
          >
            <AddOutline className="size-5 rotate-90 text-tertiary" />
          </button>
        </Tooltip>
      </div>

      <button
        className={`btn btn--icon shadow-sm flex h-10 w-10 items-center justify-center rounded-full bg-surface-1 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <CloseOutline className="size-5 text-tertiary" />
        ) : (
          <StickyNoteOutline className="size-5 rotate-90 text-tertiary" />
        )}
      </button>

      <div
        className={cn(
          "absolute right-0 bottom-16 z-[20]",
          "transform transition-all duration-300 ease-in-out",
          newSticky || showRecentSticky ? "min-h-[300px] translate-y-[0%]" : "h-0 translate-y-[100%]"
        )}
      >
        {(newSticky || (showRecentSticky && recentStickyId)) && (
          <StickyNote
            className={"w-[290px]"}
            onClose={() => (newSticky ? setNewSticky(false) : setShowRecentSticky(false))}
            workspaceSlug={workspaceSlug.toString()}
            stickyId={newSticky ? activeStickyId : recentStickyId}
          />
        )}
      </div>

      <AllStickiesModal isOpen={allStickiesModal} handleClose={() => toggleAllStickiesModal(false)} />
    </div>
  );
});
