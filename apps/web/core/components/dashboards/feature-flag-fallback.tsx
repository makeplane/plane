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

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import { PieChart, ChartNoAxesCombined, MonitorSmartphone, Download } from "lucide-react";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { LayersIcon, ProjectIcon } from "@plane/propel/icons";
import { ContentWrapper } from "@plane/ui";
import { cn } from "@plane/utils";
// assets
import ffInsideDark from "@/app/assets/empty-state/dashboards/feature-flag/inside-dark.webp?url";
import ffInsideLight from "@/app/assets/empty-state/dashboards/feature-flag/inside-light.webp?url";
import ffOutsideDark from "@/app/assets/empty-state/dashboards/feature-flag/outside-dark.webp?url";
import ffOutsideLight from "@/app/assets/empty-state/dashboards/feature-flag/outside-light.webp?url";
// plane web imports
import { UpgradeEmptyStateButton } from "@/components/workspace/upgrade-empty-state-button";

const CARDS_LIST = [
  {
    key: "card_1",
    icon: ProjectIcon,
  },
  {
    key: "card_2",
    icon: LayersIcon,
  },
  {
    key: "card_3",
    icon: PieChart,
  },
  {
    key: "card_4",
    icon: ChartNoAxesCombined,
  },
  {
    key: "card_5",
    comingSoonTitle: true,
    icon: Download,
  },
  {
    key: "card_6",
    icon: MonitorSmartphone,
    comingSoonDescription: true,
  },
];

export const DashboardsFeatureFlagFallback = observer(function DashboardsFeatureFlagFallback() {
  // router
  const { workspaceSlug } = useParams();
  // translation
  const { t } = useTranslation();
  // next-themes
  const { resolvedTheme } = useTheme();
  // derived values
  const isDarkMode = resolvedTheme === "dark";
  const insideAssetPath = resolvedTheme === "light" ? ffInsideLight : ffInsideDark;
  const outsideAssetPath = resolvedTheme === "light" ? ffOutsideLight : ffOutsideDark;

  return (
    <ContentWrapper>
      <div
        className={cn("min-h-[25rem] flex item-center justify-between rounded-xl mb-5 lg:mb-12", {
          "bg-gradient-to-l from-[#CFCFCF]  to-[#212121]": isDarkMode,
          "bg-gradient-to-l from-[#EBEBEB] to-[#FAFAFA] border border-strong-1": !isDarkMode,
        })}
      >
        <div className="relative flex flex-col justify-center gap-7 px-14 lg:w-1/2">
          <div className="flex max-w-64 flex-col gap-2">
            <h2 className="text-20 font-semibold">{t("dashboards.empty_state.feature_flag.title")}</h2>
            <p className="text-14 font-medium text-tertiary">{t("dashboards.empty_state.feature_flag.description")}</p>
          </div>
          <div className="flex items-center gap-3">
            <UpgradeEmptyStateButton workspaceSlug={workspaceSlug?.toString()} flag={E_FEATURE_FLAGS.DASHBOARDS} />
            <a
              href="https://plane.so/contact"
              target="_blank"
              className="bg-transparent underline text-13 text-accent-primary my-auto font-medium"
              rel="noreferrer"
            >
              {t("common.upgrade_cta.talk_to_sales")}
            </a>
          </div>
        </div>
        <div className="relative hidden w-1/2 lg:block">
          <span className="absolute -bottom-px -right-px rounded-br-xl overflow-hidden">
            <img src={insideAssetPath} height={420} width={500} alt="r-1" className="w-full h-full object-cover" />
          </span>
          <span className="absolute -bottom-4 right-1/2">
            <img src={outsideAssetPath} height={210} width={280} alt="r-2" className="w-full h-full object-cover" />
          </span>
        </div>
      </div>
      <div className="h-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 pb-8">
        {CARDS_LIST.map((item) => (
          <div key={item.key} className="flex min-h-32 w-full flex-col gap-2 rounded-md bg-layer-1 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium">
                {t(`dashboards.empty_state.feature_flag.${item.key}.title`)}
                {item.comingSoonTitle === true && (
                  <>
                    {" "}
                    <span className="text-accent-primary bg-accent-primary/20 rounded-sm px-1 py-0.5 text-11 font-medium">
                      {t("common.coming_soon")}
                    </span>
                  </>
                )}
              </h3>
              <item.icon className="flex-shrink-0 size-4 text-accent-primary" />
            </div>
            <p className="text-13 text-tertiary">
              {t(`dashboards.empty_state.feature_flag.${item.key}.description`)}
              {item.comingSoonDescription === true && (
                <>
                  {" "}
                  <span className="text-accent-primary bg-accent-primary/20 rounded-sm px-1 py-0.5 text-11 font-medium">
                    {t("dashboards.empty_state.feature_flag.coming_soon_to_mobile")}
                  </span>
                </>
              )}
            </p>
          </div>
        ))}
      </div>
    </ContentWrapper>
  );
});
