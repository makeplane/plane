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
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// assets
import CustomerUpgradeDark from "@/app/assets/empty-state/customers/customer-upgrade-dark.webp?url";
import CustomerUpgradeLight from "@/app/assets/empty-state/customers/customer-upgrade-light.webp?url";
// local imports
import { UpgradeEmptyStateButton } from "@/components/workspace/upgrade-empty-state-button";

export const CustomerUpgrade = observer(function CustomerUpgrade() {
  const { workspaceSlug } = useParams();
  const { resolvedTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <>
      <div className="">
        <div
          className={cn("flex flex-col rounded-xl mt-5 xl:flex-row", {
            "bg-gradient-to-l from-[#CFCFCF]  to-[#212121]": resolvedTheme?.includes("dark"),
            "bg-gradient-to-l from-[#EBEBEB] to-[#FAFAFA] border border-strong-1": !resolvedTheme?.includes("dark"),
          })}
        >
          <div className={cn("flex w-full flex-col  justify-center relative p-5 xl:pl-10 xl:min-h-[25rem]")}>
            <div className="w-full xl:max-w-[300px]">
              <div className="text-20/7 font-semibold mb-2 line-">{t("customers.upgrade.title")}</div>
              <div className="text-13">{t("customers.upgrade.description")}</div>
              <div className="mt-6">
                <UpgradeEmptyStateButton workspaceSlug={workspaceSlug?.toString()} flag={E_FEATURE_FLAGS.CUSTOMERS} />
              </div>
            </div>
          </div>
          <img
            src={resolvedTheme === "dark" ? CustomerUpgradeDark : CustomerUpgradeLight}
            alt="Customer upgrade"
            className="max-h-[300px] w-auto self-end flex p-5 pb-0 xl:p-0"
          />
        </div>
      </div>
    </>
  );
});
