/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

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
          "px-3 text-body-xs-regular": size === "md",
          "px-2 text-caption-sm-regular": size === "sm",
        },
        className
      )}
    >
      {t("sidebar.pro")}
    </div>
  );
}
