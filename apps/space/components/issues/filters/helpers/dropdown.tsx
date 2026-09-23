/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type React from "react";
// plane imports
import { toSideAndAlign } from "@plane/blocks/common";
import type { TPopoverMenuPlacement } from "@plane/blocks/common";
import { Button } from "@makeplane/propel/components/button";
import { Popover, PopoverBody, PopoverContent, PopoverTrigger } from "@makeplane/propel/components/popover";

type Props = {
  children: React.ReactNode;
  title?: string;
  placement?: TPopoverMenuPlacement;
};

export function FiltersDropdown(props: Props) {
  const { children, title = "Dropdown", placement = "auto" } = props;
  const { side, align } = toSideAndAlign(placement);

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="secondary" size="sm" stretch="auto" label={title} />} />
      {/* `rich` is the only panel variant that takes arbitrary children; it adds its own padding and a
          320px floor where the legacy panel was a flush 300px. */}
      <PopoverContent variant="rich" side={side} align={align} aria-label={title}>
        <PopoverBody tabIndex={0}>
          <div className="flex max-h-[37.5rem] w-full flex-col overflow-hidden">{children}</div>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
}
