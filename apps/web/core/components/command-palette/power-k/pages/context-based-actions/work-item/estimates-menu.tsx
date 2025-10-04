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
import { useCallback } from "react";

type Props = {
  handleClose: () => void;
  handleUpdateWorkItem: (data: Partial<TIssue>) => void;
  workItemDetails: TIssue;
};

export const PowerKWorkItemEstimatesMenu: React.FC<Props> = observer((props) => {
  const { handleClose, handleUpdateWorkItem, workItemDetails } = props;
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

  const handleUpdateEstimatePoint = useCallback(
    (estimatePointId: string | null) => {
      if (workItemDetails.estimate_point === estimatePointId) return;
      handleUpdateWorkItem({
        estimate_point: estimatePointId,
      });
      handleClose();
    },
    [workItemDetails.estimate_point, handleUpdateWorkItem, handleClose]
  );

  if (!estimatePointIds) return <Spinner />;

  return (
    <>
      <Command.Item onSelect={() => handleUpdateEstimatePoint(null)} className="focus:outline-none">
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
              onSelect={() => handleUpdateEstimatePoint(estimatePoint.id ?? null)}
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
