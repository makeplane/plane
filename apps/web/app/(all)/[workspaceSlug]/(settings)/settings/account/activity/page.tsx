"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
// ui
import { Button } from "@plane/ui";
// components
import { PageHead } from "@/components/core";
import { DetailedEmptyState } from "@/components/empty-state";
import { ProfileActivityListPage } from "@/components/profile";
// hooks
import { SettingsHeading } from "@/components/settings";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";

const PER_PAGE = 100;

const ProfileActivityPage = observer(() => {
  // states
  const [pageCount, setPageCount] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [resultsCount, setResultsCount] = useState(0);
  const [isEmpty, setIsEmpty] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/profile/activity" });

  const updateTotalPages = (count: number) => setTotalPages(count);

  const updateResultsCount = (count: number) => setResultsCount(count);

  const updateEmptyState = (isEmpty: boolean) => setIsEmpty(isEmpty);

  const handleLoadMore = () => setPageCount((prev) => prev + 1);

  const activityPages: JSX.Element[] = [];
  for (let i = 0; i < pageCount; i++)
    activityPages.push(
      <ProfileActivityListPage
        key={i}
        cursor={`${PER_PAGE}:${i}:0`}
        perPage={PER_PAGE}
        updateResultsCount={updateResultsCount}
        updateTotalPages={updateTotalPages}
        updateEmptyState={updateEmptyState}
      />
    );

  const isLoadMoreVisible = pageCount < totalPages && resultsCount !== 0;

  if (isEmpty) {
    return (
      <div className="flex h-full w-full flex-col">
        <SettingsHeading
          title={t("account_settings.activity.heading")}
          description={t("account_settings.activity.description")}
        />
        <DetailedEmptyState
          title={""}
          description={""}
          assetPath={resolvedPath}
          className="w-full !p-0 justify-center mx-auto min-h-fit"
          size="md"
        />
      </div>
    );
  }

  return (
    <>
      <PageHead title="Profile - Activity" />
      <SettingsHeading
        title={t("account_settings.activity.heading")}
        description={t("account_settings.activity.description")}
      />
      <div className="w-full">{activityPages}</div>
      {isLoadMoreVisible && (
        <div className="flex w-full items-center justify-center text-xs">
          <Button variant="accent-primary" size="sm" onClick={handleLoadMore}>
            {t("load_more")}
          </Button>
        </div>
      )}
    </>
  );
});

export default ProfileActivityPage;
