import { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Check, X } from "lucide-react";
import { Spinner } from "@plane/ui";
// constants
import { EEstimateSystem } from "@/constants/estimates";
// hooks
import { useEstimate, useEstimatePoint } from "@/hooks/store";

type TEstimatePointDelete = {
  workspaceSlug: string;
  projectId: string;
  estimateId: string;
  estimatePointId: string | undefined;
};

export const EstimatePointDelete: FC<TEstimatePointDelete> = observer((props) => {
  const { workspaceSlug, projectId, estimateId, estimatePointId } = props;
  // hooks
  const { asJson: estimate, estimatePointIds } = useEstimate(estimateId);
  const { asJson: estimatePoint, updateEstimatePoint } = useEstimatePoint(estimateId, estimatePointId);
  // states
  const [loader, setLoader] = useState(false);
  const [estimateValue, setEstimateValue] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (estimateValue === undefined) setEstimateValue(estimatePoint?.value || "");
  }, [estimateValue, estimatePoint]);

  const handleCreate = async () => {
    if (estimatePointId) {
      if (!workspaceSlug || !projectId || !projectId || !estimatePointIds) return;
      try {
        const estimateType: EEstimateSystem | undefined = estimate?.type;
        let isEstimateValid = false;
        if (estimateType && [(EEstimateSystem.TIME, EEstimateSystem.POINTS)].includes(estimateType)) {
          if (estimateValue && Number(estimateValue) && Number(estimateValue) >= 0) {
            isEstimateValid = true;
          }
        } else if (estimateType && estimateType === EEstimateSystem.CATEGORIES) {
          if (estimateValue && estimateValue.length > 0) {
            isEstimateValid = true;
          }
        }

        if (isEstimateValid) {
          setLoader(true);
          const payload = {
            key: estimatePointIds?.length + 1,
            value: estimateValue,
          };
          await updateEstimatePoint(workspaceSlug, projectId, payload);
          setLoader(false);
          handleClose();
        } else {
          console.log("please enter a valid estimate value");
        }
      } catch {
        setLoader(false);
        console.log("something went wrong. please try again later");
      }
    } else {
    }
  };

  const handleClose = () => {
    setEstimateValue("");
  };

  return (
    <div className="relative flex items-center gap-2">
      <div className="w-full border border-custom-border-200 rounded">
        <input
          type="text"
          value={estimateValue}
          onChange={(e) => setEstimateValue(e.target.value)}
          className="border-none focus:ring-0 focus:border-0 focus:outline-none p-2.5 w-full bg-transparent"
        />
      </div>
      {loader ? (
        <div className="w-6 h-6 flex-shrink-0 relative flex justify-center items-center rota">
          <Spinner className="w-4 h-4" />
        </div>
      ) : (
        <div
          className="rounded-sm w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-custom-background-80 transition-colors cursor-pointer text-green-500"
          onClick={handleCreate}
        >
          <Check size={14} />
        </div>
      )}
      <div
        className="rounded-sm w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-custom-background-80 transition-colors cursor-pointer"
        onClick={handleClose}
      >
        <X size={14} className="text-custom-text-200" />
      </div>
    </div>
  );
});
