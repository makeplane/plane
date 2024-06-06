import { FC, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { TEstimatePointsObject, TEstimateSystemKeys } from "@plane/types";
// components
import { EstimatePointUpdate, EstimatePointDelete } from "@/components/estimates/points";

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
};

export const EstimatePointItemPreview: FC<TEstimatePointItemPreview> = observer((props) => {
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
  } = props;
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
        <div className="border border-custom-border-200 rounded relative flex items-center px-2.5 gap-2 text-base  my-1">
          <div className="rounded-sm w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-custom-background-80 transition-colors cursor-pointer">
            <GripVertical size={14} className="text-custom-text-200" />
          </div>
          <div ref={EstimatePointValueRef} className="py-2.5 w-full">
            {estimatePoint?.value ? (
              `${estimatePoint?.value}`
            ) : (
              <span className="text-custom-text-400">Enter estimate point</span>
            )}
          </div>
          <div
            className="rounded-sm w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-custom-background-80 transition-colors cursor-pointer"
            onClick={() => setEstimatePointEditToggle(true)}
          >
            <Pencil size={14} className="text-custom-text-200" />
          </div>
          <div
            className="rounded-sm w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-custom-background-80 transition-colors cursor-pointer"
            onClick={() =>
              estimateId && estimatePointId
                ? setEstimatePointDeleteToggle(true)
                : handleEstimatePointValueRemove && handleEstimatePointValueRemove()
            }
          >
            <Trash2 size={14} className="text-custom-text-200" />
          </div>
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
        />
      )}

      {estimateId && estimatePointId && estimatePointDeleteToggle && (
        <EstimatePointDelete
          workspaceSlug={workspaceSlug}
          projectId={projectId}
          estimateId={estimateId}
          estimatePointId={estimatePointId}
          callback={() => estimateId && setEstimatePointDeleteToggle(false)}
        />
      )}
    </div>
  );
});
