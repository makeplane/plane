/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import useSWR, { mutate } from "swr";
import { RefreshCw } from "lucide-react";
// plane imports
import { EUserPermissions, EUserPermissionsLevel, IMPORTER_SERVICES_LIST } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IJiraResponse, IJiraMetadata, IImporterService, IProject } from "@plane/types";
import { CustomSearchSelect, Input, PasswordInput } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { SettingsHeading } from "@/components/settings/heading";
import { ImportExportSettingsLoader } from "@/components/ui/loader/settings/import-and-export";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUserPermissions } from "@/hooks/store/user";
// services
import { IntegrationService, JiraImporterService } from "@/services/integrations";
// local imports
import { ImportsWorkspaceSettingsHeader } from "./header";

const integrationService = new IntegrationService();
const jiraImporterService = new JiraImporterService();

const JIRA_INITIAL_METADATA: IJiraMetadata = {
  cloud_hostname: "",
  email: "",
  api_token: "",
  project_key: "",
};

const IMPORTABLE_STATUSES = new Set<IImporterService["status"]>(["queued", "processing"]);

function countLabel(value: number | undefined, label: string) {
  return `${value ?? 0} ${label}`;
}

function ImportsPage() {
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const { currentWorkspace } = useWorkspace();
  const { workspaceProjectIds, getProjectById } = useProject();
  const { t } = useTranslation();

  const [metadata, setMetadata] = useState<IJiraMetadata>(JIRA_INITIAL_METADATA);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [preview, setPreview] = useState<IJiraResponse | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const canPerformWorkspaceMemberActions = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );
  const pageTitle = currentWorkspace?.name
    ? `${currentWorkspace.name} - ${t("workspace_settings.settings.imports.title")}`
    : undefined;
  const importerServicesKey = currentWorkspace?.slug ? IMPORTER_SERVICES_LIST(currentWorkspace.slug) : null;
  const { data: importerServices, isLoading } = useSWR(
    importerServicesKey,
    currentWorkspace?.slug ? () => integrationService.getImporterServicesList(currentWorkspace.slug) : null,
    { refreshInterval: (services) => (services?.some((service) => IMPORTABLE_STATUSES.has(service.status)) ? 3000 : 0) }
  );

  const projectOptions = (workspaceProjectIds ?? [])
    .map((projectId) => getProjectById(projectId))
    .filter((project): project is IProject => !!project)
    .map((project) => ({
      value: project.id,
      query: `${project.identifier} ${project.name}`,
      content: (
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-10 text-secondary">{project.identifier}</span>
          <span className="truncate">{project.name}</span>
        </div>
      ),
    }));
  const selectedProject = selectedProjectId ? getProjectById(selectedProjectId) : undefined;
  const jiraImporters = importerServices?.filter((service) => service.service === "jira") ?? [];

  const updateMetadata = (key: keyof IJiraMetadata, value: string) => {
    setPreview(null);
    setMetadata((current) => ({ ...current, [key]: value }));
  };

  const handlePreview = async () => {
    if (!currentWorkspace?.slug) return;
    setIsPreviewing(true);
    try {
      const projectInfo = await jiraImporterService.getJiraProjectInfo(currentWorkspace.slug, metadata);
      setPreview(projectInfo);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workspace_settings.settings.imports.jira.preview_success_title"),
        message: t("workspace_settings.settings.imports.jira.preview_success_message"),
      });
    } catch (_error) {
      setPreview(null);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.imports.jira.preview_failed_title"),
        message: t("workspace_settings.settings.imports.jira.preview_failed_message"),
      });
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleStartImport = async () => {
    if (!currentWorkspace?.slug || !preview || !selectedProjectId) return;
    setIsImporting(true);
    try {
      await jiraImporterService.createJiraImporter(currentWorkspace.slug, {
        project_id: selectedProjectId,
        metadata,
        config: { epics_to_modules: true },
        data: {
          users: preview.users.map((user) => ({
            username: user.displayName,
            email: user.emailAddress,
            import: user.emailAddress ? "invite" : false,
          })),
          invite_users: true,
          total_issues: preview.issues,
          total_labels: preview.labels,
          total_states: preview.states,
          total_modules: preview.modules,
        },
      });
      setMetadata(JIRA_INITIAL_METADATA);
      setPreview(null);
      await mutate(importerServicesKey);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workspace_settings.settings.imports.jira.import_started_title"),
        message: t("workspace_settings.settings.imports.jira.import_started_message"),
      });
    } catch (_error) {
      setMetadata((current) => ({ ...current, api_token: "" }));
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.imports.jira.import_failed_title"),
        message: t("workspace_settings.settings.imports.jira.import_failed_message"),
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleCancelImport = async (service: IImporterService) => {
    if (!currentWorkspace?.slug) return;
    setCancellingId(service.id);
    try {
      await integrationService.deleteImporterService(currentWorkspace.slug, service.service, service.id);
      await mutate(importerServicesKey);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workspace_settings.settings.imports.jira.cancel_success_title"),
        message: t("workspace_settings.settings.imports.jira.cancel_success_message"),
      });
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.imports.jira.cancel_failed_title"),
        message: t("workspace_settings.settings.imports.jira.cancel_failed_message"),
      });
    } finally {
      setCancellingId(null);
    }
  };

  const formComplete =
    metadata.cloud_hostname.trim() && metadata.email.trim() && metadata.api_token.trim() && metadata.project_key.trim();

  if (workspaceUserInfo && !canPerformWorkspaceMemberActions) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }

  return (
    <SettingsContentWrapper header={<ImportsWorkspaceSettingsHeader />} hugging>
      <PageHead title={pageTitle} />
      <div className={cn("flex w-full flex-col gap-y-6", { "opacity-60": !canPerformWorkspaceMemberActions })}>
        <SettingsHeading
          title={t("workspace_settings.settings.imports.heading")}
          description={t("workspace_settings.settings.imports.description")}
        />

        <div className="rounded-lg border border-subtle bg-layer-2">
          <div className="border-b border-subtle px-4 py-3.5">
            <h3 className="text-h6-medium text-primary">{t("workspace_settings.settings.imports.jira.title")}</h3>
            <p className="mt-1 text-13 text-secondary">{t("workspace_settings.settings.imports.jira.description")}</p>
          </div>
          <div className="grid gap-4 p-4 md:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-13 font-medium text-secondary">
              {t("workspace_settings.settings.imports.jira.cloud_hostname")}
              <Input
                value={metadata.cloud_hostname}
                onChange={(e) => updateMetadata("cloud_hostname", e.target.value)}
                placeholder="example.atlassian.net"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-13 font-medium text-secondary">
              {t("workspace_settings.settings.imports.jira.project_key")}
              <Input value={metadata.project_key} onChange={(e) => updateMetadata("project_key", e.target.value)} />
            </label>
            <label className="flex flex-col gap-1.5 text-13 font-medium text-secondary">
              {t("workspace_settings.settings.imports.jira.email")}
              <Input type="email" value={metadata.email} onChange={(e) => updateMetadata("email", e.target.value)} />
            </label>
            <label className="flex flex-col gap-1.5 text-13 font-medium text-secondary">
              {t("workspace_settings.settings.imports.jira.api_token")}
              <PasswordInput
                id="jira-api-token"
                value={metadata.api_token}
                onChange={(value) => updateMetadata("api_token", value)}
                placeholder={t("workspace_settings.settings.imports.jira.api_token_placeholder")}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-13 font-medium text-secondary md:col-span-2">
              {t("workspace_settings.settings.imports.jira.destination_project")}
              <CustomSearchSelect
                value={selectedProjectId}
                onChange={(value: string) => setSelectedProjectId(value)}
                options={projectOptions}
                input
                label={
                  selectedProject
                    ? `${selectedProject.identifier} - ${selectedProject.name}`
                    : t("workspace_settings.settings.imports.jira.select_project")
                }
                optionsClassName="max-w-48 sm:max-w-[532px]"
              />
            </label>
          </div>
          <div className="flex flex-col gap-3 border-t border-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-12 text-secondary">{t("workspace_settings.settings.imports.jira.token_note")}</p>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="secondary"
                disabled={!formComplete || isPreviewing}
                loading={isPreviewing}
                onClick={handlePreview}
              >
                {t("workspace_settings.settings.imports.jira.preview")}
              </Button>
              <Button
                variant="primary"
                disabled={!preview || !selectedProjectId || isImporting}
                loading={isImporting}
                onClick={handleStartImport}
              >
                {t("workspace_settings.settings.imports.jira.start_import")}
              </Button>
            </div>
          </div>
          {preview && (
            <div className="grid gap-3 border-t border-subtle p-4 text-13 text-secondary sm:grid-cols-5">
              <span>{countLabel(preview.issues, t("workspace_settings.settings.imports.jira.issues"))}</span>
              <span>{countLabel(preview.states, t("workspace_settings.settings.imports.jira.states"))}</span>
              <span>{countLabel(preview.labels, t("workspace_settings.settings.imports.jira.labels"))}</span>
              <span>{countLabel(preview.modules, t("workspace_settings.settings.imports.jira.modules"))}</span>
              <span>{countLabel(preview.users.length, t("workspace_settings.settings.imports.jira.users"))}</span>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between border-b border-subtle pb-3.5">
            <h3 className="text-h6-medium text-primary">{t("workspace_settings.settings.imports.previous_imports")}</h3>
            <Button variant="tertiary" className="shrink-0" onClick={() => void mutate(importerServicesKey)}>
              <RefreshCw className="h-3 w-3" />
              {t("refresh_status")}
            </Button>
          </div>
          <div className="flex flex-col">
            {isLoading ? (
              <ImportExportSettingsLoader />
            ) : jiraImporters.length > 0 ? (
              <div className="divide-y divide-subtle-1">
                {jiraImporters.map((service) => (
                  <div
                    key={service.id}
                    className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 text-13 font-medium text-primary">
                        <span>{service.metadata.project_key ?? "Jira"}</span>
                        <span className="rounded bg-layer-1 px-2 py-0.5 text-11 text-secondary capitalize">
                          {service.status}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-12 text-secondary">
                        {service.project_detail?.identifier} - {service.project_detail?.name}
                      </p>
                      <p className="mt-1 text-12 text-tertiary">
                        {countLabel(
                          service.imported_data?.issues ?? service.data.total_issues,
                          t("workspace_settings.settings.imports.jira.issues")
                        )}
                      </p>
                    </div>
                    {IMPORTABLE_STATUSES.has(service.status) && (
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={cancellingId === service.id}
                        onClick={() => void handleCancelImport(service)}
                      >
                        {t("cancel")}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <EmptyStateCompact
                  assetKey="export"
                  title={t("settings_empty_state.imports.title")}
                  description={t("settings_empty_state.imports.description")}
                  align="start"
                  rootClassName="py-20"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </SettingsContentWrapper>
  );
}

export default observer(ImportsPage);
