/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { SearchIcon } from "@plane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import type { IWorkflowDetail, IWorkflowTypeAssignment, TWorkflowCreatePayload } from "@plane/types";
import { CustomSearchSelect, CustomSelect, Input, Loader } from "@plane/ui";
// components
import { WorkflowForm, WorkflowItem } from "@/components/project-workflows";
import { SettingsHeading } from "@/components/settings/heading";

type TWorkflowListProps = {
  workflows: IWorkflowDetail[] | undefined;
  typeAssignments: IWorkflowTypeAssignment[] | undefined;
  isLoading: boolean;
  isEditable: boolean;
  selectedWorkflowId: string | null;
  onCreate: (data: TWorkflowCreatePayload) => Promise<unknown>;
  onUpdate: (workflowId: string, data: TWorkflowCreatePayload) => Promise<unknown>;
  onToggleActive: (workflowId: string, nextValue: boolean) => Promise<void>;
  onDelete: (workflowId: string) => Promise<void>;
  onSelect: (workflowId: string) => void;
};

type TStatusFilter = "all" | "active" | "inactive";

export const WorkflowList = observer(function WorkflowList(props: TWorkflowListProps) {
  const {
    workflows,
    typeAssignments,
    isLoading,
    isEditable,
    selectedWorkflowId,
    onCreate,
    onUpdate,
    onToggleActive,
    onDelete,
    onSelect,
  } = props;
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TStatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [formState, setFormState] = useState<{ workflow: IWorkflowDetail | null } | null>(null);

  // §23.1 — the type filter needs type names, which the assignment payloads
  // already carry (`issue_type_name`).
  const typeOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const assignment of typeAssignments ?? []) {
      seen.set(assignment.issue_type, assignment.issue_type_name);
    }
    return [...seen.entries()].map(([value, label]) => ({ value, query: label, content: label }));
  }, [typeAssignments]);

  const assignedTypeNamesByWorkflow = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const assignment of typeAssignments ?? []) {
      const names = map.get(assignment.workflow) ?? [];
      names.push(assignment.issue_type_name);
      map.set(assignment.workflow, names);
    }
    return map;
  }, [typeAssignments]);

  const filteredWorkflows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return (workflows ?? []).filter((workflow) => {
      if (query && !workflow.name.toLowerCase().includes(query)) return false;
      if (statusFilter === "active" && !workflow.is_active) return false;
      if (statusFilter === "inactive" && workflow.is_active) return false;
      if (typeFilter.length > 0) {
        const assigned = (typeAssignments ?? []).filter((a) => a.workflow === workflow.id);
        if (!assigned.some((a) => typeFilter.includes(a.issue_type))) return false;
      }
      return true;
    });
  }, [workflows, searchQuery, statusFilter, typeFilter, typeAssignments]);

  const statusLabels: Record<TStatusFilter, string> = {
    all: t("project_settings.workflows.filters.all_statuses"),
    active: t("project_settings.workflows.filters.active"),
    inactive: t("project_settings.workflows.filters.inactive"),
  };

  return (
    <div className="flex h-full flex-col">
      <SettingsHeading
        title={t("project_settings.workflows.heading")}
        description={t("project_settings.workflows.description")}
        control={
          isEditable && (
            <Button
              variant="primary"
              size="lg"
              onClick={() => setFormState({ workflow: null })}
              data-testid="workflow-create-button"
            >
              {t("project_settings.workflows.add_button")}
            </Button>
          )
        }
      />

      {/* controls — §23.1: search, active/inactive filter, type filter */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative w-64">
          <SearchIcon
            className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-tertiary"
            aria-hidden="true"
          />
          <Input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t("project_settings.workflows.search")}
            aria-label={t("project_settings.workflows.search")}
            className="w-full pl-8"
          />
        </div>
        <CustomSelect
          value={statusFilter}
          onChange={(value: TStatusFilter) => setStatusFilter(value)}
          label={statusLabels[statusFilter]}
          className="w-44"
        >
          {(Object.keys(statusLabels) as TStatusFilter[]).map((key) => (
            <CustomSelect.Option key={key} value={key}>
              {statusLabels[key]}
            </CustomSelect.Option>
          ))}
        </CustomSelect>
        {typeOptions.length > 0 && (
          <CustomSearchSelect
            multiple
            value={typeFilter}
            onChange={(value: string[]) => setTypeFilter(value)}
            options={typeOptions}
            label={t("project_settings.workflows.filters.all_types")}
            noResultsMessage={t("project_settings.workflows.list.no_results")}
            className="w-64"
          />
        )}
      </div>

      {/* list — §23.1 columns: name, default badge, active, types, modified */}
      <div className="mt-4 rounded-md border border-subtle">
        {isLoading ? (
          <Loader className="space-y-3 p-4">
            <Loader.Item height="36px" />
            <Loader.Item height="36px" />
            <Loader.Item height="36px" />
          </Loader>
        ) : filteredWorkflows.length === 0 ? (
          <EmptyStateCompact
            assetKey="settings"
            title={
              (workflows ?? []).length === 0
                ? t("project_settings.workflows.list.empty_state.title")
                : t("project_settings.workflows.list.no_results")
            }
            description={
              (workflows ?? []).length === 0 ? t("project_settings.workflows.list.empty_state.description") : undefined
            }
            className="p-12"
          />
        ) : (
          filteredWorkflows.map((workflow) => (
            <WorkflowItem
              key={workflow.id}
              workflow={workflow}
              assignedTypeNames={assignedTypeNamesByWorkflow.get(workflow.id) ?? []}
              isEditable={isEditable}
              isSelected={workflow.id === selectedWorkflowId}
              onEdit={() => setFormState({ workflow })}
              onToggleActive={(nextValue) => onToggleActive(workflow.id, nextValue)}
              onDelete={() => onDelete(workflow.id)}
              onSelect={() => onSelect(workflow.id)}
            />
          ))
        )}
      </div>

      {formState && (
        <WorkflowForm
          workflow={formState.workflow}
          onClose={() => setFormState(null)}
          onSubmit={async (data) => {
            if (formState.workflow) await onUpdate(formState.workflow.id, data);
            else await onCreate(data);
          }}
        />
      )}
    </div>
  );
});
