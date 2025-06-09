"use client";

import { useMemo } from "react";
import { observer } from "mobx-react";
import { useRouter, useSearchParams } from "next/navigation";
// plane package imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Tabs } from "@plane/ui";
// components
import AnalyticsFilterActions from "@/components/analytics/analytics-filter-actions";
import { PageHead } from "@/components/core";
import { ComicBoxButton, DetailedEmptyState } from "@/components/empty-state";
// hooks
import { useCommandPalette, useEventTracker, useProject, useUserPermissions, useWorkspace } from "@/hooks/store";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import { ANALYTICS_TABS } from "@/plane-web/components/analytics/tabs";

const AnalyticsPage = observer(() => {
  const router = useRouter();
  const searchParams = useSearchParams();
  // plane imports
  const { t } = useTranslation();
  // store hooks
  const { toggleCreateProjectModal } = useCommandPalette();
  const { setTrackElement } = useEventTracker();
  const { workspaceProjectIds, loader } = useProject();
  const { currentWorkspace } = useWorkspace();
  const { allowPermissions } = useUserPermissions();
  // helper hooks
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/onboarding/analytics" });
  // derived values
  const pageTitle = currentWorkspace?.name
    ? t(`workspace_analytics.page_label`, { workspace: currentWorkspace?.name })
    : undefined;

  // permissions
  const canPerformEmptyStateActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const tabs = useMemo(
    () =>
      ANALYTICS_TABS.map((tab) => ({
        key: tab.key,
        label: t(tab.i18nKey),
        content: <tab.content />,
        onClick: () => {
          router.push(`?tab=${tab.key}`);
        },
      })),
    [router, t]
  );
  const defaultTab = searchParams.get("tab") || ANALYTICS_TABS[0].key;

  return (
    <>
      <PageHead title={pageTitle} />
      {workspaceProjectIds && (
        <>
          {workspaceProjectIds.length > 0 || loader === "init-loader" ? (
            <div className="flex h-full overflow-hidden bg-custom-background-100 justify-between items-center  ">
              <Tabs
                tabs={tabs}
                storageKey={`analytics-page-${currentWorkspace?.id}`}
                defaultTab={defaultTab}
                size="md"
                tabListContainerClassName="px-6 py-2 border-b border-custom-border-200 flex items-center justify-between"
                tabListClassName="my-2 max-w-36"
                tabPanelClassName="h-full w-full overflow-hidden overflow-y-auto"
                storeInLocalStorage={false}
                actions={<AnalyticsFilterActions />}
              />
            </div>
          ) : (
            <DetailedEmptyState
              title={t("workspace_analytics.empty_state.general.title")}
              description={t("workspace_analytics.empty_state.general.description")}
              assetPath={resolvedPath}
              customPrimaryButton={
                <ComicBoxButton
                  label={t("workspace_analytics.empty_state.general.primary_button.text")}
                  title={t("workspace_analytics.empty_state.general.primary_button.comic.title")}
                  description={t("workspace_analytics.empty_state.general.primary_button.comic.description")}
                  onClick={() => {
                    setTrackElement("Analytics empty state");
                    toggleCreateProjectModal(true);
                  }}
                  disabled={!canPerformEmptyStateActions}
                />
              }
            />
          )}
        </>
      )}
    </>
  );
});

export default AnalyticsPage;
