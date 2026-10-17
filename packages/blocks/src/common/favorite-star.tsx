/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { StarFilled, StarOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
// helpers
import { cn } from "@plane/utils";

type Props = {
  /** Accessible name for the icon-only toggle; defaults to the translated "Add to favorites". */
  "aria-label"?: string;
  buttonClassName?: string;
  iconClassName?: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  selected: boolean;
};

export function FavoriteStar(props: Props) {
  const { "aria-label": ariaLabel, buttonClassName, iconClassName, onClick, selected } = props;
  const { t } = useTranslation();

  return (
    <IconButton
      type="button"
      variant="ghost"
      size="sm"
      showTooltip={false}
      render={<button className={buttonClassName} />}
      onClick={onClick}
      aria-label={ariaLabel ?? t("add_to_favorites")}
      aria-pressed={selected}
      icon={
        <span aria-hidden="true" className="grid place-items-center">
          <StarOutline
            aria-hidden="true"
            className={cn(
              "col-start-1 row-start-1 h-3.5 w-3.5 transition-opacity motion-reduce:transition-none",
              iconClassName,
              selected ? "opacity-0" : "opacity-100"
            )}
          />
          <StarFilled
            aria-hidden="true"
            className={cn(
              "col-start-1 row-start-1 h-3.5 w-3.5 text-label-yellow-icon-strong transition-opacity motion-reduce:transition-none",
              iconClassName,
              selected ? "opacity-100" : "opacity-0"
            )}
          />
        </span>
      }
    />
  );
}
