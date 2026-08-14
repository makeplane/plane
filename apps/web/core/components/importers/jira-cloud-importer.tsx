/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { mutate } from "swr";
import { IMPORTER_SERVICES_LIST } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IJiraResponse, IJiraMetadata, IProject } from "@plane/types";
import { CustomSearchSelect, Input, PasswordInput } from "@plane/ui";
import { useProject } from "@/hooks/store/use-project";
import { JiraImporterService } from "@/services/integrations";

const jiraImporterService = new JiraImporterService();

const JIRA_INITIAL_METADATA: IJiraMetadata = {
  cloud_hostname: "",
  email: "",
  api_token: "",
  project_key: "",
};

function countLabel(value: number | undefined, label: string) {
  return `${value ?? 0} ${label}`;
}

type Props = {
  workspaceSlug: string;
};

export const JiraCloudImporter = observer(function JiraCloudImporter(props: Props) {
  const { workspaceSlug } = props;
  const { workspaceProjectIds, getProjectById } = useProject();
  const { t } = useTranslation();

  const [metadata, setMetadata] = useState<IJiraMetadata>(JIRA_INITIAL_METADATA);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [preview, setPreview] = useState<IJiraResponse | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const importerServicesKey = IMPORTER_SERVICES_LIST(workspaceSlug);

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

  const updateMetadata = (key: keyof IJiraMetadata, value: string) => {
    setPreview(null);
    setMetadata((current) => ({ ...current, [key]: value }));
  };

  const handlePreview = async () => {
    setIsPreviewing(true);
    try {
      const projectInfo = await jiraImporterService.getJiraProjectInfo(workspaceSlug, metadata);
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
    if (!preview || !selectedProjectId) return;
    setIsImporting(true);
    try {
      await jiraImporterService.createJiraImporter(workspaceSlug, {
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

  const formComplete =
    metadata.cloud_hostname.trim() && metadata.email.trim() && metadata.api_token.trim() && metadata.project_key.trim();

  return (
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
  );
});
