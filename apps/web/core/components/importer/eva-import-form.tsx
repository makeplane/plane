/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { mutate } from "swr";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IEvaImporterForm, IEvaPreviewResponse, IEvaProjectOption } from "@plane/types";
import { CustomSearchSelect, Input, Spinner, Checkbox } from "@plane/ui";
import { SettingsBoxedControlItem } from "@/components/settings/boxed-control-item";
import { IMPORTER_SERVICES_LIST } from "@/constants/fetch-keys";
import useDebounce from "@/hooks/use-debounce";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
import { EvaImporterService } from "@/services/integrations/eva.service";

const evaImporterService = new EvaImporterService();

type Props = {
  workspaceSlug: string;
};

type FormData = {
  url: string;
  token: string;
  eva_project_id: string;
  import_tasks: boolean;
  import_testcases: boolean;
  plane_tasks_project_id: string;
  plane_testcase_project_id: string;
};

const getCredentialsKey = (url: string, token: string) => `${url}\0${token}`;

export const EvaImportForm = observer(function EvaImportForm(props: Props) {
  const { workspaceSlug } = props;
  const { t } = useTranslation();
  const { joinedProjectIds, getProjectById } = useProject();
  const { allowPermissions } = useUserPermissions();
  const [evaProjects, setEvaProjects] = useState<IEvaProjectOption[]>([]);
  const [preview, setPreview] = useState<IEvaPreviewResponse | null>(null);
  const [isProjectsLoading, setIsProjectsLoading] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [loadedCredentialsKey, setLoadedCredentialsKey] = useState<string | null>(null);

  const canImport = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.WORKSPACE
  );

  const {
    control,
    handleSubmit,
    getValues,
    trigger,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      url: "",
      token: "",
      eva_project_id: "",
      import_tasks: true,
      import_testcases: true,
      plane_tasks_project_id: "",
      plane_testcase_project_id: "",
    },
  });

  const [watchedUrl = "", watchedToken = "", importTasks = true, importTestcases = true] = useWatch({
    control,
    name: ["url", "token", "import_tasks", "import_testcases"],
  });
  const debouncedUrl = useDebounce(watchedUrl, 500);
  const debouncedToken = useDebounce(watchedToken, 500);

  const projectOptions = joinedProjectIds.map((projectId) => {
    const project = getProjectById(projectId);
    return {
      value: projectId,
      query: project?.name ?? projectId,
      content: project?.name ?? projectId,
    };
  });

  const hasPreviewStats = Boolean(preview && "total_tasks" in preview);

  const evaProjectOptions = evaProjects.map((project) => ({
    value: project.id,
    query: `${project.name} (${project.code})`,
    content: `${project.name} (${project.code})`,
  }));

  useEffect(() => {
    let cancelled = false;

    const clearEvaProjectSelection = () => {
      if (getValues("eva_project_id")) {
        setValue("eva_project_id", "", { shouldDirty: false, shouldValidate: false });
      }
    };

    const loadEvaProjects = async () => {
      if (!canImport || !debouncedUrl || !debouncedToken) {
        if (loadedCredentialsKey !== null) {
          setLoadedCredentialsKey(null);
          setEvaProjects([]);
          setPreview(null);
          clearEvaProjectSelection();
        }
        return;
      }

      const credentialsKey = getCredentialsKey(debouncedUrl, debouncedToken);
      if (loadedCredentialsKey === credentialsKey) {
        return;
      }

      const isConnectionValid = await trigger(["url", "token"]);
      if (!isConnectionValid || cancelled) return;

      setIsProjectsLoading(true);

      try {
        const response = await evaImporterService.getEvaPreview(workspaceSlug, {
          url: debouncedUrl,
          token: debouncedToken,
        });

        if (cancelled) return;

        setLoadedCredentialsKey(credentialsKey);
        setEvaProjects(response.projects ?? []);
        setPreview(null);
        clearEvaProjectSelection();
      } catch (error: any) {
        if (cancelled) return;

        setLoadedCredentialsKey(credentialsKey);
        setEvaProjects([]);
        setPreview(null);
        clearEvaProjectSelection();
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("workspace_settings.settings.imports.eva.preview_error"),
          message: error?.error ?? error?.message,
        });
      } finally {
        if (!cancelled) {
          setIsProjectsLoading(false);
        }
      }
    };

    void loadEvaProjects();

    return () => {
      cancelled = true;
    };
  }, [canImport, debouncedToken, debouncedUrl, getValues, loadedCredentialsKey, setValue, t, trigger, workspaceSlug]);

  const handlePreviewClick = async () => {
    setIsPreviewLoading(true);
    try {
      const isFormValid = await trigger(["url", "token", "eva_project_id"]);
      if (!isFormValid) return;

      const formData = getValues();
      const response = await evaImporterService.getEvaPreview(workspaceSlug, {
        url: formData.url,
        token: formData.token,
        eva_project_id: formData.eva_project_id,
      });
      setPreview(response);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workspace_settings.settings.imports.eva.preview_success"),
      });
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.imports.eva.preview_error"),
        message: error?.error ?? error?.message,
      });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleImport = async (formData: FormData) => {
    if (!preview) return;
    if (!formData.import_tasks && !formData.import_testcases) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.imports.eva.import_error"),
        message: t("workspace_settings.settings.imports.eva.import_scope_required"),
      });
      return;
    }
    if (
      formData.import_tasks &&
      formData.import_testcases &&
      formData.plane_tasks_project_id === formData.plane_testcase_project_id
    ) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.imports.eva.import_error"),
        message: t("workspace_settings.settings.imports.eva.projects_must_differ"),
      });
      return;
    }
    setIsImporting(true);
    const payload: IEvaImporterForm = {
      project_id: formData.import_tasks ? formData.plane_tasks_project_id : formData.plane_testcase_project_id,
      metadata: {
        url: formData.url,
        token: formData.token,
        eva_project_id: formData.eva_project_id,
      },
      config: {
        import_tasks: formData.import_tasks,
        import_testcases: formData.import_testcases,
        lists_as_cycles: true,
        fix_versions_as_modules: true,
        testcase_project_id:
          formData.import_tasks && formData.import_testcases ? formData.plane_testcase_project_id : undefined,
      },
      data: {
        users: preview.users,
        invite_users: false,
      },
    };

    try {
      await evaImporterService.createEvaImporter(workspaceSlug, payload);
      mutate(IMPORTER_SERVICES_LIST(workspaceSlug));
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("workspace_settings.settings.imports.eva.import_started"),
      });
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("workspace_settings.settings.imports.eva.import_error"),
        message: error?.error ?? error?.message,
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(handleImport)}>
      <SettingsBoxedControlItem
        title={t("workspace_settings.settings.imports.eva.url")}
        description={t("workspace_settings.settings.imports.eva.url_description")}
        control={
          <Controller
            control={control}
            name="url"
            rules={{ required: true }}
            render={({ field }) => <Input {...field} className="w-72" placeholder="https://eva.example.com" />}
          />
        }
      />
      <SettingsBoxedControlItem
        title={t("workspace_settings.settings.imports.eva.token")}
        description={t("workspace_settings.settings.imports.eva.token_description")}
        control={
          <Controller
            control={control}
            name="token"
            rules={{ required: true }}
            render={({ field }) => <Input {...field} type="password" className="w-72" />}
          />
        }
      />
      <SettingsBoxedControlItem
        title={t("workspace_settings.settings.imports.eva.eva_project")}
        description={t("workspace_settings.settings.imports.eva.eva_project_description")}
        control={
          <Controller
            control={control}
            name="eva_project_id"
            rules={{ required: true }}
            render={({ field: { value, onChange } }) => (
              <CustomSearchSelect
                value={value}
                onChange={onChange}
                options={evaProjectOptions}
                disabled={isProjectsLoading || evaProjectOptions.length === 0}
                input
                label={
                  evaProjectOptions.find((option) => option.value === value)?.content ??
                  t("workspace_settings.settings.imports.eva.select_eva_project")
                }
                className="w-72"
                optionsClassName="w-72"
              />
            )}
          />
        }
      />
      <SettingsBoxedControlItem
        title={t("workspace_settings.settings.imports.eva.import_scope")}
        description={t("workspace_settings.settings.imports.eva.import_scope_description")}
        control={
          <div className="flex flex-col gap-3">
            <Controller
              control={control}
              name="import_tasks"
              render={({ field: { value, onChange } }) => (
                <div className="flex items-start gap-2 text-13 text-secondary">
                  <Checkbox id="eva-import-tasks" checked={value} onChange={() => onChange(!value)} />
                  <label htmlFor="eva-import-tasks">
                    <span className="block text-body-xs-medium text-primary">
                      {t("workspace_settings.settings.imports.eva.import_tasks_option")}
                    </span>
                    <span className="block text-13 text-secondary">
                      {t("workspace_settings.settings.imports.eva.import_tasks_option_description")}
                    </span>
                  </label>
                </div>
              )}
            />
            <Controller
              control={control}
              name="import_testcases"
              render={({ field: { value, onChange } }) => (
                <div className="flex items-start gap-2 text-13 text-secondary">
                  <Checkbox id="eva-import-testcases" checked={value} onChange={() => onChange(!value)} />
                  <label htmlFor="eva-import-testcases">
                    <span className="block text-body-xs-medium text-primary">
                      {t("workspace_settings.settings.imports.eva.import_testcases_option")}
                    </span>
                    <span className="block text-13 text-secondary">
                      {t("workspace_settings.settings.imports.eva.import_testcases_option_description")}
                    </span>
                  </label>
                </div>
              )}
            />
          </div>
        }
      />
      {importTasks && (
        <SettingsBoxedControlItem
          title={t("workspace_settings.settings.imports.eva.tasks_project")}
          description={t("workspace_settings.settings.imports.eva.tasks_project_description")}
          control={
            <Controller
              control={control}
              name="plane_tasks_project_id"
              rules={{ required: importTasks }}
              render={({ field: { value, onChange } }) => (
                <CustomSearchSelect
                  value={value}
                  onChange={onChange}
                  options={projectOptions}
                  input
                  label={
                    projectOptions.find((option) => option.value === value)?.content ??
                    t("workspace_settings.settings.imports.eva.select_tasks_project")
                  }
                  className="w-72"
                  optionsClassName="w-72"
                />
              )}
            />
          }
        />
      )}
      {importTestcases && (
        <SettingsBoxedControlItem
          title={t("workspace_settings.settings.imports.eva.testcase_project")}
          description={t("workspace_settings.settings.imports.eva.testcase_project_description")}
          control={
            <Controller
              control={control}
              name="plane_testcase_project_id"
              rules={{
                required: importTestcases,
                validate: (value) =>
                  !importTasks ||
                  !importTestcases ||
                  value !== getValues("plane_tasks_project_id") ||
                  t("workspace_settings.settings.imports.eva.projects_must_differ"),
              }}
              render={({ field: { value, onChange } }) => (
                <CustomSearchSelect
                  value={value}
                  onChange={onChange}
                  options={projectOptions}
                  input
                  label={
                    projectOptions.find((option) => option.value === value)?.content ??
                    t("workspace_settings.settings.imports.eva.select_testcase_project")
                  }
                  className="w-72"
                  optionsClassName="w-72"
                />
              )}
            />
          }
        />
      )}

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          loading={isPreviewLoading}
          disabled={!canImport || isProjectsLoading || isPreviewLoading}
          onClick={handlePreviewClick}
        >
          {t("workspace_settings.settings.imports.eva.preview")}
        </Button>
        <Button type="submit" loading={isImporting || isSubmitting} disabled={!canImport || !preview}>
          {t("workspace_settings.settings.imports.eva.start_import")}
        </Button>
      </div>

      {isPreviewLoading && (
        <div className="flex items-center justify-center rounded-lg border border-subtle bg-layer-1 p-8">
          <Spinner height="24px" width="24px" />
        </div>
      )}

      {hasPreviewStats && preview && !isPreviewLoading && (
        <div className="rounded-lg border border-subtle bg-layer-1 p-4">
          <h4 className="text-body-sm-medium text-primary">
            {t("workspace_settings.settings.imports.eva.preview_title")}
          </h4>
          <div className="mt-3 grid grid-cols-2 gap-3 text-13 text-secondary md:grid-cols-4">
            <div>
              {t("workspace_settings.settings.imports.eva.tasks")}: {preview.total_tasks ?? 0}
            </div>
            <div>
              {t("workspace_settings.settings.imports.eva.comments")}: {preview.total_comments ?? 0}
            </div>
            <div>
              {t("workspace_settings.settings.imports.eva.testcase_comments")}: {preview.total_testcase_comments ?? 0}
            </div>
            <div>
              {t("workspace_settings.settings.imports.eva.attachments")}: {preview.total_attachments ?? 0}
            </div>
            <div>
              {t("workspace_settings.settings.imports.eva.documents")}: {preview.total_documents ?? 0}
            </div>
            <div>
              {t("workspace_settings.settings.imports.eva.testcases")}: {preview.total_testcases ?? 0}
            </div>
            <div>
              {t("workspace_settings.settings.imports.eva.labels")}: {preview.total_labels ?? 0}
            </div>
            <div>
              {t("workspace_settings.settings.imports.eva.users")}: {preview.total_users ?? 0}
            </div>
            <div>
              {t("workspace_settings.settings.imports.eva.cycles")}: {preview.total_cycles ?? 0}
            </div>
          </div>
        </div>
      )}
    </form>
  );
});
