"use client";

import React, { Fragment } from "react";
import { observer } from "mobx-react";
import { useSearchParams } from "next/navigation";
import { Tab } from "@headlessui/react";
// plane package imports
import { ANALYTICS_TABS, EUserPermissionsLevel, EUserPermissions } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Header, EHeaderVariant } from "@plane/ui";
// components
import { CustomAnalytics, ScopeAndDemand } from "@/components/analytics";
import { PageHead } from "@/components/core";
import { ComicBoxButton, DetailedEmptyState } from "@/components/empty-state";
// hooks
import { useCommandPalette, useEventTracker, useProject, useUserPermissions, useWorkspace } from "@/hooks/store";
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";

const AnalyticsPage = observer(() => {
  const searchParams = useSearchParams();
  const analytics_tab = searchParams.get("analytics_tab");
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

  // TODO: refactor loader implementation
  return (
    <>
      <PageHead title={pageTitle} />
      {workspaceProjectIds && (
        <>
          {workspaceProjectIds.length > 0 || loader === "init-loader" ? (
            <div className="flex h-full flex-col overflow-hidden bg-custom-background-100">
              <Tab.Group as={Fragment} defaultIndex={analytics_tab === "custom" ? 1 : 0}>
                <Header variant={EHeaderVariant.SECONDARY}>
                  <Tab.List as="div" className="flex space-x-2 h-full">
                    {ANALYTICS_TABS.map((tab) => (
                      <Tab key={tab.key} as={Fragment}>
                        {({ selected }) => (
                          <button
                            className={`text-sm group relative flex items-center gap-1 h-full px-3 cursor-pointer transition-all font-medium outline-none  ${
                              selected ? "text-custom-primary-100 " : "hover:text-custom-text-200"
                            }`}
                          >
                            {t(tab.i18n_title)}
                            <div
                              className={`border absolute bottom-0 right-0 left-0 rounded-t-md ${selected ? "border-custom-primary-100" : "border-transparent group-hover:border-custom-border-200"}`}
                            />
                          </button>
                        )}
                      </Tab>
                    ))}
                  </Tab.List>
                </Header>
                <Tab.Panels as={Fragment}>
                  <Tab.Panel as={Fragment}>
                    <ScopeAndDemand fullScreen />
                  </Tab.Panel>
                  <Tab.Panel as={Fragment}>
                    <CustomAnalytics fullScreen />
                  </Tab.Panel>
                </Tab.Panels>
              </Tab.Group>
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
