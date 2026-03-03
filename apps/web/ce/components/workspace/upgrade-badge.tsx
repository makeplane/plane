/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { FC } from "react";
// helpers
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";

type TUpgradeBadge = {
  className?: string;
  size?: "sm" | "md";
};

export function UpgradeBadge(props: TUpgradeBadge) {
  const { className, size = "sm" } = props;

  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "w-fit cursor-pointer rounded-2xl bg-accent-primary/20 text-center font-medium text-accent-secondary outline-none",
        {
          "px-3 text-13": size === "md",
          "px-2 text-11": size === "sm",
        },
        className
      )}
    >
      {t("sidebar.pro")}
    </div>
  );
}
