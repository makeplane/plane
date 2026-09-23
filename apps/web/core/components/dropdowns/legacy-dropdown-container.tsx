/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode, SyntheticEvent } from "react";
import { useMemo } from "react";
// plane imports
import { toSideAndAlign } from "@plane/blocks/common";
import type { TPopoverMenuPlacement } from "@plane/blocks/common";
import { SelectDropdownPlacementContext } from "@plane/blocks/select";
import { cn } from "@plane/utils";

// The legacy dropdowns swallowed their trigger's click (`useDropdown().handleOnClick`), so a
// dropdown sitting in a clickable row, card or link never activated it (Ruling 38). The container
// keeps that for every call site still on a legacy export. Clicks from the portaled popup bubble
// through the React tree to here as well, which keeps option picks off the row the same way.
const swallowClick = (event: SyntheticEvent<HTMLElement>) => {
  event.stopPropagation();
  event.preventDefault();
};

type TLegacyDropdownContainerProps = {
  /** The legacy root `className` (the old `ComboDropDown` wrapper div). */
  className?: string;
  /** Legacy popper placement, applied to the nested Select popup through its placement context. */
  placement?: TPopoverMenuPlacement;
  children: ReactNode;
};

/**
 * Phase-A shell for the legacy dropdown exports (critic C15): the wrapper div the old
 * `ComboDropDown` rendered, with its click isolation and popup placement. Deleted with the adapters
 * once every call site renders a `@plane/blocks` binding directly.
 */
export function LegacyDropdownContainer(props: TLegacyDropdownContainerProps) {
  const { className, placement, children } = props;
  // derived values
  const dropdownPlacement = useMemo(() => (placement ? toSideAndAlign(placement) : null), [placement]);

  const container = (
    <div role="presentation" className={cn("h-full", className)} onClick={swallowClick}>
      {children}
    </div>
  );

  if (!dropdownPlacement) return container;
  return (
    <SelectDropdownPlacementContext.Provider value={dropdownPlacement}>
      {container}
    </SelectDropdownPlacementContext.Provider>
  );
}
