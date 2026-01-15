import type { FC } from "react";
import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { GripVertical } from "lucide-react";
// plane imports
import { EEstimateSystem, estimateCount } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { EditIcon, TrashIcon } from "@plane/propel/icons";
import type { TEstimatePointsObject, TEstimateSystemKeys, TEstimateTypeErrorObject } from "@plane/types";
import { convertMinutesToHoursMinutesString } from "@plane/utils";
// plane web imports
import { EstimatePointDelete } from "@/plane-web/components/estimates";
// local imports
import { EstimatePointUpdate } from "./update";

type TEstimatePointItemPreview = {
  workspaceSlug: string;
  projectId: string;
  estimateId: string | undefined;
  estimateType: TEstimateSystemKeys;
  estimatePointId: string | undefined;
  estimatePoint: TEstimatePointsObject;
  estimatePoints: TEstimatePointsObject[];
  handleEstimatePointValueUpdate?: (estimateValue: string) => void;
  handleEstimatePointValueRemove?: () => void;
  estimatePointError?: TEstimateTypeErrorObject | undefined;
  handleEstimatePointError?: (newValue: string, message: string | undefined) => void;
};

export const EstimatePointItemPreview = observer(function EstimatePointItemPreview(props: TEstimatePointItemPreview) {
  const {
    workspaceSlug,
    projectId,
    estimateId,
    estimateType,
    estimatePointId,
    estimatePoint,
    estimatePoints,
    handleEstimatePointValueUpdate,
    handleEstimatePointValueRemove,
    estimatePointError,
    handleEstimatePointError,
  } = props;
  // i18n
  const { t } = useTranslation();
  // state
  const [estimatePointEditToggle, setEstimatePointEditToggle] = useState(false);
  const [estimatePointDeleteToggle, setEstimatePointDeleteToggle] = useState(false);
  // ref
  const EstimatePointValueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!estimatePointEditToggle && !estimatePointDeleteToggle)
      EstimatePointValueRef?.current?.addEventListener("dblclick", () => setEstimatePointEditToggle(true));
  }, [estimatePointDeleteToggle, estimatePointEditToggle]);

  return (
    <div>
      {!estimatePointEditToggle && !estimatePointDeleteToggle && (
        <div className="border border-subtle rounded-sm relative flex items-center px-1 gap-2 text-14 my-1">
          <div className="rounded-xs w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-layer-1 transition-colors cursor-pointer">
            <GripVertical size={14} className="text-secondary" />
          </div>
          <div ref={EstimatePointValueRef} className="py-2 w-full text-13">
            {estimatePoint?.value ? (
              `${estimateType === EEstimateSystem.TIME ? convertMinutesToHoursMinutesString(Number(estimatePoint?.value)) : estimatePoint?.value}`
            ) : (
              <span className="text-placeholder">{t("project_settings.estimates.create.enter_estimate_point")}</span>
            )}
          </div>
          <div
            className="rounded-xs w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-layer-1 transition-colors cursor-pointer"
            onClick={() => setEstimatePointEditToggle(true)}
          >
            <EditIcon width={14} height={14} className="text-secondary" />
          </div>
          {estimatePoints.length > estimateCount.min && (
            <div
              className="rounded-xs w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-layer-1 transition-colors cursor-pointer"
              onClick={() =>
                estimateId && estimatePointId
                  ? setEstimatePointDeleteToggle(true)
                  : handleEstimatePointValueRemove && handleEstimatePointValueRemove()
              }
            >
              <TrashIcon width={14} height={14} className="text-secondary" />
            </div>
          )}
        </div>
      )}

      {estimatePoint && estimatePointEditToggle && (
        <EstimatePointUpdate
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          estimateId={estimateId}
          estimateType={estimateType}
          estimatePointId={estimatePointId}
          estimatePoints={estimatePoints}
          estimatePoint={estimatePoint}
          handleEstimatePointValueUpdate={(estimatePointValue: string) =>
            handleEstimatePointValueUpdate && handleEstimatePointValueUpdate(estimatePointValue)
          }
          closeCallBack={() => setEstimatePointEditToggle(false)}
          estimatePointError={estimatePointError}
          handleEstimatePointError={handleEstimatePointError}
        />
      )}

      {estimateId && estimatePointId && estimatePointDeleteToggle && (
        <EstimatePointDelete
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          estimateId={estimateId}
          estimatePointId={estimatePointId}
          estimatePoints={estimatePoints}
          callback={() => estimateId && setEstimatePointDeleteToggle(false)}
          estimatePointError={estimatePointError}
          handleEstimatePointError={handleEstimatePointError}
          estimateSystem={estimateType}
        />
      )}
    </div>
  );
});
