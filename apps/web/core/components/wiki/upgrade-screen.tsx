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

import { useState } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button, getButtonStyling } from "@plane/propel/button";
import { Tabs } from "@plane/propel/tabs";
import { setPromiseToast } from "@plane/propel/toast";
import { cn } from "@plane/utils";
// assets
import externalEmbedDarkImage from "@/app/assets/wiki-upgrade-flow/external-embeds-dark.png?url";
import externalEmbedLightImage from "@/app/assets/wiki-upgrade-flow/external-embeds-light.png?url";
import inlineCommentsDarkImage from "@/app/assets/wiki-upgrade-flow/inline-comments-dark.png?url";
import inlineCommentsLightImage from "@/app/assets/wiki-upgrade-flow/inline-comments-light.png?url";
import nestedPagesDarkImage from "@/app/assets/wiki-upgrade-flow/nested-pages-dark.png?url";
import nestedPagesLightImage from "@/app/assets/wiki-upgrade-flow/nested-pages-light.png?url";
import publishPagesDarkImage from "@/app/assets/wiki-upgrade-flow/publish-dark.png?url";
import publishPagesLightImage from "@/app/assets/wiki-upgrade-flow/publish-light.png?url";
// plane web imports
import { EPageStoreType, usePageStore, useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { WorkspacePageService } from "@/services/page/workspace-page.service";
// services
const workspacePageService = new WorkspacePageService();

type Props = {
  workspaceSlug: string;
};

const TABS_LIST = [
  {
    key: "nested-pages",
    i18n_label: "wiki.upgrade_flow.tabs.nested_pages",
  },
  {
    key: "add-embeds",
    i18n_label: "wiki.upgrade_flow.tabs.add_embeds",
  },
  {
    key: "publish",
    i18n_label: "wiki.upgrade_flow.tabs.publish_pages",
  },
  {
    key: "comments",
    i18n_label: "wiki.upgrade_flow.tabs.comments",
  },
];

export const WikiUpgradeScreen = observer(function WikiUpgradeScreen(props: Props) {
  const { workspaceSlug } = props;
  // states
  const [isDownloading, setIsDownloading] = useState(false);
  // store hooks
  const { togglePaidPlanModal } = useWorkspaceSubscription();
  const { pagesSummary } = usePageStore(EPageStoreType.WORKSPACE);
  // derived values
  const totalPagesCount =
    (pagesSummary?.public_pages ?? 0) + (pagesSummary?.private_pages ?? 0) + (pagesSummary?.archived_pages ?? 0);
  // translation
  const { t } = useTranslation();
  // theme
  const { resolvedTheme } = useTheme();
  // resolved asset paths
  const nestedPagesImage = resolvedTheme === "light" ? nestedPagesLightImage : nestedPagesDarkImage;
  const externalEmbedImage = resolvedTheme === "light" ? externalEmbedLightImage : externalEmbedDarkImage;
  const publishPagesImage = resolvedTheme === "light" ? publishPagesLightImage : publishPagesDarkImage;
  const inlineCommentsImage = resolvedTheme === "light" ? inlineCommentsLightImage : inlineCommentsDarkImage;
  const getImage = (tabKey: string) => {
    switch (tabKey) {
      case "nested-pages":
        return nestedPagesImage;
      case "add-embeds":
        return externalEmbedImage;
      case "publish":
        return publishPagesImage;
      case "comments":
        return inlineCommentsImage;
      default:
        return nestedPagesImage;
    }
  };

  const handlePaidPlanPurchaseModalOpen = () => {
    togglePaidPlanModal(true);
  };

  const handleDownloadData = () => {
    try {
      setIsDownloading(true);
      const response = workspacePageService.downloadWikiDirectory(workspaceSlug);
      setPromiseToast(response, {
        loading: "Preparing download",
        success: {
          title: "Successful!",
          message: () =>
            "Wiki data has been prepared for download. You will receive a link to the download in your email once ready.",
        },
        error: {
          title: "Failed to prepare download",
          message: () => "Failed to prepare wiki data for download. Please try again later.",
        },
      });
    } catch (error) {
      console.error("Failed to prepare wiki data for download", error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <div className="size-full grid place-items-center px-page-x">
        <div className="w-full md:w-3/4 xl:w-1/2 2xl:w-1/3">
          <div className="text-center">
            <h2 className="text-20 font-semibold">{t("wiki.upgrade_flow.title")}</h2>
            <p className="mt-3 text-secondary text-13 md:text-14">{t("wiki.upgrade_flow.description")}</p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Button variant="primary" onClick={handlePaidPlanPurchaseModalOpen} className="shrink-0">
                {t("wiki.upgrade_flow.upgrade_button.text")}
              </Button>
              {totalPagesCount > 0 ? (
                <Button variant="secondary" onClick={handleDownloadData} loading={isDownloading} className="shrink-0">
                  {isDownloading
                    ? t("wiki.upgrade_flow.download_button.loading")
                    : t("wiki.upgrade_flow.download_button.text")}
                </Button>
              ) : (
                <a
                  href="https://docs.plane.so/core-concepts/pages/wiki"
                  className={cn(getButtonStyling("secondary", "base"), "shrink-0")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("wiki.upgrade_flow.learn_more_button.text")}
                </a>
              )}
            </div>
          </div>
          <div className="mt-10">
            <div>
              <Tabs defaultValue="nested-pages">
                <Tabs.List className="bg-transparent gap-0 mb-6">
                  {TABS_LIST.map((tab) => (
                    <Tabs.Trigger
                      key={tab.key}
                      value={tab.key}
                      className="border-x-0! border-t-0! border-b border-subtle-1 rounded-none data-[selected]:text-accent-primary data-[selected]:border-accent-strong bg-transparent!"
                    >
                      {t(tab.i18n_label)}
                    </Tabs.Trigger>
                  ))}
                </Tabs.List>
                {TABS_LIST.map((tab) => (
                  <Tabs.Content key={tab.key} value={tab.key}>
                    <div
                      className="w-full aspect-[2.14/1] bg-cover bg-center bg-no-repeat"
                      style={{
                        backgroundImage: `url(${getImage(tab.key)})`,
                      }}
                    />
                  </Tabs.Content>
                ))}
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});
