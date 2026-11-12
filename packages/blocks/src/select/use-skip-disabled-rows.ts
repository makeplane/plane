/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useRef } from "react";

/**
 * The navigation keys whose highlight has to walk on past a disabled row, mapped to the arrow that
 * continues in the same direction. `Home` lands on the first row and `End` on the last; when that
 * row is disabled the walk carries on inwards.
 */
const CONTINUE_KEY: Record<string, "ArrowDown" | "ArrowUp"> = {
  ArrowDown: "ArrowDown",
  ArrowUp: "ArrowUp",
  Home: "ArrowDown",
  End: "ArrowUp",
};

type TUseSkipDisabledRowsArgs<T> = {
  /** Whether the popup is open — the key listener is only installed while it is. */
  isOpen: boolean;
  /** The rows base-ui indexes its highlight into, in list order. */
  items: T[];
  getOptionDisabled?: (option: T) => boolean;
};

/**
 * Keeps the keyboard highlight off disabled rows.
 *
 * Base UI's combobox hands its list navigation an empty `disabledIndices`, so the arrow keys land on
 * a disabled row like any other — Enter then does nothing, and the user is left on a row they cannot
 * pick. The legacy Headless UI combobox skipped those rows, and so do we: when a keyboard move
 * highlights a disabled row, the same move is replayed on the focused field so base-ui walks on to
 * the next row. Pointer highlights are left alone — a disabled row already swallows the pointer.
 *
 * Returns the callback `onItemHighlighted` has to call with base-ui's `index` and `reason`.
 */
export function useSkipDisabledRows<T>(args: TUseSkipDisabledRowsArgs<T>) {
  const { isOpen, items, getOptionDisabled } = args;
  // The key behind the move being walked, and how many rows that move has skipped so far — the
  // bound that stops a list with nothing but disabled rows from cycling forever.
  const lastKeyRef = useRef<string | null>(null);
  const skippedRef = useRef(0);
  // Replayed keystrokes, so the listener below does not mistake them for a new move.
  const replayedRef = useRef(new WeakSet<Event>());
  const hasDisabledRows = !!getOptionDisabled;

  useEffect(() => {
    if (!isOpen || !hasDisabledRows) return undefined;
    // Capture phase on the document runs ahead of React's root listener, so the key is known
    // before base-ui moves the highlight for it.
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (replayedRef.current.has(event)) return;
      lastKeyRef.current = event.key in CONTINUE_KEY ? event.key : null;
      skippedRef.current = 0;
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [isOpen, hasDisabledRows]);

  return useCallback(
    (index: number, reason: string) => {
      const key = lastKeyRef.current;
      if (!getOptionDisabled || reason !== "keyboard" || !key || index < 0) return;
      const item = items[index];
      if (item === undefined || !getOptionDisabled(item)) return;
      if (skippedRef.current > items.length) return;
      skippedRef.current += 1;
      const target = document.activeElement;
      if (!target) return;
      const replayKey = CONTINUE_KEY[key];
      // After base-ui has finished committing the move that landed here.
      queueMicrotask(() => {
        const replay = new KeyboardEvent("keydown", { key: replayKey, bubbles: true, cancelable: true });
        replayedRef.current.add(replay);
        target.dispatchEvent(replay);
      });
    },
    [items, getOptionDisabled]
  );
}
