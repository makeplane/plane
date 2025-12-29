import { useState } from "react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// assets
import darkActivityAsset from "@/app/assets/empty-state/profile/activity-dark.webp?url";
import lightActivityAsset from "@/app/assets/empty-state/profile/activity-light.webp?url";
// components
import { PageHead } from "@/components/core/page-title";
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
import { ProfileActivityListPage } from "@/components/profile/activity/profile-activity-list";
import { ProfileSettingContentHeader } from "@/components/profile/profile-setting-content-header";
import { ProfileSettingContentWrapper } from "@/components/profile/profile-setting-content-wrapper";

const PER_PAGE = 100;

function ProfileActivityPage() {
  // states
  const [pageCount, setPageCount] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [resultsCount, setResultsCount] = useState(0);
  const [isEmpty, setIsEmpty] = useState(false);
  // theme hook
  const { resolvedTheme } = useTheme();
  // plane hooks
  const { t } = useTranslation();
  // derived values
  const resolvedPath = resolvedTheme === "light" ? lightActivityAsset : darkActivityAsset;

  const updateTotalPages = (count: number) => setTotalPages(count);

  const updateResultsCount = (count: number) => setResultsCount(count);

  const updateEmptyState = (isEmpty: boolean) => setIsEmpty(isEmpty);

  const handleLoadMore = () => setPageCount((prev) => prev + 1);

  const activityPages: React.ReactNode[] = [];
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
      <DetailedEmptyState
        title={t("profile.empty_state.activity.title")}
        description={t("profile.empty_state.activity.description")}
        assetPath={resolvedPath}
      />
    );
  }

  return (
    <>
      <PageHead title="Profile - Activity" />
      <ProfileSettingContentWrapper>
        <ProfileSettingContentHeader title={t("activity")} />
        {activityPages}
        {isLoadMoreVisible && (
          <div className="flex w-full items-center justify-center text-11">
            <Button variant="secondary" onClick={handleLoadMore}>
              {t("load_more")}
            </Button>
          </div>
        )}
      </ProfileSettingContentWrapper>
    </>
  );
}

export default observer(ProfileActivityPage);
