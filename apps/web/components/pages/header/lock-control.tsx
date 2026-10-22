/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState, useEffect, useRef } from "react";
import { observer } from "mobx-react";
import { LockedOutline, UnlockedOutline } from "@makeplane/propel/icons";
// plane imports
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import { Badge } from "@makeplane/propel/elements/badge";
import { Button } from "@makeplane/propel/elements/button";
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
        <Tooltip label="Lock" side="bottom">
          <IconButton
            type="button"
            onClick={toggleLock}
            variant="ghost"
            size="md"
            showTooltip={false}
            aria-label="Lock"
            icon={<Icon icon={LockedOutline} />}
          />
        </Tooltip>
      )}

      {displayState === "locked" && (
        <Button type="button" onClick={toggleLock} variant="secondary" size="md" stretch="auto" aria-label="Locked">
          <Icon icon={<LockedOutline className="animate-lock-icon" />} />
          <span className="animate-text-slide-in overflow-hidden whitespace-nowrap transition-all duration-500 ease-out">
            Locked
          </span>
        </Button>
      )}

      {displayState === "unlocked" && (
        <Badge variant="neutral" size="md" render={<div className="animate-fade-out" />} aria-label="Unlocked">
          <Icon icon={<UnlockedOutline className="animate-unlock-icon" />} />
          <span className="animate-text-slide-in animate-text-fade-out overflow-hidden whitespace-nowrap transition-all duration-500 ease-out">
            Unlocked
          </span>
        </Badge>
      )}
    </>
  );
});
