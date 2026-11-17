/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import { observer } from "mobx-react";
// plane imports
import { IntakeStateSelect as IntakeStateSelectBlock } from "@plane/blocks/property-select";
import type { IntakeStateOption } from "@plane/blocks/property-select";
import type { SelectPaginationParams, SelectVariant } from "@plane/blocks/select";
import { useTranslation } from "@plane/i18n";
import type { IIntakeState, TPaginatedResponse } from "@plane/types";
// hooks
import { useProjectState } from "@/hooks/store/use-project-state";

type IntakeStateSelectProps = {
  workspaceSlug: string;
  projectId: string;
  value: string | null | undefined;
  onChange: (stateId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  onClose?: () => void;
  variant?: SelectVariant;
  className?: string;
  /** Tab order of the trigger, for forms that sequence focus explicitly (`ETabIndices`). */
  tabIndex?: number;
};

const mapIntakeStateToOption = (state: IIntakeState): IntakeStateOption => ({
  id: state.id,
  name: state.name,
  color: state.color,
  group: state.group,
});

/**
 * Web binding for the presentational `IntakeStateSelect` block. The intake state is a project
 * singleton, so the list is that one state (fetched on first open when it is not loaded yet), and an
 * unset value falls back to it — the legacy dropdown's default-state behaviour.
 *
 * CE change: EE reads `useIntakeState()`; CE keeps the intake state on the project-state store.
 */
export const IntakeStateSelect = observer(function IntakeStateSelect(props: IntakeStateSelectProps) {
  const {
    workspaceSlug,
    projectId,
    value,
    onChange,
    disabled = false,
    placeholder,
    onClose,
    variant = "select-ghost-md",
    className,
    tabIndex,
  } = props;
  // store hooks
  const { fetchProjectIntakeState, getIntakeStateById, getProjectIntakeState } = useProjectState();
  // translation
  const { t } = useTranslation();

  const resolvedPlaceholder = placeholder ?? t("state");

  const getValues = useCallback(
    async (_params: SelectPaginationParams): Promise<TPaginatedResponse<IntakeStateOption[]>> => {
      if (!workspaceSlug || !projectId) return { results: [] };
      const state = getProjectIntakeState(projectId) ?? (await fetchProjectIntakeState(workspaceSlug, projectId));
      return { results: state ? [mapIntakeStateToOption(state)] : [], next_page_results: false };
    },
    [workspaceSlug, projectId, getProjectIntakeState, fetchProjectIntakeState]
  );

  // Resolved in the observer render (not in a memo) so MobX re-renders when the state loads.
  const selectedState = (value ? getIntakeStateById(value) : undefined) ?? getProjectIntakeState(projectId);
  const selected = selectedState ? mapIntakeStateToOption(selectedState) : null;

  return (
    <IntakeStateSelectBlock
      getValues={getValues}
      value={selected}
      onChange={onChange}
      variant={variant}
      disabled={disabled}
      placeholder={resolvedPlaceholder}
      onClose={onClose}
      className={className}
      tabIndex={tabIndex}
    />
  );
});
