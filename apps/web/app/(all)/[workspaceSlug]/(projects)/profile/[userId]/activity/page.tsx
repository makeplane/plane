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
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// components
import { PageHead } from "@/components/core/page-title";
import { DownloadActivityButton } from "@/components/profile/activity/download-button";
import { WorkspaceActivityListPage } from "@/components/profile/activity/workspace-activity-list";
// hooks
import { usePermissionAccess } from "@/hooks/store/use-permission-access";
// types
import type { Route } from "./+types/page";

const PER_PAGE = 100;

function ProfileActivityPage({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug } = params;
  // states
  const [pageCount, setPageCount] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [resultsCount, setResultsCount] = useState(0);
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { can } = usePermissionAccess();
  // derived values
  const canDownloadActivity = can({
    resource: "workspace_user_activity",
    action: "export",
    workspaceSlug,
  });

  const updateTotalPages = (count: number) => setTotalPages(count);

  const updateResultsCount = (count: number) => setResultsCount(count);

  const handleLoadMore = () => setPageCount((prev) => prev + 1);

  const activityPages: React.ReactNode[] = [];
  for (let i = 0; i < pageCount; i++)
    activityPages.push(
      <WorkspaceActivityListPage
        key={i}
        cursor={`${PER_PAGE}:${i}:0`}
        perPage={PER_PAGE}
        updateResultsCount={updateResultsCount}
        updateTotalPages={updateTotalPages}
      />
    );

  return (
    <>
      <PageHead title="Profile - Activity" />
      <div className="flex h-full w-full flex-col overflow-hidden py-5">
        <div className="flex items-center justify-between gap-2 px-5 md:px-9">
          <h3 className="text-16 font-medium">{t("profile.stats.recent_activity.title")}</h3>
          {canDownloadActivity && <DownloadActivityButton />}
        </div>
        <div className="vertical-scrollbar scrollbar-md flex h-full flex-col overflow-y-auto px-5 md:px-9">
          {activityPages}
          {pageCount < totalPages && resultsCount !== 0 && (
            <div className="flex w-full items-center justify-center text-11">
              <Button variant="secondary" onClick={handleLoadMore}>
                {t("common.load_more")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default observer(ProfileActivityPage);
