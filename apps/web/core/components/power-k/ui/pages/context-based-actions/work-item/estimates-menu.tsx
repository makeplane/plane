"use client";

import { Command } from "cmdk";
import { observer } from "mobx-react";
import { Check, Triangle } from "lucide-react";
// plane types
import { useTranslation } from "@plane/i18n";
import { EEstimateSystem, type TIssue } from "@plane/types";
import { Spinner } from "@plane/ui";
import { convertMinutesToHoursMinutesString } from "@plane/utils";
// hooks
import { useEstimate, useProjectEstimates } from "@/hooks/store/estimates";

type Props = {
  handleSelect: (estimatePointId: string | null) => void;
  workItemDetails: TIssue;
};

export const PowerKWorkItemEstimatesMenu: React.FC<Props> = observer((props) => {
  const { handleSelect, workItemDetails } = props;
  // store hooks
  const { currentActiveEstimateIdByProjectId, getEstimateById } = useProjectEstimates();
  const currentActiveEstimateId = workItemDetails.project_id
    ? currentActiveEstimateIdByProjectId(workItemDetails.project_id)
    : undefined;
  const { estimatePointIds, estimatePointById } = useEstimate(currentActiveEstimateId);
  // derived values
  const currentActiveEstimate = currentActiveEstimateId ? getEstimateById(currentActiveEstimateId) : undefined;
  // translation
  const { t } = useTranslation();

  if (!estimatePointIds) return <Spinner />;

  return (
    <>
      <Command.Item onSelect={() => handleSelect(null)} className="focus:outline-none">
        <div className="flex items-center space-x-3">
          <Triangle className="shrink-0 size-3.5" />
          <p>{t("project_settings.estimates.no_estimate")}</p>
        </div>
        <div className="flex-shrink-0">{workItemDetails.estimate_point === null && <Check className="size-3" />}</div>
      </Command.Item>
      {estimatePointIds.length > 0 ? (
        estimatePointIds.map((estimatePointId) => {
          const estimatePoint = estimatePointById(estimatePointId);
          if (!estimatePoint) return null;

          return (
            <Command.Item
              key={estimatePoint.id}
              onSelect={() => handleSelect(estimatePoint.id ?? null)}
              className="focus:outline-none"
            >
              <div className="flex items-center space-x-3">
                <Triangle className="shrink-0 size-3.5" />
                <p>
                  {currentActiveEstimate?.type === EEstimateSystem.TIME
                    ? convertMinutesToHoursMinutesString(Number(estimatePoint.value))
                    : estimatePoint.value}
                </p>
              </div>
              <div className="flex-shrink-0">
                {workItemDetails.estimate_point === estimatePoint.id && <Check className="size-3" />}
              </div>
            </Command.Item>
          );
        })
      ) : (
        <div className="text-center">No estimate found</div>
      )}
    </>
  );
});
