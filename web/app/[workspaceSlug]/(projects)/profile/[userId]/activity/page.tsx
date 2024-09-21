"use client";

import { useState } from "react";
import { observer } from "mobx-react";
// ui
import { Button } from "@plane/ui";
// components
import { PageHead } from "@/components/core";
import { DownloadActivityButton, WorkspaceActivityListPage } from "@/components/profile";
// hooks
import { useUserPermissions } from "@/hooks/store";
// plane-web constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";

const PER_PAGE = 100;

const ProfileActivityPage = observer(() => {
  // states
  const [pageCount, setPageCount] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [resultsCount, setResultsCount] = useState(0);
  // router
  const { allowPermissions } = useUserPermissions();

  const updateTotalPages = (count: number) => setTotalPages(count);

  const updateResultsCount = (count: number) => setResultsCount(count);

  const handleLoadMore = () => setPageCount((prev) => prev + 1);

  const activityPages: JSX.Element[] = [];
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

  const canDownloadActivity = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  return (
    <>
      <PageHead title="Profile - Activity" />
      <div className="flex h-full w-full flex-col overflow-hidden py-5">
        <div className="flex items-center justify-between gap-2 px-5 md:px-9">
          <h3 className="text-lg font-medium">Recent activity</h3>
          {canDownloadActivity && <DownloadActivityButton />}
        </div>
        <div className="vertical-scrollbar scrollbar-md flex h-full flex-col overflow-y-auto px-5 md:px-9">
          {activityPages}
          {pageCount < totalPages && resultsCount !== 0 && (
            <div className="flex w-full items-center justify-center text-xs">
              <Button variant="accent-primary" size="sm" onClick={handleLoadMore}>
                Load more
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
});

export default ProfileActivityPage;
