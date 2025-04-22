"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { LockKeyhole, LockKeyholeOpen, FolderLock, FolderOpen } from "lucide-react";
// plane imports
import { Tooltip } from "@plane/ui";
// utils
import { cn } from "@plane/utils";
// hooks
import { usePageOperations } from "@/hooks/use-page-operations";
// store
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";
import { TPageInstance } from "@/store/pages/base-page";

type LockDisplayState = "neutral" | "locked" | "unlocked";

type Props = {
  page: TPageInstance;
  storeType: EPageStoreType;
};

export const PageLockControl = observer(({ page, storeType }: Props) => {
  // Initial state: if locked, then "locked", otherwise default to "neutral"
  const [displayState, setDisplayState] = useState<LockDisplayState>(page.is_locked ? "locked" : "neutral");
  // Show lock options popup state (Restored)
  const [showLockOptions, setShowLockOptions] = useState(false);
  // Hover state for the locked button
  const [isHoveringLocked, setIsHoveringLocked] = useState(false);
  // derived values
  const { canCurrentUserLockPage, is_locked } = page;
  // Ref for the transition timer
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref to store the previous value of isLocked for detecting transitions
  const prevLockedRef = useRef(is_locked);
  // Lock options ref to detect outside clicks (Restored)
  const lockOptionsRef = useRef<HTMLDivElement>(null);
  // page operations
  const {
    pageOperations: { toggleLock },
  } = usePageOperations({
    page,
  });

  const { workspaceSlug } = useParams();

  const { isNestedPagesEnabled } = usePageStore(storeType);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (lockOptionsRef.current && !lockOptionsRef.current.contains(event.target as Node)) {
        setShowLockOptions(false);
      }
    };

    if (showLockOptions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLockOptions]);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (is_locked) {
      setDisplayState("locked");
    } else if (prevLockedRef.current === true) {
      setDisplayState("unlocked");
      timerRef.current = setTimeout(() => {
        setDisplayState("neutral");
        timerRef.current = null;
      }, 600);
    } else {
      setDisplayState("neutral");
    }

    prevLockedRef.current = is_locked;
  }, [is_locked]);

  const handleButtonClick = useCallback(() => {
    if (isNestedPagesEnabled(workspaceSlug.toString())) {
      setShowLockOptions((prev) => !prev);
    } else {
      toggleLock({ recursive: false });
      setShowLockOptions(false);
    }
  }, [isNestedPagesEnabled, toggleLock, workspaceSlug]);

  const handleLockOption = useCallback(
    (recursive: boolean) => {
      toggleLock({ recursive });
      setShowLockOptions(false);
    },
    [toggleLock]
  );

  if (is_locked && !canCurrentUserLockPage) {
    return (
      <Tooltip tooltipContent="You don't have the permission to unlock this page" position="bottom">
        <div
          className="h-6 flex items-center gap-1 px-2 rounded text-custom-primary-100 bg-custom-primary-100/20 cursor-default"
          aria-label="Locked"
        >
          <LockKeyhole className="flex-shrink-0 size-3.5" />
          <span className="text-xs font-medium whitespace-nowrap">Locked</span>
        </div>
      </Tooltip>
    );
  }

  if (!is_locked && !canCurrentUserLockPage) return null;

  const actionText = is_locked ? "Unlock" : "Lock";

  return (
    <div className="relative">
      {/* Render the correct button based on display state, inlined */}
      {displayState === "neutral" && (
        <Tooltip tooltipContent="Lock page" position="bottom" disabled={showLockOptions}>
          <button
            type="button"
            onClick={handleButtonClick}
            className={cn(
              "flex-shrink-0 size-6 grid place-items-center rounded text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-80 transition-colors",
              {
                "bg-custom-background-80 text-custom-text-100":
                  isNestedPagesEnabled(workspaceSlug.toString()) && showLockOptions,
              }
            )}
            aria-label="Lock"
          >
            <LockKeyhole className="size-3.5" />
          </button>
        </Tooltip>
      )}
      {displayState === "locked" && (
        <button
          type="button"
          onClick={handleButtonClick}
          onMouseEnter={() => setIsHoveringLocked(true)}
          onMouseLeave={() => setIsHoveringLocked(false)}
          className={cn(
            "h-6 flex items-center gap-1 px-2 rounded text-custom-primary-100 bg-custom-primary-100/20 hover:bg-custom-primary-100/30 transition-colors duration-200 ease-in-out",
            {
              "bg-custom-primary-100/30": isNestedPagesEnabled(workspaceSlug.toString()) && showLockOptions,
            }
          )}
          aria-label={isHoveringLocked ? "Unlock" : "Locked"}
        >
          <div className="relative flex-shrink-0 size-3.5 overflow-hidden">
            <LockKeyhole
              className={cn(
                "absolute inset-0 size-3.5 transition-opacity duration-200 ease-in-out",
                isHoveringLocked || (isNestedPagesEnabled(workspaceSlug.toString()) && showLockOptions)
                  ? "opacity-0"
                  : "opacity-100 animate-lock-icon"
              )}
            />
            <LockKeyholeOpen
              className={cn(
                "absolute inset-0 size-3.5 transition-opacity duration-200 ease-in-out",
                isHoveringLocked || (isNestedPagesEnabled(workspaceSlug.toString()) && showLockOptions)
                  ? "opacity-100"
                  : "opacity-0"
              )}
            />
          </div>
          <span className="relative text-xs font-medium whitespace-nowrap overflow-hidden transition-all duration-500 ease-out">
            <span
              className={cn(
                "transition-opacity duration-200 ease-in-out",
                isHoveringLocked || (isNestedPagesEnabled(workspaceSlug.toString()) && showLockOptions)
                  ? "opacity-0"
                  : "opacity-100 animate-text-slide-in"
              )}
            >
              Locked
            </span>
            <span
              className={cn(
                "absolute left-0 top-0 transition-opacity duration-200 ease-in-out",
                isHoveringLocked || (isNestedPagesEnabled(workspaceSlug.toString()) && showLockOptions)
                  ? "opacity-100"
                  : "opacity-0"
              )}
            >
              Unlock
            </span>
          </span>
        </button>
      )}
      {displayState === "unlocked" && (
        <div
          className="h-6 flex items-center gap-1 px-2 rounded text-custom-text-200 animate-fade-out"
          aria-label="Unlocked"
        >
          <LockKeyholeOpen className="flex-shrink-0 size-3.5 animate-unlock-icon" />
          <span className="text-xs font-medium whitespace-nowrap overflow-hidden transition-all duration-500 ease-out animate-text-slide-in animate-text-fade-out">
            Unlocked
          </span>
        </div>
      )}

      {isNestedPagesEnabled(workspaceSlug.toString()) && showLockOptions && (
        <div ref={lockOptionsRef} className="absolute top-full right-0 mt-1 z-10 animate-slide-up">
          <div className="my-1 overflow-hidden rounded-md border-[0.5px] border-custom-border-300 bg-custom-background-100 px-2 py-2.5 text-xs shadow-custom-shadow-rg focus:outline-none min-w-[180px]">
            {(() => {
              const LockIcon = is_locked ? LockKeyholeOpen : LockKeyhole;
              const menuItemClasses =
                "w-full select-none truncate rounded px-1 py-1.5 text-left text-custom-text-200 hover:bg-custom-background-80 hover:text-custom-text-100 focus:outline-none flex items-center gap-2 transition-colors";

              return (
                <>
                  <button type="button" onClick={() => handleLockOption(false)} className={menuItemClasses}>
                    <LockIcon className="size-3.5 flex-shrink-0" />
                    Just {actionText.toLowerCase()} this page
                  </button>
                  <button type="button" onClick={() => handleLockOption(true)} className={menuItemClasses}>
                    {is_locked ? (
                      <FolderOpen className="size-3.5 flex-shrink-0" />
                    ) : (
                      <FolderLock className="size-3.5 flex-shrink-0" />
                    )}
                    {actionText} page and all subpages
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
});
