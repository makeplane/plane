import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { observer } from "mobx-react";
import { useTheme } from "next-themes";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
// assets
import darkActivityAsset from "@/app/assets/empty-state/profile/activity-dark.webp?url";
import lightActivityAsset from "@/app/assets/empty-state/profile/activity-light.webp?url";
// components
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
import { ProfileSettingsHeading } from "@/components/settings/profile/heading";
// local imports
import { ActivityProfileSettingsList } from "./activity-list";

const PER_PAGE = 100;

export const ActivityProfileSettings = observer(function ActivityProfileSettings() {
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
      <ActivityProfileSettingsList
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
      <div className="size-full flex flex-col gap-y-7">
        <ProfileSettingsHeading
          title={t("account_settings.activity.heading")}
          description={t("account_settings.activity.description")}
        />
        <DetailedEmptyState
          title={""}
          description={""}
          assetPath={resolvedPath}
          className="w-full p-0! justify-center mx-auto min-h-fit"
          size="base"
        />
      </div>
    );
  }

  return (
    <div className="size-full">
      <ProfileSettingsHeading
        title={t("account_settings.activity.heading")}
        description={t("account_settings.activity.description")}
      />
      <div className="mt-7 w-full">{activityPages}</div>
      {isLoadMoreVisible && (
        <div className="flex w-full items-center justify-center mt-4">
          <Button variant="ghost" onClick={handleLoadMore} appendIcon={<ChevronDown />}>
            {t("load_more")}
          </Button>
        </div>
      )}
    </div>
  );
});
