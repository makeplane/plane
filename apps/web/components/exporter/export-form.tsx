/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { intersection } from "lodash-es";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
// import { Info } from "lucide-react";
import {
  EUserPermissions,
  EUserPermissionsLevel,
  EXPORTERS_LIST,
  // ISSUE_DISPLAY_FILTERS_BY_PAGE,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { setToast } from "@plane/blocks/toast";
// import { Tooltip } from "@makeplane/propel/components/tooltip";
// import { EIssuesStoreType } from "@plane/types";
import type { TWorkItemFilterExpression } from "@plane/types";
import { Select, SelectContent, SelectItem, SelectList, SelectTrigger } from "@makeplane/propel/components/select";
// import { WorkspaceLevelWorkItemFiltersHOC } from "@/components/work-item-filters/filters-hoc/workspace-level";
// import { WorkItemFiltersRow } from "@/components/work-item-filters/filters-row";
// components
import { ProjectSelect } from "@/components/dropdowns/project/project-select";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useUser, useUserPermissions } from "@/hooks/store/user";
import { ProjectExportService } from "@/services/project/project-export.service";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
  provider: string | null;
  mutateServices: () => void;
};
type FormData = {
  provider: (typeof EXPORTERS_LIST)[0];
  project: string[];
  multiple: boolean;
  filters: TWorkItemFilterExpression;
};

// const initialWorkItemFilters = {
//   richFilters: {},
//   displayFilters: {},
//   displayProperties: {},
//   kanbanFilters: {
//     group_by: [],
//     sub_group_by: [],
//   },
// };

const projectExportService = new ProjectExportService();

export const ExportForm = observer(function ExportForm(props: Props) {
  // props
  const { isOpen, onClose, workspaceSlug, mutateServices } = props;
  // states
  const [exportLoading, setExportLoading] = useState(false);

  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { data: user, canPerformAnyCreateAction, projectsWithCreatePermissions } = useUser();
  const { workspaceProjectIds, getProjectById } = useProject();
  const { t } = useTranslation();
  // form
  const { handleSubmit, control, reset } = useForm<FormData>({
    defaultValues: {
      provider: EXPORTERS_LIST[0],
      project: [],
      multiple: false,
      filters: {},
    },
  });

  // derived values
  const hasProjects = workspaceProjectIds && workspaceProjectIds.length > 0;
  const isMember = allowPermissions([EUserPermissions.ADMIN, EUserPermissions.MEMBER], EUserPermissionsLevel.WORKSPACE);
  const wsProjectIdsWithCreatePermisisons = projectsWithCreatePermissions
    ? intersection(workspaceProjectIds, Object.keys(projectsWithCreatePermissions))
    : [];
  const wsProjectIdsWithCreatePermissionsSet = new Set(wsProjectIdsWithCreatePermisisons);
  const exporterOptions = EXPORTERS_LIST.map((service) => ({
    label: t(service.i18n_title),
    value: service.provider,
  }));

  // handlers
  const handleClose = () => {
    if (exportLoading) return;
    onClose();
    reset();
  };

  async function ExportCSVToMail(formData: FormData) {
    setExportLoading(true);
    if (workspaceSlug && user) {
      const payload = {
        provider: formData.provider.provider,
        project: formData.project,
        multiple: formData.project.length > 1,
        rich_filters: formData.filters,
      };
      try {
        await projectExportService.csvExport(workspaceSlug, payload);
        mutateServices();
        setExportLoading(false);
        onClose();
        reset();
        setToast({
          type: "success",
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
      } catch (_error) {
        setExportLoading(false);
        setToast({
          type: "error",
          title: t("error"),
          message: t("workspace_settings.settings.exports.modal.toasts.error.message"),
        });
      }
    } else {
      setExportLoading(false);
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent size="md">
        <form
          onSubmit={(e) => {
            void handleSubmit(ExportCSVToMail)(e);
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <DialogMain>
            <DialogHeader>
              <DialogHeading>
                <DialogTitle>{t("export")}</DialogTitle>
              </DialogHeading>
            </DialogHeader>
            <DialogBody>
              <div className="flex flex-col gap-3">
                {/* Project selector */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-body-sm-medium text-primary">
                    {t("workspace_settings.settings.exports.exporting_projects")}
                  </span>
                  <div className="w-72 max-w-[60%]">
                    <Controller
                      control={control}
                      name="project"
                      disabled={!isMember && (!hasProjects || !canPerformAnyCreateAction)}
                      render={({ field: { value, onChange, disabled } }) => (
                        <ProjectSelect
                          multiple
                          projectList="all"
                          value={value ?? []}
                          onChange={onChange}
                          variant="select-ghost-md"
                          disabled={disabled}
                          filterOption={(projectId) => wsProjectIdsWithCreatePermissionsSet.has(projectId)}
                          // Preserve selected ids even if their project is unloaded or removed from the available options.
                          resolveProject={(projectId) => {
                            const project = getProjectById(projectId);
                            if (!project) return { id: projectId, name: projectId };
                            return {
                              id: project.id,
                              name: project.name,
                              identifier: project.identifier,
                              logo_props: project.logo_props,
                            };
                          }}
                          placeholder="All projects"
                          className="w-full"
                        />
                      )}
                    />
                  </div>
                </div>
                {/* Format selector */}
                <div className="flex items-center justify-between gap-4">
                  <span className="text-body-sm-medium text-primary">
                    {t("workspace_settings.settings.exports.format")}
                  </span>
                  <Controller
                    control={control}
                    name="provider"
                    disabled={!isMember && (!hasProjects || !canPerformAnyCreateAction)}
                    render={({ field: { value, onChange, disabled } }) => (
                      <div className="w-72 max-w-[60%]">
                        <Select<string>
                          items={exporterOptions}
                          value={value.provider}
                          onValueChange={(provider) => {
                            const service = EXPORTERS_LIST.find((item) => item.provider === provider);
                            if (service) onChange(service);
                          }}
                          disabled={disabled}
                        >
                          <SelectTrigger
                            size="md"
                            variant="ghost"
                            placeholder={t("workspace_settings.settings.exports.format")}
                          />
                          <SelectContent side="bottom" align="end">
                            <SelectList>
                              {exporterOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value} size="md" label={option.label} />
                              ))}
                            </SelectList>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  />
                </div>
              </div>
              {/* Rich Filters */}
              {/* <div className="w-full">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-body-xs-medium text-secondary leading-tight">{t("common.filters")}</div>
                  <Tooltip label={t("workspace_settings.settings.exports.filters_info")} layout="stacked">
                    <button type="button" className="flex items-center justify-center">
                      <Info className="h-3 w-3 text-tertiary" />
                    </button>
                  </Tooltip>
                </div>
                <Controller
                  control={control}
                  name="filters"
                  render={({ field: { onChange } }) => (
                    <WorkspaceLevelWorkItemFiltersHOC
                      entityId={workspaceSlug}
                      entityType={EIssuesStoreType.GLOBAL}
                      filtersToShowByLayout={ISSUE_DISPLAY_FILTERS_BY_PAGE.my_issues.filters}
                      initialWorkItemFilters={initialWorkItemFilters}
                      isTemporary
                      updateFilters={(updatedFilters) => onChange(updatedFilters)}
                      showOnMount
                      workspaceSlug={workspaceSlug}
                    >
                      {({ filter: workspaceExportWorkItemsFilter }) =>
                        workspaceExportWorkItemsFilter && (
                          <WorkItemFiltersRow filter={workspaceExportWorkItemsFilter} variant="modal" />
                        )
                      }
                    </WorkspaceLevelWorkItemFiltersHOC>
                  )}
                />
              </div> */}
            </DialogBody>
          </DialogMain>
          <DialogActions>
            <Button
              variant="ghost"
              size="md"
              stretch="auto"
              type="button"
              disabled={exportLoading}
              onClick={handleClose}
              label={t("cancel")}
            />
            <Button
              variant="primary"
              size="md"
              stretch="auto"
              type="submit"
              loading={exportLoading}
              label={exportLoading ? `${t("workspace_settings.settings.exports.exporting")}...` : t("export")}
            />
          </DialogActions>
        </form>
      </DialogContent>
    </Dialog>
  );
});
