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
  // State to track if lock animation is in progress
  const [isAnimatingLock, setIsAnimatingLock] = useState(false);
  // Track mouse left and came back after locking
  const [mouseReEntered, setMouseReEntered] = useState(false);
  // Track if we just locked the page (for animations)
  const [justLocked, setJustLocked] = useState(false);
  // derived values
  const { canCurrentUserLockPage, is_locked } = page;
  // Ref for the transition timer
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Animation timer ref
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Just locked timer ref
  const justLockedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
  const hasSubpages = page.sub_pages_count !== undefined && page.sub_pages_count > 0;

  const canShowRecursiveOptions = isNestedPagesEnabled(workspaceSlug.toString()) && hasSubpages;

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
      if (justLockedTimerRef.current) clearTimeout(justLockedTimerRef.current);
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

    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }

    if (justLockedTimerRef.current) {
      clearTimeout(justLockedTimerRef.current);
      justLockedTimerRef.current = null;
    }

    if (is_locked && !prevLockedRef.current) {
      // Just changed from unlocked to locked
      setJustLocked(true);
      justLockedTimerRef.current = setTimeout(() => {
        setJustLocked(false);
        justLockedTimerRef.current = null;
      }, 1000); // Animation duration plus some buffer
    }

    if (is_locked) {
      setDisplayState("locked");
      setIsAnimatingLock(true);
      setMouseReEntered(false);
      // Animation duration for lock icon is typically 300-500ms
      animationTimerRef.current = setTimeout(() => {
        setIsAnimatingLock(false);
        animationTimerRef.current = null;
      }, 600);
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
    if (canShowRecursiveOptions) {
      setShowLockOptions((prev) => !prev);
    } else {
      toggleLock({ recursive: false });
      setShowLockOptions(false);
    }
  }, [canShowRecursiveOptions, toggleLock]);

  const handleLockOption = useCallback(
    (recursive: boolean) => {
      toggleLock({ recursive });
      setShowLockOptions(false);
    },
    [toggleLock]
  );

  const handleMouseEnter = useCallback(() => {
    setIsHoveringLocked(true);
    if (!isAnimatingLock) {
      setMouseReEntered(true);
    }
  }, [isAnimatingLock]);

  const handleMouseLeave = useCallback(() => {
    setIsHoveringLocked(false);
  }, []);

  // Common button/text styles to ensure consistent sizing
  const buttonBaseClass =
    "h-6 min-w-[76px] flex items-center justify-center gap-1.5 px-2 rounded transition-colors duration-200 ease-in-out";
  const textBaseClass = "text-xs font-medium leading-none flex items-center relative top-[1px]";

  if (is_locked && !canCurrentUserLockPage) {
    return (
      <Tooltip tooltipContent="You don't have the permission to unlock this page" position="bottom">
        <div
          className={cn(buttonBaseClass, "text-custom-primary-100 bg-custom-primary-100/20 cursor-default")}
          aria-label="Locked"
        >
          <LockKeyhole className="flex-shrink-0 size-3.5" />
          <span className={textBaseClass}>Locked</span>
        </div>
      </Tooltip>
    );
  }

  if (!is_locked && !canCurrentUserLockPage) return null;

  const actionText = is_locked ? "Unlock" : "Lock";

  const shouldShowHoverEffect = isHoveringLocked && !isAnimatingLock && mouseReEntered;

  return (
    <div className="relative">
      {/* Render the correct button based on display state, inlined */}
      {displayState === "neutral" && (
        <Tooltip tooltipContent="Lock page" position="bottom" disabled={canShowRecursiveOptions && showLockOptions}>
          <button
            type="button"
            onClick={handleButtonClick}
            className={cn(
              "flex-shrink-0 size-6 grid place-items-center rounded text-custom-text-200 hover:text-custom-text-100 hover:bg-custom-background-80 transition-colors",
              {
                "bg-custom-background-80 text-custom-text-100": canShowRecursiveOptions && showLockOptions,
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
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className={cn(
            buttonBaseClass,
            "text-custom-primary-100 bg-custom-primary-100/20 hover:bg-custom-primary-100/30",
            {
              "bg-custom-primary-100/30": canShowRecursiveOptions && showLockOptions,
            }
          )}
          aria-label={shouldShowHoverEffect ? "Unlock" : "Locked"}
        >
          {/* Simple icon display - show one or the other */}
          {shouldShowHoverEffect || (canShowRecursiveOptions && showLockOptions) ? (
            <LockKeyholeOpen className="size-3.5 flex-shrink-0" />
          ) : (
            <LockKeyhole className={cn("size-3.5 flex-shrink-0", justLocked && "animate-lock-icon")} />
          )}

          {/* Text element with animation only when just locked */}
          {shouldShowHoverEffect || (canShowRecursiveOptions && showLockOptions) ? (
            <span className={textBaseClass}>Unlock</span>
          ) : (
            <span className={cn(textBaseClass, justLocked && "animate-text-slide-in")}>Locked</span>
          )}
        </button>
      )}
      {displayState === "unlocked" && (
        <div className={cn(buttonBaseClass, "text-custom-text-200 animate-fade-out")} aria-label="Unlocked">
          <LockKeyholeOpen className="size-3.5 flex-shrink-0 animate-unlock-icon" />
          <span className={cn(textBaseClass, "animate-text-slide-in animate-text-fade-out")}>Unlocked</span>
        </div>
      )}

      {canShowRecursiveOptions && showLockOptions && (
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
                    <span className="text-xs leading-none flex items-center">{`Just ${actionText.toLowerCase()} this page`}</span>
                  </button>
                  {hasSubpages && (
                    <button type="button" onClick={() => handleLockOption(true)} className={menuItemClasses}>
                      {is_locked ? (
                        <FolderOpen className="size-3.5 flex-shrink-0" />
                      ) : (
                        <FolderLock className="size-3.5 flex-shrink-0" />
                      )}
                      <span className="text-xs leading-none flex items-center">{`${actionText} page and all subpages`}</span>
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
});
