/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Star } from "lucide-react";
import React from "react";
// helpers
import { cn } from "./utils";

type Props = {
  ariaLabel?: string;
  buttonClassName?: string;
  iconClassName?: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  selected: boolean;
};

export function FavoriteStar(props: Props) {
  const { ariaLabel, buttonClassName, iconClassName, onClick, selected } = props;
  const label = ariaLabel ?? (selected ? "Remove from favorites" : "Add to favorites");

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      className={cn("grid h-4 w-4 place-items-center", buttonClassName)}
      onClick={onClick}
    >
      <Star
        className={cn(
          "h-4 w-4 text-tertiary transition-all",
          {
            "fill-(--color-label-yellow-icon) stroke-(--color-label-yellow-icon)": selected,
          },
          iconClassName
        )}
      />
    </button>
  );
}
