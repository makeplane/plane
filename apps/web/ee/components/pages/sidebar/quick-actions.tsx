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
import { useParams } from "next/navigation";
import { FilePlus2 } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TPage } from "@plane/types";
import { EPageAccess } from "@plane/types";
// ui
import { SidebarAddButton } from "@/components/sidebar/add-button";
import { useAppRouter } from "@/hooks/use-app-router";
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store/use-page-store";

export const PagesAppSidebarQuickActions = observer(function PagesAppSidebarQuickActions() {
  // states
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  // params
  const { workspaceSlug } = useParams();
  const router = useAppRouter();
  // hooks
  const { createPage } = usePageStore(EPageStoreType.WORKSPACE);
  const { t } = useTranslation();
  // handlers
  const handleCreatePage = async () => {
    try {
      setIsCreatingPage(true);
      const payload: Partial<TPage> = {
        access: EPageAccess.PUBLIC,
      };
      const res = await createPage(payload);
      if (res?.id) {
        const pageId = `/${workspaceSlug}/wiki/${res?.id}`;
        router.push(pageId);
      }
      setIsCreatingPage(false);
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: error?.data?.error || "Page could not be created. Please try again.",
      });
      setIsCreatingPage(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 cursor-pointer">
      <SidebarAddButton
        label={
          <>
            <FilePlus2 className="size-4" />
            <span className="text-body-sm-medium">{isCreatingPage ? t("common.creating") : "New page"}</span>
          </>
        }
        onClick={handleCreatePage}
        disabled={isCreatingPage}
      />
    </div>
  );
});
