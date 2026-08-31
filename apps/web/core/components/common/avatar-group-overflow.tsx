/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// plane imports
import { AvatarGroup, type AvatarGroupSize } from "@makeplane/propel/components/avatar-group";
import { cn } from "@plane/utils";

const OVERFLOW_COUNTER_SIZE: Record<AvatarGroupSize, string> = {
  "2xs": "size-4",
  xs: "size-5",
  sm: "size-6",
};

type Props = {
  children: React.ReactNode;
  /**
   * Shared size for every avatar in the stack.
   */
  size: AvatarGroupSize;
  /**
   * The maximum number of avatars to display. If the number of children exceeds this value, the
   * additional avatars are replaced by a count of the remaining avatars.
   * @default 2
   */
  max?: number;
};

/**
 * An overlapping avatar stack that collapses the tail into a `+N` counter.
 *
 * Propel's `AvatarGroup` renders every child it is given, so the capping behaviour that
 * `@plane/ui`'s `AvatarGroup` provided through `max` lives here as app chrome instead.
 */
export function AvatarGroupOverflow(props: Props) {
  const { children, size, max = 2 } = props;

  const avatars = React.Children.toArray(children);
  const totalAvatars = avatars.length;
  // If there is only one avatar past the limit, render it instead of a "+1" counter.
  const maxAvatarsToRender = totalAvatars <= max + 1 ? max + 1 : max;

  return (
    <AvatarGroup size={size}>
      {avatars.slice(0, maxAvatarsToRender)}
      {maxAvatarsToRender < totalAvatars && (
        <div
          className={cn(
            // `relative` keeps the counter above the preceding avatar, which is itself positioned
            // and would otherwise paint over it through the group's negative spacing.
            "relative grid shrink-0 place-items-center rounded-full border border-subtle bg-accent-subtle text-9 text-accent-primary",
            OVERFLOW_COUNTER_SIZE[size]
          )}
        >
          +{totalAvatars - max}
        </div>
      )}
    </AvatarGroup>
  );
}
