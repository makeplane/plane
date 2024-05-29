import { FC, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react";
import { GripVertical, Pencil, Trash2 } from "lucide-react";
import { TEstimatePointsObject, TEstimateSystemKeys } from "@plane/types";
// components
import { EstimatePointItemCreateUpdate } from "@/components/estimates/points";

type TEstimatePointItemCreatePreview = {
  estimateType: TEstimateSystemKeys;
  estimatePoint: TEstimatePointsObject;
  handleEstimatePoint: (mode: "add" | "remove" | "update", value: TEstimatePointsObject) => void;
};

export const EstimatePointItemCreatePreview: FC<TEstimatePointItemCreatePreview> = observer((props) => {
  const { estimateType, estimatePoint, handleEstimatePoint } = props;
  // state
  const [estimatePointEditToggle, setEstimatePointEditToggle] = useState(false);
  // ref
  const EstimatePointValueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!estimatePointEditToggle)
      EstimatePointValueRef?.current?.addEventListener("dblclick", () => setEstimatePointEditToggle(true));
  }, [estimatePointEditToggle]);

  return (
    <div>
      {!estimatePointEditToggle && (
        <div className="border border-custom-border-200 rounded relative flex items-center px-2.5 gap-2 text-base">
          <div className="rounded-sm w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-custom-background-80 transition-colors cursor-pointer">
            <GripVertical size={14} className="text-custom-text-200" />
          </div>
          <div ref={EstimatePointValueRef} className="py-2.5 w-full">
            {estimatePoint?.value ? (
              estimatePoint?.value
            ) : (
              <span className="text-custom-text-200">Enter Estimate Value</span>
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
            onClick={() => handleEstimatePoint("remove", estimatePoint)}
          >
            <Trash2 size={14} className="text-custom-text-200" />
          </div>
        </div>
      )}

      {estimatePoint && estimatePointEditToggle && (
        <EstimatePointItemCreateUpdate
          estimateType={estimateType}
          estimatePoint={estimatePoint}
          updateEstimateValue={(value: string) => handleEstimatePoint("update", { ...estimatePoint, value })}
          callback={() => setEstimatePointEditToggle(false)}
        />
      )}
    </div>
  );
});
