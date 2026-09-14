/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Popover as HeadlessReactPopover } from "@headlessui/react";
import { MoreVerticalOutline } from "@makeplane/propel/icons";
import type { Ref } from "react";
import React, { useState } from "react";
// components
import { DropdownPanel } from "../dropdowns/dropdown-panel";
// helpers
import { cn } from "../utils";
// types
import type { TPopover } from "./types";

export function Popover(props: TPopover) {
  const {
    popperPosition = "bottom-end",
    popperPadding = 0,
    buttonClassName = "",
    popoverClassName = "",
    button,
    disabled = false,
    panelClassName = "",
    children,
    popoverButtonRef,
    buttonRefClassName = "",
  } = props;
  // states
  const [referenceElement, setReferenceElement] = useState<HTMLDivElement | null>(null);

  return (
    <HeadlessReactPopover className={cn("relative flex h-full w-full items-center justify-center", popoverClassName)}>
      {({ open }) => (
        <>
          <div ref={setReferenceElement} className={cn("w-full", buttonRefClassName)}>
            <HeadlessReactPopover.Button
              ref={popoverButtonRef as Ref<HTMLButtonElement>}
              className={cn(
                {
                  "flex h-6 w-6 items-center justify-center rounded-sm bg-surface-2 text-14 transition-all hover:bg-layer-1":
                    !button,
                },
                buttonClassName
              )}
              disabled={disabled}
            >
              {button ? button : <MoreVerticalOutline className="h-3 w-3" />}
            </HeadlessReactPopover.Button>
          </div>

          <DropdownPanel
            open={open}
            reference={referenceElement}
            placement={popperPosition}
            sideOffset={8}
            collisionPadding={popperPadding}
          >
            <HeadlessReactPopover.Panel static className={cn("w-screen max-w-xs", panelClassName)}>
              {children}
            </HeadlessReactPopover.Panel>
          </DropdownPanel>
        </>
      )}
    </HeadlessReactPopover>
  );
}
