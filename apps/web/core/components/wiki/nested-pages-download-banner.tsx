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
import { CircleAlert } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { setPromiseToast } from "@plane/propel/toast";
import { Button } from "@plane/propel/button";
// plane web imports
import { usePageStore, useWorkspaceSubscription } from "@/plane-web/hooks/store";
import type { EPageStoreType } from "@/plane-web/hooks/store";
// store
import type { TPageInstance } from "@/store/pages/base-page";

type Props = {
  page: TPageInstance;
  storeType: EPageStoreType;
  workspaceSlug: string;
};

export const NestedPagesDownloadBanner = observer(function NestedPagesDownloadBanner(props: Props) {
  const { page, storeType, workspaceSlug } = props;
  // states
  const [isDownloading, setIsDownloading] = useState(false);
  // store hooks
  const { togglePaidPlanModal } = useWorkspaceSubscription();
  const { isNestedPagesEnabled: getIsNestedPagesEnabled } = usePageStore(storeType);
  // derived values
  const { parent_id } = page ?? {};
  const isNestedPagesEnabled = !!getIsNestedPagesEnabled(workspaceSlug);
  const isASubPage = !!parent_id;
  // translation
  const { t } = useTranslation();

  const handleDownload = async () => {
    setIsDownloading(true);
    const response = page.download();
    setPromiseToast(response, {
      loading: "Preparing download",
      success: {
        title: "Successful!",
        message: () =>
          "Page data has been prepared for download. You will receive a link to the download in your email once ready.",
      },
      error: {
        title: "Failed to prepare download",
        message: () => "Failed to prepare download. Please try again later.",
      },
    });
    response.finally(() => {
      setIsDownloading(false);
    });
  };

  const handlePaidPlanPurchaseModalOpen = () => {
    togglePaidPlanModal(true);
  };

  if (isNestedPagesEnabled || !isASubPage) return null;

  return (
    <div className="flex items-center justify-between gap-4 py-3.5 px-4 bg-danger-subtle">
      <div className="flex items-center gap-2 text-danger-primary">
        <CircleAlert className="shrink-0 size-4" />
        <p className="text-13 font-medium">{t("wiki.nested_pages_download_banner.title")}</p>
      </div>
      <div className="shrink-0 flex items-center gap-3">
        <Button variant="secondary" onClick={handleDownload} loading={isDownloading}>
          {isDownloading ? t("wiki.upgrade_flow.download_button.loading") : t("wiki.upgrade_flow.download_button.text")}
        </Button>
        <Button variant="primary" onClick={handlePaidPlanPurchaseModalOpen}>
          {t("wiki.upgrade_flow.upgrade_button.text")}
        </Button>
      </div>
    </div>
  );
});
