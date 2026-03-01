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

import type { FC } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// assets
import WorkflowsUpgradeDark from "@/app/assets/empty-state/workflows/upgrade-dark.webp?url";
import WorkflowsUpgradeLight from "@/app/assets/empty-state/workflows/upgrade-light.webp?url";
// plane web components
import { UpgradeEmptyStateButton } from "@/components/workspace/upgrade-empty-state-button";

export const WorkflowUpgrade = observer(function WorkflowUpgrade() {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { resolvedTheme } = useTheme();
  // plane hooks
  const { t } = useTranslation();

  return (
    <div
      className={cn("flex flex-col rounded-xl mt-5 xl:flex-row", {
        "bg-gradient-to-l from-[#CFCFCF]  to-[#212121]": resolvedTheme?.includes("dark"),
        "bg-gradient-to-l from-[#EBEBEB] to-[#FAFAFA] border border-strong-1": !resolvedTheme?.includes("dark"),
      })}
    >
      <div className={cn("flex w-full flex-col  justify-center relative p-5 xl:pl-10 xl:min-h-[25rem]")}>
        <div className="flex flex-col w-full xl:max-w-[360px] gap-y-4">
          <div className="text-18 font-semibold">{t("workflows.empty_state.upgrade.title")}</div>
          <div className="font-medium text-tertiary">{t("workflows.empty_state.upgrade.description")}</div>
          <div className="flex mt-6 gap-4 flex-wrap">
            <UpgradeEmptyStateButton workspaceSlug={workspaceSlug?.toString()} flag={E_FEATURE_FLAGS.WORKFLOWS} />
            <Link
              target="_blank"
              href="https://plane.so/contact"
              className={"bg-transparent underline text-13 text-accent-secondary my-auto font-medium"}
              onClick={() => {}}
            >
              {t("common.upgrade_cta.talk_to_sales")}
            </Link>
          </div>
        </div>
      </div>
      <img
        src={resolvedTheme === "dark" ? WorkflowsUpgradeDark : WorkflowsUpgradeLight}
        alt="Workflows upgrade"
        className="max-h-[300px] self-end flex p-5 pb-0 xl:p-0"
      />
    </div>
  );
});
