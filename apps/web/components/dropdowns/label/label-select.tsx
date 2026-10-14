/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissionsLevel, getRandomLabelColor } from "@plane/constants";
import { LabelSelect as LabelSelectBlock } from "@plane/blocks/property-select";
import type { LabelOption } from "@plane/blocks/property-select";
import type { SelectPaginationParams, SelectTooltip, SelectTooltipOverride, SelectVariant } from "@plane/blocks/select";
import { useTranslation } from "@plane/i18n";
import type { IIssueLabel, TPaginatedResponse } from "@plane/types";
import { EUserPermissions } from "@plane/types";
// hooks
import { useLabel } from "@/hooks/store/use-label";
import { useUserPermissions } from "@/hooks/store/user";

type LabelSelectWebProps = {
  /** Project whose labels are offered. */
  projectId?: string | null;
  /** Current label ids. */
  value: string[];
  /** Emits the next set of label ids. */
  onChange: (labelIds: string[]) => void;
  variant: SelectVariant;
  /** value-agnostic e2e selector — forwarded to the block's trigger as data-testid */
  testId?: string;
  disabled?: boolean;
  placeholder?: string;
  onClose?: () => void;
  className?: string;
  tooltip?: SelectTooltip;
  /** Tab order of the trigger, for forms that sequence focus explicitly (`ETabIndices`). */
  tabIndex?: number;
};

const toOption = (label: IIssueLabel): LabelOption => ({ id: label.id, name: label.name, color: label.color });

/**
 * Web binding for the presentational `LabelSelect` block. Resolves the project's labels from the
 * label store (fetched on first open when the project has not been loaded yet), filters them by the
 * search query, and lets project admins create a label from an unmatched search.
 *
 * CE change: EE switches on a `scope` (work item / release / initiative / project) and a governed
 * label catalog; CE only has project work-item labels, so the binding takes a `projectId` instead.
 */
export const LabelSelect = observer(function LabelSelect(props: LabelSelectWebProps) {
  const { projectId, value, onChange, variant, disabled, placeholder, onClose, className, tooltip, testId, tabIndex } =
    props;
  // router params
  const { workspaceSlug } = useParams();
  // store hooks
  const { getProjectLabels, getLabelById, fetchProjectLabels, createLabel } = useLabel();
  const { allowPermissions } = useUserPermissions();
  // translation
  const { t } = useTranslation();
  const resolvedTooltip = useMemo<SelectTooltipOverride | undefined>(() => {
    if (!tooltip) return undefined;
    const override = typeof tooltip === "object" ? tooltip : undefined;
    return {
      heading: override?.heading ?? t("common.labels"),
      emptyContent: override?.emptyContent ?? t("common.none"),
    };
  }, [tooltip, t]);

  const canCreateLabel =
    !!workspaceSlug &&
    !!projectId &&
    allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.PROJECT, workspaceSlug.toString(), projectId);

  const getValues = useCallback(
    async ({ search }: SelectPaginationParams): Promise<TPaginatedResponse<LabelOption[]>> => {
      if (!workspaceSlug || !projectId) return { results: [] };
      const labels = getProjectLabels(projectId) ?? (await fetchProjectLabels(workspaceSlug.toString(), projectId));
      const query = search?.trim().toLocaleLowerCase();
      const results = (labels ?? [])
        .filter((label) => !query || label.name.toLocaleLowerCase().includes(query))
        .map(toOption);
      return { results, next_page_results: false };
    },
    [workspaceSlug, projectId, getProjectLabels, fetchProjectLabels]
  );

  const handleCreateLabel = useCallback(
    async (name: string): Promise<LabelOption> => {
      if (!workspaceSlug || !projectId) throw new Error("Workspace slug or project ID is missing");
      const label = await createLabel(workspaceSlug.toString(), projectId, { name, color: getRandomLabelColor() });
      return toOption(label);
    },
    [workspaceSlug, projectId, createLabel]
  );

  // Ruling 46: keep every selected id, even one whose label is not loaded, so none drops out of
  // `onChange`. Resolved in the observer render so MobX re-renders when the labels load.
  const selected: LabelOption[] = value.map((id) => {
    const label = getLabelById(id);
    return label ? toOption(label) : { id, name: id, color: "" };
  });

  return (
    <LabelSelectBlock
      getValues={getValues}
      value={selected}
      onChange={onChange}
      variant={variant}
      testId={testId}
      disabled={disabled}
      placeholder={placeholder}
      onClose={onClose}
      createLabel={{
        canCreate: canCreateLabel,
        onCreate: handleCreateLabel,
      }}
      className={className}
      tooltip={resolvedTooltip}
      tabIndex={tabIndex}
    />
  );
});
