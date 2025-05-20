"use client";

import React from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useTheme } from "next-themes";
import { Briefcase, PieChart, ChartNoAxesCombined, MonitorSmartphone, Download } from "lucide-react";
// plane imports
import { E_FEATURE_FLAGS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ContentWrapper, LayersIcon } from "@plane/ui";
import { cn } from "@plane/utils";
// plane web imports
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import { UpgradeEmptyStateButton } from "@/plane-web/components/workspace";

const CARDS_LIST = [
  {
    key: "card_1",
    icon: Briefcase,
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

export const DashboardsFeatureFlagFallback = observer(() => {
  // router
  const { workspaceSlug } = useParams();
  // translation
  const { t } = useTranslation();
  // next-themes
  const { resolvedTheme } = useTheme();
  // derived values
  const isDarkMode = resolvedTheme === "dark";
  const insideAssetPath = useResolvedAssetPath({ basePath: "/empty-state/dashboards/feature-flag/inside" });
  const outsideAssetPath = useResolvedAssetPath({ basePath: "/empty-state/dashboards/feature-flag/outside" });

  return (
    <ContentWrapper>
      <div
        className={cn("min-h-[25rem] flex item-center justify-between rounded-xl mb-5 lg:mb-12", {
          "bg-gradient-to-l from-[#CFCFCF]  to-[#212121]": isDarkMode,
          "bg-gradient-to-l from-[#3b5ec6] to-[#f5f7fe]": !isDarkMode,
        })}
      >
        <div className="relative flex flex-col justify-center gap-7 px-14 lg:w-1/2">
          <div className="flex max-w-64 flex-col gap-2">
            <h2 className="text-2xl font-semibold">{t("dashboards.empty_state.feature_flag.title")}</h2>
            <p className="text-base font-medium text-custom-text-300">
              {t("dashboards.empty_state.feature_flag.description")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <UpgradeEmptyStateButton workspaceSlug={workspaceSlug?.toString()} flag={E_FEATURE_FLAGS.DASHBOARDS} />
            <a
              href="https://plane.so/contact"
              target="_blank"
              className="bg-transparent underline text-sm text-custom-primary-200 my-auto font-medium"
            >
              {t("common.upgrade_cta.talk_to_sales")}
            </a>
          </div>
        </div>
        <div className="relative hidden w-1/2 lg:block">
          <span className="absolute -bottom-px -right-px rounded-br-xl overflow-hidden">
            <Image src={insideAssetPath} height={420} width={500} alt="r-1" />
          </span>
          <span className="absolute -bottom-4 right-1/2">
            <Image src={outsideAssetPath} height={210} width={280} alt="r-2" />
          </span>
        </div>
      </div>
      <div className="h-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 pb-8">
        {CARDS_LIST.map((item) => (
          <div key={item.key} className="flex min-h-32 w-full flex-col gap-2 rounded-md bg-custom-background-90 p-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium">
                {t(`dashboards.empty_state.feature_flag.${item.key}.title`)}
                {item.comingSoonTitle === true && (
                  <>
                    {" "}
                    <span className="text-custom-primary-100 bg-custom-primary-100/20 rounded px-1 py-0.5 text-xs font-medium">
                      {t("common.coming_soon")}
                    </span>
                  </>
                )}
              </h3>
              <item.icon className="flex-shrink-0 size-4 text-custom-primary-100" />
            </div>
            <p className="text-sm text-custom-text-300">
              {t(`dashboards.empty_state.feature_flag.${item.key}.description`)}
              {item.comingSoonDescription === true && (
                <>
                  {" "}
                  <span className="text-custom-primary-100 bg-custom-primary-100/20 rounded px-1 py-0.5 text-xs font-medium">
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
