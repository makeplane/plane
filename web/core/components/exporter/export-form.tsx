import { useState } from "react";
import { intersection } from "lodash";
import { Controller, useForm } from "react-hook-form";
import {
  EUserPermissions,
  EUserPermissionsLevel,
  EXPORTERS_LIST,
  WORKSPACE_SETTINGS_TRACKER_EVENTS,
  WORKSPACE_SETTINGS_TRACKER_ELEMENTS,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button, CustomSearchSelect, CustomSelect, TOAST_TYPE, setToast } from "@plane/ui";
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useProject, useUser, useUserPermissions } from "@/hooks/store";
import { ProjectExportService } from "@/services/project/project-export.service";

type Props = {
  workspaceSlug: string;
  provider: string | null;
  mutateServices: () => void;
};
type FormData = {
  provider: (typeof EXPORTERS_LIST)[0];
  project: string[];
  multiple: boolean;
};
const projectExportService = new ProjectExportService();

export const ExportForm = (props: Props) => {
  // props
  const { workspaceSlug, mutateServices } = props;
  // states
  const [exportLoading, setExportLoading] = useState(false);
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { data: user, canPerformAnyCreateAction, projectsWithCreatePermissions } = useUser();
  const { workspaceProjectIds, getProjectById } = useProject();
  const { t } = useTranslation();
  // form
  const { handleSubmit, control } = useForm<FormData>({
    defaultValues: {
      provider: EXPORTERS_LIST[0],
      project: [],
      multiple: false,
    },
  });
  // derived values
  const hasProjects = workspaceProjectIds && workspaceProjectIds.length > 0;
  const isAdmin = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const wsProjectIdsWithCreatePermisisons = projectsWithCreatePermissions
    ? intersection(workspaceProjectIds, Object.keys(projectsWithCreatePermissions))
    : [];
  const options = wsProjectIdsWithCreatePermisisons?.map((projectId) => {
    const projectDetails = getProjectById(projectId);

    return {
      value: projectDetails?.id,
      query: `${projectDetails?.name} ${projectDetails?.identifier}`,
      content: (
        <div className="flex items-center gap-2">
          <span className="text-[0.65rem] text-custom-text-200 flex-shrink-0">{projectDetails?.identifier}</span>
          <span className="truncate">{projectDetails?.name}</span>
        </div>
      ),
    };
  });

  // handlers
  const ExportCSVToMail = async (formData: FormData) => {
    console.log(formData);
    setExportLoading(true);
    if (workspaceSlug && user) {
      const payload = {
        provider: formData.provider.provider,
        project: formData.project,
        multiple: formData.project.length > 1,
      };
      await projectExportService
        .csvExport(workspaceSlug as string, payload)
        .then(() => {
          mutateServices();
          setExportLoading(false);
          captureSuccess({
            eventName: WORKSPACE_SETTINGS_TRACKER_EVENTS.csv_exported,
            payload: {
              provider: formData.provider.provider,
            },
          });
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("workspace_settings.settings.exports.modal.toasts.success.title"),
            message: t("workspace_settings.settings.exports.modal.toasts.success.message", {
              entity:
                formData.provider.provider === "csv"
                  ? "CSV"
                  : formData.provider.provider === "xlsx"
                    ? "Excel"
                    : formData.provider.provider === "json"
                      ? "JSON"
                      : "",
            }),
          });
        })
        .catch((error) => {
          setExportLoading(false);
          captureError({
            eventName: WORKSPACE_SETTINGS_TRACKER_EVENTS.csv_exported,
            payload: {
              provider: formData.provider.provider,
            },
            error: error as Error,
          });
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("error"),
            message: t("workspace_settings.settings.exports.modal.toasts.error.message"),
          });
        });
    }
  };
  return (
    <form onSubmit={handleSubmit(ExportCSVToMail)} className="flex flex-col gap-4 mt-4">
      <div className="flex gap-4">
        {/* Project Selector */}
        <div className="w-1/2">
          <div className="text-sm font-medium text-custom-text-200 mb-2">
            {t("workspace_settings.settings.exports.exporting_projects")}
          </div>
          <Controller
            control={control}
            name="project"
            disabled={!isAdmin && (!hasProjects || !canPerformAnyCreateAction)}
            render={({ field: { value, onChange } }) => (
              <CustomSearchSelect
                value={value ?? []}
                onChange={(val: string[]) => onChange(val)}
                options={options}
                input
                label={
                  value && value.length > 0
                    ? value
                        .map((projectId) => {
                          const projectDetails = getProjectById(projectId);

                          return projectDetails?.identifier;
                        })
                        .join(", ")
                    : "All projects"
                }
                optionsClassName="max-w-48 sm:max-w-[532px]"
                placement="bottom-end"
                multiple
              />
            )}
          />
        </div>
        {/* Format Selector */}
        <div className="w-1/2">
          <div className="text-sm font-medium text-custom-text-200 mb-2">
            {t("workspace_settings.settings.exports.format")}
          </div>
          <Controller
            control={control}
            name="provider"
            disabled={!isAdmin && (!hasProjects || !canPerformAnyCreateAction)}
            render={({ field: { value, onChange } }) => (
              <CustomSelect
                value={value}
                onChange={onChange}
                label={t(value.i18n_title)}
                optionsClassName="max-w-48 sm:max-w-[532px]"
                placement="bottom-end"
                buttonClassName="py-2 text-sm"
              >
                {EXPORTERS_LIST.map((service) => (
                  <CustomSelect.Option key={service.provider} className="flex items-center gap-2" value={service}>
                    <span className="truncate">{t(service.i18n_title)}</span>
                  </CustomSelect.Option>
                ))}
              </CustomSelect>
            )}
          />
        </div>
      </div>
      <div className="flex items-center justify-between ">
        <Button
          variant="primary"
          type="submit"
          loading={exportLoading}
          data-ph-element={WORKSPACE_SETTINGS_TRACKER_ELEMENTS.EXPORT_BUTTON}
        >
          {exportLoading ? `${t("workspace_settings.settings.exports.exporting")}...` : t("export")}
        </Button>
      </div>
    </form>
  );
};
