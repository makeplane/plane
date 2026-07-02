/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { mutate } from "swr";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IJiraImporterForm, IJiraPreviewResponse } from "@plane/types";
import { CustomSearchSelect, Input, Spinner } from "@plane/ui";
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
import { IMPORTER_SERVICES_LIST } from "@plane/constants";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { JiraImporterService } from "@/services/integrations/jira.service";
import { JiraRtmTokenGuide } from "./jira-rtm-token-guide";

const jiraImporterService = new JiraImporterService();

type Props = {
  workspaceSlug: string;
};

type FormData = {
  cloud_hostname: string;
  email: string;
  api_token: string;
  project_key: string;
  issue_type_name: string;
  jql: string;
  plane_project_id: string;
  rtm_api_base_url: string;
  rtm_api_token: string;
};

export const JiraRtmImportForm = observer(function JiraRtmImportForm(props: Props) {
  const { workspaceSlug } = props;
  const { t } = useTranslation();
  const { joinedProjectIds, getProjectById } = useProject();
  const { allowPermissions } = useUserPermissions();
  const [preview, setPreview] = useState<IJiraPreviewResponse | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const canImport = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const {
    control,
    handleSubmit,
    getValues,
    trigger,
    formState: { isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      cloud_hostname: "",
      email: "",
      api_token: "",
      project_key: "",
      issue_type_name: "Test Case",
      jql: "",
      plane_project_id: "",
      rtm_api_base_url: "",
      rtm_api_token: "",
    },
  });

  const projectOptions = joinedProjectIds.map((projectId) => {
    const project = getProjectById(projectId);
    return {
      value: projectId,
      query: project?.name ?? projectId,
      content: project?.name ?? projectId,
    };
  });

  const handlePreviewClick = async () => {
    setIsPreviewLoading(true);
    try {
      const isFormValid = await trigger(["cloud_hostname", "email", "api_token", "project_key", "issue_type_name"]);
      if (!isFormValid) return;

      const formData = getValues();
      const response = await jiraImporterService.getJiraPreview(workspaceSlug, {
        cloud_hostname: formData.cloud_hostname,
        email: formData.email,
        api_token: formData.api_token,
        project_key: formData.project_key,
        issue_type_name: formData.issue_type_name,
        jql: formData.jql || undefined,
        rtm_api_base_url: formData.rtm_api_base_url || undefined,
        rtm_api_token: formData.rtm_api_token || undefined,
      });
      setPreview(response);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workspace_settings.settings.imports.jira_rtm.preview_success"),
      });
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.imports.jira_rtm.preview_error"),
        message: error?.error ?? error?.message,
      });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleImport = async (formData: FormData) => {
    if (!preview) return;
    if (!formData.plane_project_id) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.imports.jira_rtm.import_error"),
        message: t("workspace_settings.settings.imports.jira_rtm.project_required"),
      });
      return;
    }

    setIsImporting(true);
    const payload: IJiraImporterForm = {
      project_id: formData.plane_project_id,
      metadata: {
        cloud_hostname: formData.cloud_hostname,
        email: formData.email,
        api_token: formData.api_token,
        project_key: formData.project_key,
        rtm_api_base_url: formData.rtm_api_base_url || undefined,
        rtm_api_token: formData.rtm_api_token || undefined,
      },
      config: {
        issue_type_name: formData.issue_type_name,
        jql: formData.jql || undefined,
      },
      data: {
        users: preview.users,
        invite_users: false,
      },
    };

    try {
      await jiraImporterService.createJiraImporter(workspaceSlug, payload);
      mutate(IMPORTER_SERVICES_LIST(workspaceSlug));
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workspace_settings.settings.imports.jira_rtm.import_started"),
      });
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.imports.jira_rtm.import_error"),
        message: error?.error ?? error?.message,
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(handleImport)}>
      <SettingsBoxedControlItem
        title={t("workspace_settings.settings.imports.jira_rtm.cloud_hostname")}
        description={t("workspace_settings.settings.imports.jira_rtm.cloud_hostname_description")}
        control={
          <Controller
            control={control}
            name="cloud_hostname"
            rules={{ required: true }}
            render={({ field }) => <Input {...field} className="w-72" placeholder="company.atlassian.net" />}
          />
        }
      />
      <SettingsBoxedControlItem
        title={t("workspace_settings.settings.imports.jira_rtm.email")}
        description={t("workspace_settings.settings.imports.jira_rtm.email_description")}
        control={
          <Controller
            control={control}
            name="email"
            rules={{ required: true }}
            render={({ field }) => <Input {...field} className="w-72" placeholder="user@example.com" />}
          />
        }
      />
      <SettingsBoxedControlItem
        title={t("workspace_settings.settings.imports.jira_rtm.api_token")}
        description={t("workspace_settings.settings.imports.jira_rtm.api_token_description")}
        control={
          <Controller
            control={control}
            name="api_token"
            rules={{ required: true }}
            render={({ field }) => <Input {...field} type="password" className="w-72" />}
          />
        }
      />
      <SettingsBoxedControlItem
        title={t("workspace_settings.settings.imports.jira_rtm.project_key")}
        description={t("workspace_settings.settings.imports.jira_rtm.project_key_description")}
        control={
          <Controller
            control={control}
            name="project_key"
            rules={{ required: true }}
            render={({ field }) => <Input {...field} className="w-72" placeholder="PROJ" />}
          />
        }
      />
      <SettingsBoxedControlItem
        title={t("workspace_settings.settings.imports.jira_rtm.issue_type_name")}
        description={t("workspace_settings.settings.imports.jira_rtm.issue_type_name_description")}
        control={
          <Controller
            control={control}
            name="issue_type_name"
            rules={{ required: true }}
            render={({ field }) => <Input {...field} className="w-72" />}
          />
        }
      />
      <SettingsBoxedControlItem
        title={t("workspace_settings.settings.imports.jira_rtm.jql")}
        description={t("workspace_settings.settings.imports.jira_rtm.jql_description")}
        control={
          <Controller
            control={control}
            name="jql"
            render={({ field }) => (
              <Input
                {...field}
                className="w-72"
                placeholder={t("workspace_settings.settings.imports.jira_rtm.jql_placeholder")}
              />
            )}
          />
        }
      />
      <JiraRtmTokenGuide />
      <SettingsBoxedControlItem
        title={t("workspace_settings.settings.imports.jira_rtm.rtm_api_base_url")}
        description={t("workspace_settings.settings.imports.jira_rtm.rtm_api_base_url_description")}
        control={
          <Controller
            control={control}
            name="rtm_api_base_url"
            render={({ field }) => <Input {...field} className="w-72" placeholder="https://rtm-api.hexygen.com/api" />}
          />
        }
      />
      <SettingsBoxedControlItem
        title={t("workspace_settings.settings.imports.jira_rtm.rtm_api_token")}
        description={t("workspace_settings.settings.imports.jira_rtm.rtm_api_token_description")}
        control={
          <Controller
            control={control}
            name="rtm_api_token"
            render={({ field }) => <Input {...field} type="password" className="w-72" />}
          />
        }
      />
      <SettingsBoxedControlItem
        title={t("workspace_settings.settings.imports.jira_rtm.plane_project")}
        description={t("workspace_settings.settings.imports.jira_rtm.plane_project_description")}
        control={
          <Controller
            control={control}
            name="plane_project_id"
            rules={{ required: true }}
            render={({ field: { value, onChange } }) => (
              <CustomSearchSelect
                value={value}
                onChange={onChange}
                options={projectOptions}
                input
                label={
                  projectOptions.find((option) => option.value === value)?.content ??
                  t("workspace_settings.settings.imports.jira_rtm.select_plane_project")
                }
                className="w-72"
                optionsClassName="w-72"
              />
            )}
          />
        }
      />

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          loading={isPreviewLoading}
          disabled={!canImport || isPreviewLoading}
          onClick={handlePreviewClick}
        >
          {t("workspace_settings.settings.imports.jira_rtm.preview")}
        </Button>
        <Button type="submit" loading={isImporting || isSubmitting} disabled={!canImport || !preview}>
          {t("workspace_settings.settings.imports.jira_rtm.start_import")}
        </Button>
      </div>

      {isPreviewLoading && (
        <div className="flex items-center justify-center rounded-lg border border-subtle bg-layer-1 p-8">
          <Spinner height="24px" width="24px" />
        </div>
      )}

      {preview && !isPreviewLoading && (
        <div className="rounded-lg border border-subtle bg-layer-1 p-4">
          <h4 className="text-body-sm-medium text-primary">
            {t("workspace_settings.settings.imports.jira_rtm.preview_title")}
          </h4>
          {preview.jql && (
            <p className="mt-2 text-11 text-tertiary">
              {t("workspace_settings.settings.imports.jira_rtm.preview_jql")}: {preview.jql}
            </p>
          )}
          <div className="mt-3 grid grid-cols-2 gap-3 text-13 text-secondary md:grid-cols-4">
            <div>
              {t("workspace_settings.settings.imports.jira_rtm.testcases")}: {preview.total_testcases ?? 0}
            </div>
            <div>
              {t("workspace_settings.settings.imports.jira_rtm.comments")}: {preview.total_comments ?? 0}
            </div>
            <div>
              {t("workspace_settings.settings.imports.jira_rtm.labels")}: {preview.total_labels ?? 0}
            </div>
            <div>
              {t("workspace_settings.settings.imports.jira_rtm.users")}: {preview.total_users ?? 0}
            </div>
          </div>
        </div>
      )}
    </form>
  );
});
