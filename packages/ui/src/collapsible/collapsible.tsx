/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Transition } from "@headlessui/react";
import React, { useState, useEffect, useCallback, useId } from "react";

export type TCollapsibleProps = {
  title: string | React.ReactNode;
  children: React.ReactNode;
  buttonRef?: React.RefObject<HTMLButtonElement>;
  className?: string;
  buttonClassName?: string;
  isOpen?: boolean;
  onToggle?: () => void;
  defaultOpen?: boolean;
  /**
   * Action shown at the right end of the header while the section is open -- typically the
   * "+" of a work item widget.
   *
   * It is rendered as a *sibling* of the toggle button, overlaying its right end, and that
   * is the whole point: anything interactive placed inside `title` ends up inside the toggle
   * button, which is invalid HTML and makes a click on the action collapse the section as
   * well. Pass the action here rather than to `CollapsibleButton`.
   */
  actionElement?: React.ReactNode;
};

export function Collapsible(props: TCollapsibleProps) {
  const { title, children, buttonRef, className, buttonClassName, isOpen, onToggle, defaultOpen, actionElement } =
    props;
  // state
  // eslint-disable-next-line no-unneeded-ternary -- pre-existing, unrelated to this fix
  const [localIsOpen, setLocalIsOpen] = useState<boolean>(isOpen || defaultOpen ? true : false);

  useEffect(() => {
    if (isOpen !== undefined) {
      setLocalIsOpen(isOpen);
    }
  }, [isOpen]);

  // handlers
  const handleOnClick = useCallback(() => {
    if (isOpen !== undefined) {
      if (onToggle) onToggle();
    } else {
      setLocalIsOpen((prev) => !prev);
    }
  }, [isOpen, onToggle]);

  const panelId = useId();

  // Deliberately a plain button rather than headlessui's `Disclosure.Button`.
  //
  // `Disclosure` in headlessui v1 is uncontrolled: it keeps its own open state and derives
  // `aria-expanded` from it. This component does not use that state -- the panel is rendered
  // `static` and its visibility comes from `Transition show={localIsOpen}` -- so the two drift
  // apart, and `aria-expanded` ends up describing a section other than the one on screen. It
  // starts wrong (a section open on mount reports `false`, because headlessui always starts
  // closed) and then *inverts* on every click. Screen readers were told "collapsed" about an
  // open section, and "expanded" about one the user had just closed.
  //
  // v1 offers no `open` prop to fix that from the outside, and everything else `Disclosure`
  // provides here is already bypassed, so driving the ARIA from `localIsOpen` directly is both
  // simpler and the only way to make it truthful.
  const toggle = (
    <button
      ref={buttonRef}
      type="button"
      className={buttonClassName}
      onClick={handleOnClick}
      aria-expanded={localIsOpen}
      // The panel is unmounted while closed, so only claim to control it while it exists.
      aria-controls={localIsOpen ? panelId : undefined}
    >
      {title}
    </button>
  );

  return (
    <div className={className}>
      {actionElement ? (
        // Only wrap when there is an action to place: callers without one keep their exact DOM.
        <div className="relative">
          {toggle}
          {localIsOpen && (
            // `bottom-px` and `pr-2.5` reproduce the box the action used to centre on as a flex
            // child of CollapsibleButton's row: the row's 1px bottom border sits inside its h-12,
            // so spanning the full height would push the action half a pixel down. Its py-3 needs
            // no mirroring -- symmetric padding does not move the centre.
            <div className="absolute top-0 right-0 bottom-px flex items-center pr-2.5">{actionElement}</div>
          )}
        </div>
      ) : (
        toggle
      )}
      <Transition
        show={localIsOpen}
        enter="transition-all duration-300 ease-in-out"
        enterFrom="grid-rows-[0fr] opacity-0"
        enterTo="grid-rows-[1fr] opacity-100"
        leave="transition-all duration-300 ease-in-out"
        leaveFrom="grid-rows-[1fr] opacity-100"
        leaveTo="grid-rows-[0fr] opacity-0"
        className="grid overflow-hidden"
      >
        <div id={panelId} className="min-h-0">
          {children}
        </div>
      </Transition>
    </div>
  );
}
