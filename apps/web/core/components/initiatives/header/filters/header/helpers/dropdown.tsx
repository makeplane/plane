/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import React, { Fragment, useState } from "react";
import type { Placement } from "@popperjs/core";
import { usePopper } from "react-popper";
// headless ui
import { Popover, Transition } from "@headlessui/react";
// ui
import { Button } from "@plane/propel/button";

type Props = {
  children: React.ReactNode;
  icon?: React.ReactElement;
  title?: string;
  placement?: Placement;
  disabled?: boolean;
  tabIndex?: number;
  menuButton?: React.ReactNode;
  isFiltersApplied?: boolean;
};

export function FiltersDropdown(props: Props) {
  const {
    children,
    icon,
    title = "Dropdown",
    placement,
    disabled = false,
    tabIndex,
    menuButton,
    isFiltersApplied = false,
  } = props;

  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null);
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: placement ?? "auto",
  });

  return (
    <Popover as="div">
      {({ open }) => (
        <>
          <Popover.Button as={React.Fragment}>
            {menuButton ? (
              <button role="button" ref={setReferenceElement}>
                {menuButton}
              </button>
            ) : (
              <Button
                disabled={disabled}
                ref={setReferenceElement}
                variant="secondary"
                size="lg"
                prependIcon={icon}
                tabIndex={tabIndex}
                className="relative"
              >
                <>
                  <div className={`${open ? "text-primary" : "text-secondary"}`}>
                    <span>{title}</span>
                  </div>
                  {isFiltersApplied && (
                    <span className="absolute h-2 w-2 -right-0.5 -top-0.5 bg-accent-primary rounded-full" />
                  )}
                </>
              </Button>
            )}
          </Popover.Button>
          <Transition
            as={Fragment}
            show={open}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="fixed z-10">
              <div
                className="overflow-hidden rounded-sm border border-subtle-1 bg-surface-1 shadow-raised-200 my-1"
                ref={setPopperElement}
                style={styles.popper}
                {...attributes.popper}
              >
                <div className="flex max-h-[30rem] lg:max-h-[37.5rem] w-[18.75rem] flex-col overflow-hidden">
                  {children}
                </div>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
}
