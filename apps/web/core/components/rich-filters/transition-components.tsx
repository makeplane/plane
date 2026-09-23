/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { cn } from "@plane/utils";

/**
 * Where the element is in its enter/leave cycle. `entering` and `left` both wear the "from" end of
 * the animated properties; only the timing classes and whether the element is hidden differ.
 */
type TransitionPhase = "entering" | "entered" | "leaving" | "left";

/**
 * Hand-rolled enter/leave, replacing Headless UI's `Transition` (Ruling 36). The element stays in
 * the DOM for the length of the leave transition so the exit is visible, then unmounts — or, when
 * the caller keeps it mounted, is hidden in place.
 */
function useTransitionPhase(show: boolean, leaveDurationMs: number): TransitionPhase {
  const [phase, setPhase] = useState<TransitionPhase>(show ? "entered" : "left");
  const frameRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearPending = () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      frameRef.current = null;
      timerRef.current = null;
    };
    clearPending();
    if (show) {
      setPhase((current) => (current === "entered" ? current : "entering"));
      // Two frames: the element has to paint in its "from" state before the classes flip, or the
      // browser coalesces both styles into one and no transition runs at all.
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = requestAnimationFrame(() => setPhase("entered"));
      });
    } else {
      setPhase((current) => (current === "left" ? current : "leaving"));
      timerRef.current = setTimeout(() => setPhase("left"), leaveDurationMs);
    }
    return clearPending;
  }, [show, leaveDurationMs]);

  return phase;
}

type CssTransitionProps = {
  children: React.ReactNode;
  show: boolean;
  /** Keeps the subtree mounted while hidden instead of unmounting it. */
  keepMountedWhenHidden?: boolean;
  /** Transition property class, applied in every phase. */
  transitionClassName: string;
  enterClassName: string;
  leaveClassName: string;
  /** The "from" end of the animated properties — worn while entering and once left. */
  fromClassName: string;
  /** The "to" end — worn once entered. */
  toClassName: string;
  leaveDurationMs: number;
};

/**
 * The wrapping `div` Headless UI's `Transition` used to render, with the same enter/leave classes
 * driven off {@link useTransitionPhase} instead.
 */
function CssTransition(props: CssTransitionProps) {
  const {
    children,
    show,
    keepMountedWhenHidden = false,
    transitionClassName,
    enterClassName,
    leaveClassName,
    fromClassName,
    toClassName,
    leaveDurationMs,
  } = props;
  const phase = useTransitionPhase(show, leaveDurationMs);

  if (phase === "left" && !keepMountedWhenHidden) return null;

  return (
    <div
      className={cn(
        transitionClassName,
        phase === "entered" ? toClassName : fromClassName,
        phase === "leaving" || phase === "left" ? leaveClassName : enterClassName
      )}
      hidden={phase === "left"}
    >
      {children}
    </div>
  );
}

type ElementTransitionProps = {
  children: React.ReactNode;
  show: boolean;
};

export const ElementTransition = observer(function ElementTransition(props: ElementTransitionProps) {
  return (
    <CssTransition
      show={props.show}
      transitionClassName="transition"
      enterClassName="duration-200 ease-out"
      leaveClassName="duration-150 ease-in"
      fromClassName="scale-95 opacity-0"
      toClassName="scale-100 opacity-100"
      leaveDurationMs={150}
    >
      {props.children}
    </CssTransition>
  );
});

type RowTransitionProps = {
  children: React.ReactNode;
  show: boolean;
  // Keeps the row's subtree mounted while hidden instead of unmounting it (the transition's default) —
  // each filter pill's dropdown seeds its open/closed state once at mount (e.g. `defaultOpen` on the
  // blocks `Select`), so unmounting on hide and remounting on show would re-run that initializer and
  // pop every empty filter's dropdown open again. Opt-in per surface: it keeps hidden pill subtrees (and
  // any portaled select state) alive, so only set it where that remount is an actual problem.
  keepMountedWhenHidden?: boolean;
};

export const RowTransition = observer(function RowTransition(props: RowTransitionProps) {
  return (
    <CssTransition
      show={props.show}
      keepMountedWhenHidden={props.keepMountedWhenHidden}
      transitionClassName="transition-all"
      enterClassName="duration-150 ease-out"
      leaveClassName="duration-100 ease-in"
      fromClassName="-translate-y-1 opacity-0"
      toClassName="translate-y-0 opacity-100"
      leaveDurationMs={100}
    >
      {props.children}
    </CssTransition>
  );
});
