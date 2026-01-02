import { useState, useEffect } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/navigation";
// plane package imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { Tabs } from "@plane/propel/tabs";
// components
import { cn } from "@plane/utils";
import AnalyticsFilterActions from "@/components/analytics/analytics-filter-actions";
import { PageHead } from "@/components/core/page-title";
// hooks
import { useCommandPalette } from "@/hooks/store/use-command-palette";
import { useProject } from "@/hooks/store/use-project";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
import { useAnalyticsTabs } from "@/plane-web/components/analytics/use-analytics-tabs";
import type { Route } from "./+types/page";

function AnalyticsPage({ params }: Route.ComponentProps) {
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

  const pageTitle = currentWorkspace?.name
    ? t(`workspace_analytics.page_label`, { workspace: currentWorkspace?.name })
    : undefined;

  // permissions
  const canPerformEmptyStateActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const workspaceSlug = params.workspaceSlug;
  const ANALYTICS_TABS = useAnalyticsTabs(workspaceSlug.toString());

  const [selectedTab, setSelectedTab] = useState(tabId || ANALYTICS_TABS[0]?.key);

  useEffect(() => {
    if (tabId) {
      setSelectedTab(tabId);
    }
  }, [tabId]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    router.push(`/${currentWorkspace?.slug}/analytics/${value}`);
  };

  return (
    <>
      <PageHead title={pageTitle} />
      {workspaceProjectIds && (
        <>
          {workspaceProjectIds.length > 0 || loader === "init-loader" ? (
            <div className="flex h-full overflow-hidden ">
              <Tabs value={selectedTab} onValueChange={handleTabChange} className="w-full h-full">
                <div className={"flex flex-col w-full h-full"}>
                  <div
                    className={cn(
                      "px-6 py-2 border-b border-subtle flex items-center gap-4 overflow-hidden w-full justify-between bg-surface-1"
                    )}
                  >
                    <Tabs.List className={"overflow-x-auto flex w-fit h-7"}>
                      {ANALYTICS_TABS.map((tab) => (
                        <Tabs.Trigger
                          key={tab.key}
                          value={tab.key}
                          disabled={tab.isDisabled}
                          size="md"
                          className="px-3 h-6"
                          onClick={() => {
                            if (!tab.isDisabled) {
                              handleTabChange(tab.key);
                            }
                          }}
                        >
                          {tab.label}
                        </Tabs.Trigger>
                      ))}
                    </Tabs.List>

                    <div className="flex-shrink-0">
                      <AnalyticsFilterActions />
                    </div>
                  </div>
                  {ANALYTICS_TABS.map((tab) => (
                    <Tabs.Content
                      key={tab.key}
                      value={tab.key}
                      className={"h-full overflow-hidden overflow-y-auto px-2"}
                    >
                      <tab.content />
                    </Tabs.Content>
                  ))}
                </div>
              </Tabs>
            </div>
          ) : (
            <EmptyStateDetailed
              assetKey="project"
              title={t("workspace_projects.empty_state.no_projects.title")}
              description={t("workspace_projects.empty_state.no_projects.description")}
              actions={[
                {
                  label: "Create a project",
                  onClick: () => {
                    toggleCreateProjectModal(true);
                  },
                  disabled: !canPerformEmptyStateActions,
                },
              ]}
            />
          )}
        </>
      )}
    </>
  );
}

export default observer(AnalyticsPage);
