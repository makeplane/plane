/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// helpers
import { cn } from "@plane/utils";
import { StarFilled, StarOutline } from "@makeplane/propel/icons";

type Props = {
  buttonClassName?: string;
  iconClassName?: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  selected: boolean;
};

export function FavoriteStar(props: Props) {
  const { buttonClassName, iconClassName, onClick, selected } = props;

  return (
    <button type="button" className={cn("grid h-4 w-4 place-items-center", buttonClassName)} onClick={onClick}>
      <StarOutline
        aria-hidden="true"
        className={cn(
          "col-start-1 row-start-1 h-4 w-4 text-tertiary transition-opacity motion-reduce:transition-none",
          iconClassName,
          selected ? "opacity-0" : "opacity-100"
        )}
      />
      <StarFilled
        aria-hidden="true"
        className={cn(
          "col-start-1 row-start-1 h-4 w-4 text-(--color-label-yellow-icon) transition-opacity motion-reduce:transition-none",
          iconClassName,
          selected ? "opacity-100" : "opacity-0"
        )}
      />
    </button>
  );
}
