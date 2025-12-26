import { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react";
import { LockKeyhole, LockKeyholeOpen } from "lucide-react";
// plane imports
import { Tooltip } from "@plane/propel/tooltip";
// hooks
import { usePageOperations } from "@/hooks/use-page-operations";
// store
import type { TPageInstance } from "@/store/pages/base-page";

// Define our lock display states, renaming "icon-only" to "neutral"
type LockDisplayState = "neutral" | "locked" | "unlocked";

type Props = {
  page: TPageInstance;
};

export const PageLockControl = observer(function PageLockControl({ page }: Props) {
  // Initial state: if locked, then "locked", otherwise default to "neutral"
  const [displayState, setDisplayState] = useState<LockDisplayState>(page.is_locked ? "locked" : "neutral");
  // derived values
  const { canCurrentUserLockPage, is_locked } = page;
  // Ref for the transition timer
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref to store the previous value of isLocked for detecting transitions
  const prevLockedRef = useRef(is_locked);
  // page operations
  const {
    pageOperations: { toggleLock },
  } = usePageOperations({
    page,
  });

  // Cleanup any running timer on unmount
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  // Update display state when isLocked changes
  useEffect(() => {
    // Clear any previous timer to avoid overlapping transitions
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Transition logic:
    // If locked, ensure the display state is "locked"
    // If unlocked after being locked, show "unlocked" briefly then revert to "neutral"
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

    // Update the previous locked state
    prevLockedRef.current = is_locked;
  }, [is_locked]);

  if (!canCurrentUserLockPage) return null;

  // Render different UI based on the current display state
  return (
    <>
      {displayState === "neutral" && (
        <Tooltip tooltipContent="Lock" position="bottom">
          <button
            type="button"
            onClick={toggleLock}
            className="flex-shrink-0 size-6 grid place-items-center rounded-sm text-secondary hover:text-primary hover:bg-layer-1 transition-colors"
            aria-label="Lock"
          >
            <LockKeyhole className="size-3.5" />
          </button>
        </Tooltip>
      )}

      {displayState === "locked" && (
        <button
          type="button"
          onClick={toggleLock}
          className="h-6 flex items-center gap-1 px-2 rounded-sm text-accent-primary bg-accent-primary/20 hover:bg-accent-primary/30 transition-colors"
          aria-label="Locked"
        >
          <LockKeyhole className="flex-shrink-0 size-3.5 animate-lock-icon" />
          <span className="text-11 font-medium whitespace-nowrap overflow-hidden transition-all duration-500 ease-out animate-text-slide-in">
            Locked
          </span>
        </button>
      )}

      {displayState === "unlocked" && (
        <div
          className="h-6 flex items-center gap-1 px-2 rounded-sm text-secondary animate-fade-out"
          aria-label="Unlocked"
        >
          <LockKeyholeOpen className="flex-shrink-0 size-3.5 animate-unlock-icon" />
          <span className="text-11 font-medium whitespace-nowrap overflow-hidden transition-all duration-500 ease-out animate-text-slide-in animate-text-fade-out">
            Unlocked
          </span>
        </div>
      )}
    </>
  );
});
