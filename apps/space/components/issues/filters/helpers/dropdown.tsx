/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useState } from "react";
import type { Placement } from "@popperjs/core";
import { Popover } from "@headlessui/react";
// ui
import { Button } from "@plane/propel/button";
import { DropdownPanel } from "@plane/ui";

type Props = {
  children: React.ReactNode;
  title?: string;
  placement?: Placement;
};

export function FiltersDropdown(props: Props) {
  const { children, title = "Dropdown", placement } = props;

  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);

  return (
    <Popover as="div">
      {({ open }) => {
        if (open) {
        }
        return (
          <>
            <Popover.Button as={React.Fragment}>
              <Button ref={setReferenceElement} variant="secondary">
                <div className={`${open ? "text-primary" : "text-secondary"}`}>
                  <span>{title}</span>
                </div>
              </Button>
            </Popover.Button>
            <DropdownPanel open={open} reference={referenceElement} placement={placement ?? "auto"}>
              <Popover.Panel
                static
                className="overflow-hidden rounded-sm border border-subtle bg-surface-1 shadow-raised-200"
              >
                <div className="flex max-h-[37.5rem] w-[18.75rem] flex-col overflow-hidden">{children}</div>
              </Popover.Panel>
            </DropdownPanel>
          </>
        );
      }}
    </Popover>
  );
}
