import { useRef, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Plus, StickyNote as StickyIcon, X } from "lucide-react";
// plane hooks
import { useOutsideClickDetector } from "@plane/hooks";
// plane ui
import { RecentStickyIcon, StickyNoteIcon, Tooltip } from "@plane/ui";
// plane utils
import { cn } from "@plane/utils";
// hooks
import { useCommandPalette } from "@/hooks/store";
import { useSticky } from "@/hooks/use-stickies";
// components
import { STICKY_COLORS_LIST } from "../editor/sticky-editor/color-palette";
import { AllStickiesModal } from "./modal";
import { StickyNote } from "./sticky";

export const StickyActionBar = observer(() => {
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

  return (
    <div
      ref={ref}
      className="sticky-action-bar__item flex flex-col bg-custom-background-90 rounded-full p-[2px] border-2 border-custom-primary-100/10 overflow-hidden"
    >
      <div
        className={`flex flex-col gap-2 transition-all duration-300 ease-in-out origin-bottom ${isExpanded ? "scale-y-100 opacity-100 mb-2 " : "scale-y-0 opacity-0 h-0"}`}
      >
        <Tooltip tooltipContent="All stickies" isMobile={false} position="left">
          <button
            className="btn btn--icon rounded-full w-10 h-10 flex items-center justify-center shadow-sm bg-custom-background-100"
            onClick={() => toggleAllStickiesModal(true)}
          >
            <RecentStickyIcon className="size-5 rotate-90 text-custom-text-350" />
          </button>
        </Tooltip>
        {recentStickyId && (
          <Tooltip
            className="scale-75 -mr-30 translate-x-10"
            tooltipContent={
              <div className="-m-2 max-h-[150px]">
                <StickyNote
                  className={"w-[290px]"}
                  workspaceSlug={workspaceSlug.toString()}
                  stickyId={newSticky ? activeStickyId : recentStickyId || ""}
                />
                <div
                  className="absolute top-0 right-0 h-full w-full"
                  style={{
                    background: `linear-gradient(to top, ${recentStickyBackgroundColor}, transparent)`,
                  }}
                />
              </div>
            }
            isMobile={false}
            position="left"
            disabled={showRecentSticky}
          >
            <button
              className="btn btn--icon rounded-full w-10 h-10 flex items-center justify-center shadow-sm bg-custom-background-100"
              onClick={() => setShowRecentSticky(true)}
              style={{ color: recentStickyBackgroundColor }}
            >
              <StickyNoteIcon className={cn("size-5 rotate-90")} color={recentStickyBackgroundColor} />
            </button>
          </Tooltip>
        )}
        <Tooltip tooltipContent="Add sticky" isMobile={false} position="left">
          <button
            className="btn btn--icon rounded-full w-10 h-10 flex items-center justify-center shadow-sm bg-custom-background-100"
            onClick={() => {
              updateActiveStickyId("");
              toggleShowNewSticky(true);
              setNewSticky(true);
            }}
          >
            <Plus className="size-5 rotate-90 text-custom-text-350" />
          </button>
        </Tooltip>
      </div>

      <button
        className={`btn btn--icon rounded-full w-10 h-10 flex items-center justify-center shadow-sm bg-custom-background-100 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <X className="size-5 text-custom-text-350" />
        ) : (
          <StickyIcon className="size-5 rotate-90 text-custom-text-350" />
        )}
      </button>

      <div
        className={cn(
          "absolute bottom-16 right-0 z-[20]",
          "transform transition-all duration-300 ease-in-out",
          newSticky || showRecentSticky ? "translate-y-[0%] min-h-[300px]" : "translate-y-[100%] h-0"
        )}
      >
        {(newSticky || (showRecentSticky && recentStickyId)) && (
          <StickyNote
            className={"w-[290px]"}
            onClose={() => (newSticky ? setNewSticky(false) : setShowRecentSticky(false))}
            workspaceSlug={workspaceSlug.toString()}
            stickyId={newSticky ? activeStickyId : recentStickyId || ""}
          />
        )}
      </div>

      <AllStickiesModal isOpen={allStickiesModal} handleClose={() => toggleAllStickiesModal(false)} />
    </div>
  );
});
