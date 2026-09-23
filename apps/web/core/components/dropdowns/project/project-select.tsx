/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { useCallback, useMemo } from "react";
import { sortBy } from "lodash-es";
import { observer } from "mobx-react";
// plane imports
import { ProjectSelect as ProjectSelectBlock } from "@plane/blocks/property-select";
import type { ProjectOption } from "@plane/blocks/property-select";
import type { SelectPaginationParams, SelectTooltip, SelectTooltipOverride, SelectVariant } from "@plane/blocks/select";
import { useTranslation } from "@plane/i18n";
import type { TPaginatedResponse, TProject } from "@plane/types";
// hooks
import { useProject } from "@/hooks/store/use-project";

/** Which workspace projects to offer in the dropdown. Defaults to joined (pre-migration behavior). */
export type ProjectSelectList = "joined" | "all";

type ProjectSelectWebCommonProps = {
  /**
   * `"joined"` — projects the current user is a member of (legacy ProjectDropdown behavior).
   * `"all"` — every non-archived project of the current workspace.
   * @default "joined"
   */
  projectList?: ProjectSelectList;
  variant: SelectVariant;
  disabled?: boolean;
  placeholder?: string;
  onClose?: () => void;
  className?: string;
  tooltip?: SelectTooltip;
  selectedDescription?: ReactNode;
  /**
   * Extra filter on top of the list (e.g. permission-scoped ids).
   * Applied in addition to excluding archived projects.
   */
  filterOption?: (projectId: string) => boolean;
  /** Hide a project from the options list (e.g. source project in duplicate flows). */
  excludeProjectId?: string;
  /**
   * Override resolving an already-selected project's label/logo instead of the project store — e.g.
   * a form-local project draft not yet hydrated into the store. Only affects the selected value.
   */
  resolveProject?: (projectId: string) => ProjectOption | null | undefined;
  /** Tab order of the trigger, for forms that sequence focus explicitly (`ETabIndices`). */
  tabIndex?: number;
};

export type ProjectSelectWebProps = ProjectSelectWebCommonProps &
  (
    | { multiple: true; value: string[]; onChange: (ids: string[]) => void }
    | { multiple?: false; value: string | null; onChange: (id: string | null) => void }
  );

const toProjectOption = (project: TProject): ProjectOption => ({
  id: project.id,
  name: project.name,
  identifier: project.identifier,
  logo_props: project.logo_props,
});

/**
 * Web binding for the presentational `ProjectSelect` block. Reads the current workspace's projects
 * from the project store. Default list is joined-only; pass `projectList="all"` for surfaces that
 * need every visible project.
 *
 * CE change: EE reads a projects-lite pool keyed by an explicit `workspaceSlug`
 * (`getWorkspaceProjects`); CE's project store is scoped to the current workspace, so the binding
 * reads `joinedProjectIds` / `workspaceProjectIds` and takes no `workspaceSlug`.
 */
export const ProjectSelect = observer(function ProjectSelect(props: ProjectSelectWebProps) {
  const {
    projectList = "joined",
    variant,
    disabled,
    placeholder,
    onClose,
    className,
    tooltip,
    selectedDescription,
    filterOption,
    excludeProjectId,
    resolveProject,
    tabIndex,
  } = props;
  const { t } = useTranslation();
  const { joinedProjectIds, workspaceProjectIds, getProjectById } = useProject();

  // The store getters are read in render (above) so MobX re-renders this observer when the list hydrates.
  const projectIds = useMemo(
    () => (projectList === "joined" ? joinedProjectIds : (workspaceProjectIds ?? [])),
    [projectList, joinedProjectIds, workspaceProjectIds]
  );

  const toOption = useCallback(
    (projectId: string): ProjectOption | null => {
      const overridden = resolveProject?.(projectId);
      if (overridden) return overridden;
      const project = getProjectById(projectId);
      if (!project?.id || !project.name) return null;
      return toProjectOption(project);
    },
    [getProjectById, resolveProject]
  );

  const matchesFilters = useCallback(
    (projectId: string) => {
      if (excludeProjectId && projectId === excludeProjectId) return false;
      if (filterOption && !filterOption(projectId)) return false;
      return true;
    },
    [excludeProjectId, filterOption]
  );

  const getValues = useCallback(
    ({ search }: SelectPaginationParams): Promise<TPaginatedResponse<ProjectOption[]>> => {
      const query = search?.trim().toLowerCase();
      const projects = projectIds
        .map((projectId) => getProjectById(projectId))
        .filter((project): project is TProject => !!project);
      const filtered = sortBy(
        projects.filter((project) => {
          if (project.archived_at) return false;
          if (!matchesFilters(project.id)) return false;
          if (!query) return true;
          const name = project.name?.toLowerCase() ?? "";
          const identifier = project.identifier?.toLowerCase() ?? "";
          return name.includes(query) || identifier.includes(query);
        }),
        "sort_order"
      );

      const results = filtered.map(toProjectOption);

      return Promise.resolve({
        results,
        next_page_results: false,
        count: results.length,
        total_count: results.length,
      });
    },
    [projectIds, getProjectById, matchesFilters]
  );

  const resolvedTooltip = useMemo<SelectTooltipOverride | undefined>(() => {
    if (!tooltip) return undefined;
    const override = typeof tooltip === "object" ? tooltip : undefined;
    return {
      heading: override?.heading ?? t("common.project"),
      emptyContent: override?.emptyContent ?? t("common.none"),
    };
  }, [tooltip, t]);

  if (props.multiple) {
    // Resolved in the observer render so MobX re-renders when a selected project loads.
    const selected = props.value.map((id) => toOption(id)).filter((option): option is ProjectOption => option !== null);
    return (
      <ProjectSelectBlock
        multiple
        getValues={getValues}
        value={selected}
        onChange={props.onChange}
        variant={variant as Exclude<SelectVariant, "breadcrumb">}
        disabled={disabled}
        placeholder={placeholder}
        onClose={onClose}
        className={className}
        tooltip={resolvedTooltip}
        tabIndex={tabIndex}
      />
    );
  }

  const { onChange } = props;
  return (
    <ProjectSelectBlock
      getValues={getValues}
      value={props.value ? toOption(props.value) : null}
      onChange={(id) => onChange(id || null)}
      variant={variant}
      disabled={disabled}
      placeholder={placeholder}
      onClose={onClose}
      className={className}
      tooltip={resolvedTooltip}
      selectedDescription={selectedDescription}
      tabIndex={tabIndex}
    />
  );
});
