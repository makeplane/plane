/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { StateSelect as StateSelectBlock } from "@plane/blocks/property-select";
import type { StateOption } from "@plane/blocks/property-select";
import type { SelectPaginationParams, SelectTooltip, SelectTooltipOverride, SelectVariant } from "@plane/blocks/select";
import { useTranslation } from "@plane/i18n";
import type { IState, TPaginatedResponse } from "@plane/types";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";

type StateSelectWebProps = {
  /** Project whose states are offered. */
  projectId: string | undefined;
  /** Current state id (`null` / `undefined` when none). */
  value: string | null | undefined;
  /** Emits the next state id. */
  onChange: (stateId: string) => void;
  variant: SelectVariant;
  disabled?: boolean;
  placeholder?: string;
  onClose?: () => void;
  className?: string;
  tooltip?: SelectTooltip;
  appendElement?: ReactNode;
  /** Forwarded to the block's trigger — see `StateSelectProps["testId"]` doc comment. */
  testId?: string;
  /** Tab order of the trigger, for forms that sequence focus explicitly (`ETabIndices`). */
  tabIndex?: number;
};

const toOption = (state: IState): StateOption => ({
  id: state.id,
  name: state.name,
  color: state.color,
  group: state.group,
  order: state.order,
});

/**
 * Web binding for the presentational `StateSelect` block. Resolves the project's states from the
 * project-state store (fetched on first open when the project has not been loaded yet), filters them
 * by the search query and maps the selected id to a `StateOption`.
 *
 * CE change: EE reads a paginated state "lite" resource with workflow gating (`typeId`,
 * `isForWorkItemCreation`, `scopedProjectIds`); CE has neither, so the whole project list is served
 * as one page and `allowedStateIds` stays unset.
 */
export const StateSelect = observer(function StateSelect(props: StateSelectWebProps) {
  const {
    projectId,
    value,
    onChange,
    variant,
    disabled,
    placeholder,
    onClose,
    className,
    tooltip,
    appendElement,
    testId,
    tabIndex,
  } = props;
  // router params
  const { workspaceSlug } = useParams();
  // store hooks
  const { getProjectStateIds, getStateById, fetchProjectStates } = useProjectState();
  // translation
  const { t } = useTranslation();
  const resolvedTooltip = useMemo<SelectTooltipOverride | undefined>(() => {
    if (!tooltip) return undefined;
    const override = typeof tooltip === "object" ? tooltip : undefined;
    return {
      heading: override?.heading ?? t("common.state"),
      emptyContent: override?.emptyContent ?? t("common.none"),
    };
  }, [tooltip, t]);

  const getValues = useCallback(
    async ({ search }: SelectPaginationParams): Promise<TPaginatedResponse<StateOption[]>> => {
      if (!workspaceSlug || !projectId) return { results: [] };
      let stateIds = getProjectStateIds(projectId);
      if (!stateIds) {
        await fetchProjectStates(workspaceSlug.toString(), projectId);
        stateIds = getProjectStateIds(projectId);
      }
      const query = search?.trim().toLowerCase();
      const results = (stateIds ?? [])
        .map((stateId) => getStateById(stateId))
        .filter((state): state is IState => !!state)
        .filter((state) => !query || state.name.toLowerCase().includes(query))
        .map(toOption);
      return { results, next_page_results: false };
    },
    [workspaceSlug, projectId, getProjectStateIds, fetchProjectStates, getStateById]
  );

  // Resolved in the observer render (not in a memo) so MobX re-renders when the state loads.
  const selectedState = value ? getStateById(value) : undefined;
  const selected = selectedState ? toOption(selectedState) : null;

  return (
    <StateSelectBlock
      getValues={getValues}
      value={selected}
      onChange={onChange}
      variant={variant}
      disabled={disabled}
      placeholder={placeholder ?? t("state")}
      onClose={onClose}
      className={className}
      tooltip={resolvedTooltip}
      appendElement={appendElement}
      testId={testId}
      tabIndex={tabIndex}
    />
  );
});
