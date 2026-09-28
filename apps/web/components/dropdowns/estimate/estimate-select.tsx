/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import type { EstimateOption } from "@plane/blocks/property-select";
import { EstimateSelect as EstimateSelectBlock } from "@plane/blocks/property-select";
import type { SelectTooltip, SelectTooltipOverride, SelectVariant } from "@plane/blocks/select";
import { useTranslation } from "@plane/i18n";
import { EEstimateSystem } from "@plane/types";
import { convertMinutesToHoursMinutesString } from "@plane/utils";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
import { useEstimate } from "@/hooks/store/estimates/use-estimate";
// store
import type { IEstimate } from "@/store/estimates/estimate";

type Props = {
  value: string | undefined | null;
  /** Receives `null` when "No estimate" is picked, so the PATCH payload clears the field server-side. */
  onChange: (val: string | null) => void;
  projectId: string | undefined;
  variant: SelectVariant;
  disabled?: boolean;
  placeholder?: string;
  onClose?: () => void;
  className?: string;
  tooltip?: SelectTooltip;
  /** Tab order of the trigger, for forms that sequence focus explicitly (`ETabIndices`). */
  tabIndex?: number;
};

/** Formats a raw estimate point value for display — minutes-to-"1h 30m" for time-based systems, verbatim otherwise. */
function formatEstimatePointValue(estimate: IEstimate | undefined, rawValue: string): string {
  return estimate?.type === EEstimateSystem.TIME ? convertMinutesToHoursMinutesString(Number(rawValue)) : rawValue;
}

/** Maps an estimate's points to dropdown options, optionally filtered by a case-insensitive search term. */
function toEstimateOptions(estimate: IEstimate | undefined, search: string | undefined): EstimateOption[] {
  const points = estimate?.estimatePointIds ?? [];
  return points.flatMap((id) => {
    const point = estimate?.estimatePointById(id);
    if (!point) return [];
    const displayValue = formatEstimatePointValue(estimate, point.value ?? "");
    if (search && !displayValue.toLowerCase().includes(search.toLowerCase())) return [];
    return [{ id, displayValue }];
  });
}

export const EstimateSelect = observer(function EstimateSelect(props: Props) {
  const { value, onChange, projectId, variant, disabled, placeholder, onClose, className, tooltip, tabIndex } = props;
  // i18n
  const { t } = useTranslation();
  const resolvedTooltip = useMemo<SelectTooltipOverride | undefined>(() => {
    if (!tooltip) return undefined;
    const override = typeof tooltip === "object" ? tooltip : undefined;
    return {
      heading: override?.heading ?? t("project_settings.estimates.label"),
      emptyContent: override?.emptyContent ?? t("common.none"),
    };
  }, [tooltip, t]);
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const { currentActiveEstimateIdByProjectId, areEstimateEnabledByProjectId, getProjectEstimates, getEstimateById } =
    useProjectEstimates();

  const currentActiveEstimateId = projectId ? currentActiveEstimateIdByProjectId(projectId) : undefined;
  const estimate = useEstimate(currentActiveEstimateId);

  // Resolves the project's active estimate, fetching it first if it isn't loaded yet.
  const resolveActiveEstimate = useCallback(async (): Promise<IEstimate | undefined> => {
    if (!projectId) return undefined;

    let activeEstimateId = currentActiveEstimateIdByProjectId(projectId);
    if (!activeEstimateId && workspaceSlug) {
      await getProjectEstimates(workspaceSlug.toString(), projectId);
      activeEstimateId = currentActiveEstimateIdByProjectId(projectId);
    }
    return activeEstimateId ? getEstimateById(activeEstimateId) : undefined;
  }, [projectId, workspaceSlug, currentActiveEstimateIdByProjectId, getProjectEstimates, getEstimateById]);

  // Fetches lazily, once per open (`Select`'s infinite mode) — not on mount. A row nobody clicks
  // never fires a request; a project with estimates disabled never fires one either.
  const getValues = useCallback(
    async ({ search }: { search?: string }) => {
      if (!projectId || !areEstimateEnabledByProjectId(projectId)) return { results: [] };

      const activeEstimate = await resolveActiveEstimate();
      return { results: toEstimateOptions(activeEstimate, search) };
    },
    [projectId, areEstimateEnabledByProjectId, resolveActiveEstimate]
  );

  // CE change: CE's `useEstimate` returns an empty object (not `undefined`) while no estimate is
  // active, so the point lookup is optional-called.
  const point = value ? estimate?.estimatePointById?.(value) : undefined;
  const selected: EstimateOption | null =
    value && point ? { id: value, displayValue: formatEstimatePointValue(estimate, point.value ?? "") } : null;

  return (
    <EstimateSelectBlock
      getValues={getValues}
      value={selected}
      // CE change: a clear emits `null`, not `undefined` — JSON serialization drops `undefined` keys,
      // so the server would otherwise keep the old estimate.
      onChange={(id) => onChange(id || null)}
      variant={variant}
      disabled={disabled}
      placeholder={placeholder}
      onClose={onClose}
      className={className}
      clearLabel={t("project_settings.estimates.no_estimate")}
      tooltip={resolvedTooltip}
      tabIndex={tabIndex}
    />
  );
});
