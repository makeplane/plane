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
import { Controller, useForm } from "react-hook-form";
import { InfoIcon } from "@plane/propel/icons";
import { DEFAULT_PQL_FILTER_VALUE, EXPORTERS_LIST, ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import { EIssuesStoreType } from "@plane/types";
import type { IIssueFilters, TWorkItemFilterExpression } from "@plane/types";
import { CustomSearchSelect, CustomSelect } from "@plane/ui";
import { truncateProjectIdentifierForDisplay } from "@plane/utils";
// components
import { WorkspaceLevelWorkItemFiltersHOC } from "@/components/work-item-filters/filters-hoc/workspace-level";
import { WorkItemFiltersRow } from "@/components/work-item-filters/filters-row/basic";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { useProject } from "@/hooks/store/use-project";
import { useUser } from "@/hooks/store/user";
import { usePermissionAccess } from "@/hooks/store/use-permission-access";
// services
import { ProjectExportService } from "@/services/project/project-export.service";
// local imports
import { SettingsBoxedControlItem } from "../settings/boxed-control-item";

type Props = {
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

const initialWorkItemFilters: IIssueFilters = {
  richFilters: {},
  displayFilters: {},
  displayProperties: {},
  kanbanFilters: {
    group_by: [],
    sub_group_by: [],
  },
  pqlFilters: DEFAULT_PQL_FILTER_VALUE,
  lastUsedFilterType: "rich_filters",
};

const projectExportService = new ProjectExportService();

export const ExportForm = observer(function ExportForm(props: Props) {
  // props
  const { workspaceSlug, mutateServices } = props;
  // states
  const [exportLoading, setExportLoading] = useState(false);

  // store hooks
  const { can } = usePermissionAccess();
  const { data: user } = useUser();
  const {
    permissions: { getProjectIdsWithWorkItemPermission },
  } = useIssues();
  const { workspaceProjectIds, getProjectById } = useProject();
  const { t } = useTranslation();
  // form
  const { handleSubmit, control } = useForm<FormData>({
    defaultValues: {
      provider: EXPORTERS_LIST[0],
      project: [],
      multiple: false,
      filters: {},
    },
  });

  // derived values
  const canExportAnalytics = can({ resource: "analytics", action: "export", workspaceSlug });
  const projectIdsWithExportWorkItemPermission = getProjectIdsWithWorkItemPermission(
    workspaceSlug,
    workspaceProjectIds ?? [],
    "export"
  );
  const options = Array.from(projectIdsWithExportWorkItemPermission).map((projectId) => {
    const projectDetails = getProjectById(projectId);

    return {
      value: projectDetails?.id,
      query: `${projectDetails?.name} ${projectDetails?.identifier}`,
      content: (
        <div className="flex items-center gap-2">
          <span className="text-10 text-secondary shrink-0">
            {truncateProjectIdentifierForDisplay(projectDetails?.identifier || "")}
          </span>
          <span className="truncate">{projectDetails?.name}</span>
        </div>
      ),
    };
  });

  // handlers
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
      } catch (error) {
        setExportLoading(false);
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("error"),
          message: t("workspace_settings.settings.exports.modal.toasts.error.message"),
        });
      }
    } else {
      setExportLoading(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(ExportCSVToMail)(e);
      }}
      className="flex flex-col gap-5"
    >
      <div className="rounded-lg border border-subtle bg-layer-2">
        {/* Project Selector */}
        <SettingsBoxedControlItem
          className="rounded-none border-0 border-b"
          title={t("workspace_settings.settings.exports.exporting_projects")}
          control={
            <Controller
              control={control}
              name="project"
              disabled={!canExportAnalytics && projectIdsWithExportWorkItemPermission.size === 0}
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

                            return truncateProjectIdentifierForDisplay(projectDetails?.identifier || "");
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
          }
        />
        {/* Format Selector */}
        <SettingsBoxedControlItem
          className="rounded-none border-0 border-b"
          title={t("workspace_settings.settings.exports.format")}
          control={
            <Controller
              control={control}
              name="provider"
              disabled={!canExportAnalytics && projectIdsWithExportWorkItemPermission.size === 0}
              render={({ field: { value, onChange } }) => (
                <CustomSelect
                  value={value}
                  onChange={onChange}
                  label={t(value.i18n_title)}
                  optionsClassName="max-w-48 sm:max-w-[532px]"
                  placement="bottom-end"
                  buttonClassName="py-2 text-13"
                >
                  {EXPORTERS_LIST.map((service) => (
                    <CustomSelect.Option key={service.provider} className="flex items-center gap-2" value={service}>
                      <span className="truncate">{t(service.i18n_title)}</span>
                    </CustomSelect.Option>
                  ))}
                </CustomSelect>
              )}
            />
          }
        />
        <div className="px-4 py-3">
          <Button variant="primary" size="lg" type="submit" loading={exportLoading}>
            {exportLoading ? `${t("workspace_settings.settings.exports.exporting")}...` : t("export")}
          </Button>
        </div>
      </div>
      {/* Rich Filters */}
      <div className="w-full">
        <div className="flex items-center gap-2 mb-2">
          <div className="text-13 font-medium text-secondary leading-tight">{t("common.filters")}</div>
          <Tooltip
            tooltipContent={
              <div className="max-w-[238px] flex gap-2">
                <div className="rounded-sm flex items-center justify-center p-1 h-5 aspect-square">
                  <InfoIcon className="h-3 w-3" />
                </div>
                {t("workspace_settings.settings.exports.filters_info")}
              </div>
            }
            position="top"
          >
            <button type="button" className="flex items-center justify-center">
              <InfoIcon className="h-3 w-3 text-tertiary" />
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
              updateFilters={async (updatedFilters) => {
                if (updatedFilters.type === "rich_filters") {
                  onChange(updatedFilters.expression);
                }
              }}
              showOnMount
              workspaceSlug={workspaceSlug}
            >
              {({ filter }) =>
                filter?.richFiltersInstance && (
                  <WorkItemFiltersRow filter={filter.richFiltersInstance} variant="modal" />
                )
              }
            </WorkspaceLevelWorkItemFiltersHOC>
          )}
        />
      </div>
      <div className="flex items-center justify-between">
        <Button variant="primary" type="submit" loading={exportLoading}>
          {exportLoading ? `${t("workspace_settings.settings.exports.exporting")}...` : t("export")}
        </Button>
      </div>
    </form>
  );
});
