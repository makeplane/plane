"use client";

import { useMemo } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
// plane package imports
import { EUserPermissions, EUserPermissionsLevel, PROJECT_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { type TabItem, Tabs } from "@plane/ui";
// components
import AnalyticsFilterActions from "@/components/analytics/analytics-filter-actions";
import { PageHead } from "@/components/core";
import { ComicBoxButton, DetailedEmptyState } from "@/components/empty-state";
// hooks
import { captureClick } from "@/helpers/event-tracker.helper";
import { useCommandPalette, useProject, useUserPermissions, useWorkspace } from "@/hooks/store";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import { getAnalyticsTabs } from "@/plane-web/components/analytics/tabs";

type Props = {
  params: {
    tabId: string;
    workspaceSlug: string;
  };
};

const AnalyticsPage = observer((props: Props) => {
  // props
  const { params } = props;
  const { tabId } = params;

  // hooks
  const router = useRouter();

  // plane imports
  const { t } = useTranslation();

  // store hooks
  const { toggleCreateProjectModal } = useCommandPalette();
  const { workspaceProjectIds, loader } = useProject();
  const { currentWorkspace } = useWorkspace();
  const { allowPermissions } = useUserPermissions();

  // helper hooks
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/onboarding/analytics" });

  // permissions
  const canPerformEmptyStateActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  // derived values
  const pageTitle = currentWorkspace?.name
    ? t(`workspace_analytics.page_label`, { workspace: currentWorkspace?.name })
    : undefined;
  const ANALYTICS_TABS = useMemo(() => getAnalyticsTabs(t), [t]);
  const tabs: TabItem[] = useMemo(
    () =>
      ANALYTICS_TABS.map((tab) => ({
        key: tab.key,
        label: tab.label,
        content: <tab.content />,
        onClick: () => {
          router.push(`/${currentWorkspace?.slug}/analytics/${tab.key}`);
        },
        disabled: tab.isDisabled,
      })),
    [ANALYTICS_TABS, router, currentWorkspace?.slug]
  );
  const defaultTab = tabId || ANALYTICS_TABS[0].key;

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
                tabListClassName="my-2 w-auto"
                tabClassName="px-3"
                tabPanelClassName="h-full overflow-hidden overflow-y-auto px-2"
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
                    toggleCreateProjectModal(true);
                    captureClick({ elementName: PROJECT_TRACKER_ELEMENTS.EMPTY_STATE_CREATE_PROJECT_BUTTON });
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
