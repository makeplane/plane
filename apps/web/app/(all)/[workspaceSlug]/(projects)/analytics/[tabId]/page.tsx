"use client";

import { useMemo } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
// plane package imports
import { EUserPermissions, EUserPermissionsLevel, PROJECT_TRACKER_ELEMENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TAnalyticsTabsBase } from "@plane/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@plane/propel/tabs";
// components
import AnalyticsFilterActions from "@/components/analytics/analytics-filter-actions";
import { PageHead } from "@/components/core/page-title";
import { ComicBoxButton } from "@/components/empty-state/comic-box-button";
import { DetailedEmptyState } from "@/components/empty-state/detailed-empty-state-root";
// hooks
import { captureClick } from "@/helpers/event-tracker.helper";
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useProject } from "@/hooks/store/use-project";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
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
  const defaultTab = (tabId as TAnalyticsTabsBase) || ANALYTICS_TABS[0].key;

  const handleTabChange = (value: TAnalyticsTabsBase) => {
    router.push(`/${currentWorkspace?.slug}/analytics/${value}`);
  };

  return (
    <>
      <PageHead title={pageTitle} />
      {workspaceProjectIds && (
        <>
          {workspaceProjectIds.length > 0 || loader === "init-loader" ? (
            <div className="flex h-full overflow-hidden bg-custom-background-100 justify-between items-center">
              <Tabs value={defaultTab} onValueChange={handleTabChange} className="flex flex-col w-full h-full">
                <div className="px-6 py-2 border-b border-custom-border-200 flex items-center justify-between">
                  <TabsList className="my-2 w-auto">
                    {ANALYTICS_TABS.map((tab) => (
                      <TabsTrigger key={tab.key} value={tab.key} size="md" className="px-3" disabled={tab.isDisabled}>
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <AnalyticsFilterActions />
                </div>

                {ANALYTICS_TABS.map((tab) => (
                  <TabsContent key={tab.key} value={tab.key} className="h-full overflow-hidden overflow-y-auto px-2">
                    <tab.content />
                  </TabsContent>
                ))}
              </Tabs>
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
