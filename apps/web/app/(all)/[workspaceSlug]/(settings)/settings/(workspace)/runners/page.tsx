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
import { useParams, useSearchParams } from "next/navigation";
import { Code2, FileCode } from "lucide-react";
// plane imports
import { SILO_BASE_URL, SILO_BASE_PATH } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/ui";
// components
import { PageHead } from "@/components/core/page-title";
import { WithFeatureFlagHOC } from "@/components/feature-flags";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { RunnersDashboard, FunctionsDashboard } from "@/components/runners";
import { useFeatureFlags } from "@/plane-web/hooks/store/use-feature-flags";
import { ScriptsWorkspaceSettingsHeader } from "./header";
import { Button } from "@plane/propel/button";
import { RunnersUpgrade } from "@/components/runners/upgrade";
import { EmptyStateCompact } from "@plane/propel/empty-state";

type TabType = "scripts" | "functions";

const RunnersSettingsPage = observer(function RunnersSettingsPage() {
  const { workspaceSlug } = useParams();
  const searchParams = useSearchParams();
  // store hooks
  const { currentWorkspace } = useWorkspace();
  const { getIntegrations } = useFeatureFlags();
  const { t } = useTranslation();

  // Get active tab from URL or default to scripts
  const activeTabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<TabType>(activeTabParam === "functions" ? "functions" : "scripts");

  // derived values
  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${t("workspace_settings.settings.runners.title")}`
    : undefined;

  const integrations = getIntegrations(workspaceSlug);
  const isRunnerInstalled = integrations.includes("RUNNER" as never);
  const runnerInstallUrl = `${SILO_BASE_URL}${SILO_BASE_PATH}/api/apps/runner/auth/consent-url/`;

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    // Update URL without navigation
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  };

  if (!isRunnerInstalled) {
    return (
      <SettingsContentWrapper header={<ScriptsWorkspaceSettingsHeader />}>
        <PageHead title={pageTitle} />
        <SettingsHeading
          title={t("workspace_settings.settings.runners.title")}
          description={t("workspace_settings.settings.runners.description")}
        />
        <WithFeatureFlagHOC flag="PLANE_RUNNER" fallback={<RunnersUpgrade />} workspaceSlug={workspaceSlug}>
          <EmptyStateCompact
            assetKey="state"
            title="Scripts"
            description="Activate Scripts app to run scripts in features like automations."
            align="start"
            rootClassName="py-20"
            actions={[
              {
                label: "Activate now",
                onClick: () => {
                  window.location.href = runnerInstallUrl;
                },
              },
            ]}
          />
        </WithFeatureFlagHOC>
      </SettingsContentWrapper>
    );
  }

  return (
    <SettingsContentWrapper header={<ScriptsWorkspaceSettingsHeader />}>
      <PageHead title={pageTitle} />
      <div className="w-full space-y-6">
        <SettingsHeading
          title={t("workspace_settings.settings.runners.title")}
          description={t("workspace_settings.settings.runners.description")}
        />
        <WithFeatureFlagHOC flag="PLANE_RUNNER" fallback={<RunnersUpgrade />} workspaceSlug={workspaceSlug}>
          {/* Tab Navigation */}
          <div className="flex items-center gap-3 border-b border-subtle">
            <button
              onClick={() => handleTabChange("scripts")}
              className={cn(
                "py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                activeTab === "scripts"
                  ? "border-primary-dark text-primary"
                  : "border-transparent text-tertiary hover:text-secondary"
              )}
            >
              <Button variant={activeTab === "scripts" ? "tertiary" : "ghost"}>
                <FileCode className="size-3.5" />
                Scripts
              </Button>
            </button>
            <button
              onClick={() => handleTabChange("functions")}
              className={cn(
                "flex items-center gap-1 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
                activeTab === "functions"
                  ? "border-primary-dark text-primary"
                  : "border-transparent text-tertiary hover:text-secondary"
              )}
            >
              <Button variant={activeTab === "functions" ? "tertiary" : "ghost"}>
                <Code2 className="size-3.5" />
                Functions
              </Button>
            </button>
          </div>
          {activeTab === "scripts" ? <RunnersDashboard /> : <FunctionsDashboard />}
        </WithFeatureFlagHOC>
      </div>
    </SettingsContentWrapper>
  );
});

export default RunnersSettingsPage;
