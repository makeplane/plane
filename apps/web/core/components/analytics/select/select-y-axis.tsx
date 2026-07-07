/**
 * Copyright (c) 2023-present Gizmo Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { EEstimateSystem } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { ProjectIcon } from "@plane/propel/icons";
import type { ChartYAxisMetric } from "@plane/types";
// gizmo package imports
import { CustomSelect } from "@plane/ui";
// hooks
import { useProjectEstimates } from "@/hooks/store/estimates";
// gizmo web constants
type Props = {
  value: ChartYAxisMetric;
  onChange: (val: ChartYAxisMetric | null) => void;
  hiddenOptions?: ChartYAxisMetric[];
  options: { value: ChartYAxisMetric; i18nKey: string }[];
};

export const SelectYAxis = observer(function SelectYAxis({ value, onChange, hiddenOptions, options }: Props) {
  // hooks
  const { t } = useTranslation();
  const { projectId } = useParams();
  const { areEstimateEnabledByProjectId, currentActiveEstimateId, estimateById } = useProjectEstimates();

  const isEstimateEnabled = (analyticsOption: string) => {
    if (analyticsOption === "estimate") {
      if (
        projectId &&
        currentActiveEstimateId &&
        areEstimateEnabledByProjectId(projectId.toString()) &&
        estimateById(currentActiveEstimateId)?.type === EEstimateSystem.POINTS
      ) {
        return true;
      } else {
        return false;
      }
    }

    return true;
  };

  return (
    <CustomSelect
      value={value}
      label={
        <div className="flex items-center gap-2">
          <ProjectIcon className="h-3 w-3" />
          <span>
            {(() => {
              const option = options.find((v) => v.value === value);
              return option ? t(option.i18nKey) : t("workspace_analytics.metric.add_metric");
            })()}
          </span>
        </div>
      }
      onChange={onChange}
      maxHeight="lg"
    >
      {options.map((item) => {
        if (hiddenOptions?.includes(item.value)) return null;
        return (
          isEstimateEnabled(item.value) && (
            <CustomSelect.Option key={item.value} value={item.value}>
              {t(item.i18nKey)}
            </CustomSelect.Option>
          )
        );
      })}
    </CustomSelect>
  );
});
