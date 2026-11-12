/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { ModuleSelect as ModuleSelectBlock } from "@plane/blocks/property-select";
import type { ModuleOption } from "@plane/blocks/property-select";
import type { SelectPaginationParams, SelectTooltip, SelectTooltipOverride, SelectVariant } from "@plane/blocks/select";
import { useTranslation } from "@plane/i18n";
import type { IModule, TPaginatedResponse } from "@plane/types";
// hooks
import { useModule } from "@/hooks/store/use-module";

type ModuleSelectWebBaseProps = {
  /** Project whose modules are offered. */
  projectId: string | undefined;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  onClose?: () => void;
  tooltip?: SelectTooltip;
  /** Tab order of the trigger, for forms that sequence focus explicitly (`ETabIndices`). */
  tabIndex?: number;
};

type ModuleSelectWebProps = ModuleSelectWebBaseProps &
  (
    | {
        multiple: true;
        value: string[];
        onChange: (moduleIds: string[]) => void;
        variant: Exclude<SelectVariant, "breadcrumb">;
      }
    | {
        multiple?: false;
        value: string | null;
        onChange: (moduleId: string | null) => void;
        variant: SelectVariant;
      }
  );

const toOption = (module: IModule): ModuleOption => ({ id: module.id, name: module.name });

/**
 * Web binding for the `ModuleSelect` block. Pass `multiple` for multi-select (issue sidebar, table
 * cells); omit it for single-select navigation (breadcrumb). Resolves the project's modules from the
 * module store (fetched on first open when the project has not been loaded yet) and filters them by
 * the search query.
 *
 * CE change: EE reads a paginated module "lite" resource (and supports `scopedProjectIds`); CE serves
 * the store's list as one page. EE keeps this binding in `issues/issue-detail/module-select.tsx`.
 */
export const ModuleSelect = observer(function ModuleSelect(props: ModuleSelectWebProps) {
  const { projectId, disabled, placeholder, onClose, className, tooltip, tabIndex } = props;
  // router params
  const { workspaceSlug } = useParams();
  // store hooks
  const { getProjectModuleIds, getModuleById, fetchModules } = useModule();
  // translation
  const { t } = useTranslation();
  const resolvedTooltip = useMemo<SelectTooltipOverride | undefined>(() => {
    if (!tooltip) return undefined;
    const override = typeof tooltip === "object" ? tooltip : undefined;
    return {
      heading: override?.heading ?? t("common.modules"),
      emptyContent: override?.emptyContent ?? t("common.none"),
    };
  }, [tooltip, t]);

  const getValues = useCallback(
    async ({ search }: SelectPaginationParams): Promise<TPaginatedResponse<ModuleOption[]>> => {
      if (!workspaceSlug || !projectId) return { results: [] };
      let moduleIds = getProjectModuleIds(projectId);
      if (!moduleIds) {
        await fetchModules(workspaceSlug.toString(), projectId);
        moduleIds = getProjectModuleIds(projectId);
      }
      const query = search?.trim().toLowerCase();
      const results = (moduleIds ?? [])
        .map((moduleId) => getModuleById(moduleId))
        .filter((module): module is IModule => !!module)
        .filter((module) => !query || module.name.toLowerCase().includes(query))
        .map(toOption);
      return { results, next_page_results: false };
    },
    [workspaceSlug, projectId, getProjectModuleIds, fetchModules, getModuleById]
  );

  if (!props.multiple) {
    // Resolved in the observer render (not in a memo) so MobX re-renders when the module loads.
    const module = props.value ? getModuleById(props.value) : null;
    return (
      <ModuleSelectBlock
        getValues={getValues}
        value={module ? toOption(module) : null}
        onChange={(moduleId) => props.onChange(moduleId || null)}
        variant={props.variant}
        onClose={onClose}
        disabled={disabled}
        placeholder={placeholder}
        className={className}
        tooltip={resolvedTooltip}
        tabIndex={tabIndex}
      />
    );
  }

  // Ruling 46: keep every selected id, even one whose module is not loaded, so none drops out of `onChange`.
  const selectedMulti: ModuleOption[] = props.value.map((id) => {
    const module = getModuleById(id);
    return module ? toOption(module) : { id, name: id };
  });

  return (
    <ModuleSelectBlock
      multiple
      getValues={getValues}
      value={selectedMulti}
      onChange={props.onChange}
      variant={props.variant}
      onClose={onClose}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      tooltip={resolvedTooltip}
      tabIndex={tabIndex}
    />
  );
});
