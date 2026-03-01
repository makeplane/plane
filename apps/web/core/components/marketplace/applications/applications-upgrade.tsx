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
import { useTheme } from "next-themes";
// plane imports
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
// assets
import TemplatesUpgradeDark from "@/app/assets/empty-state/templates/upgrade-dark.webp?url";
import TemplatesUpgradeLight from "@/app/assets/empty-state/templates/upgrade-light.webp?url";
// components
import { SettingsHeading } from "@/components/settings/heading";

export const ApplicationsUpgrade = observer(function ApplicationsUpgrade() {
  // router
  // store hooks
  const { resolvedTheme } = useTheme();
  // plane hooks
  const { t } = useTranslation();

  return (
    <div className="w-full">
      <SettingsHeading
        title={"Work with your Plane data in third-party apps or you own."}
        description="View all the integrations in use by this workspace or you"
      />
      <div
        className={cn("flex flex-col rounded-xl mt-5 xl:flex-row", {
          "bg-gradient-to-l from-[#CFCFCF]  to-[#212121]": resolvedTheme?.includes("dark"),
          "bg-gradient-to-l from-[#EBEBEB] to-[#FAFAFA] border border-strong-1": !resolvedTheme?.includes("dark"),
        })}
      >
        <div className={cn("flex w-full flex-col  justify-center relative p-5 xl:pl-10 xl:min-h-[25rem]")}>
          <div className="flex flex-col w-full xl:max-w-[360px] gap-y-4">
            <div className="text-18 font-semibold">{t("workspace_settings.settings.applications.title")}</div>
            <div className="font-medium text-tertiary text-13">
              Easily connect with tools like GitHub and Slack to sync your data, automate project updates, and keep your
              team in sync. Streamline your workflow and enhance collaboration with seamless third-party
              integrations.{" "}
            </div>

            <div className="flex mt-6 gap-4 flex-wrap">
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
          src={resolvedTheme === "dark" ? TemplatesUpgradeDark : TemplatesUpgradeLight}
          alt="Templates upgrade"
          className="max-h-[320px] self-end flex p-5 pb-0 xl:p-0 w-auto"
        />
      </div>
    </div>
  );
});
