import { FC, useState } from "react";
import { observer } from "mobx-react";
import { Info, MoveRight, Trash2, X } from "lucide-react";
import { Select } from "@headlessui/react";
import { Spinner, Tooltip } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useEstimate, useEstimatePoint } from "@/hooks/store";

type TEstimatePointDelete = {
  workspaceSlug: string;
  projectId: string;
  estimateId: string;
  estimatePointId: string;
  callback: () => void;
};

export const EstimatePointDelete: FC<TEstimatePointDelete> = observer((props) => {
  const { workspaceSlug, projectId, estimateId, estimatePointId, callback } = props;
  // hooks
  const { asJson: estimate, deleteEstimatePoint } = useEstimate(estimateId);
  const { asJson: estimatePoint } = useEstimatePoint(estimateId, estimatePointId);
  // states
  const [loader, setLoader] = useState(false);
  const [estimateInputValue, setEstimateInputValue] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  const handleClose = () => {
    setEstimateInputValue("");
    callback();
  };

  const handleCreate = async () => {
    if (!workspaceSlug || !projectId || !projectId) return;
    try {
      setLoader(true);
      setError(undefined);
      await deleteEstimatePoint(workspaceSlug, projectId, estimateId, estimateInputValue);
      setLoader(false);
      setError(undefined);
      handleClose();
    } catch {
      setLoader(false);
      setError("something went wrong. please try again later");
    }
  };

  // derived values
  const selectDropdownOptions =
    estimate && estimate?.points ? estimate?.points.filter((point) => point.id !== estimatePointId) : [];

  return (
    <div className="relative flex items-center gap-2 text-base">
      <div className="flex-grow relative flex items-center gap-3">
        <div className="w-full border border-custom-border-200 rounded p-2.5 bg-custom-background-90">
          {estimatePoint?.value}
        </div>
        <div className="relative flex justify-center items-center gap-2 whitespace-nowrap">
          Mark as <MoveRight size={14} />
        </div>
        <div
          className={cn(
            "relative w-full rounded border flex items-center gap-3 p-2.5",
            error ? `border-red-500` : `border-custom-border-200`
          )}
        >
          <Select
            className="bg-transparent flex-grow focus:ring-0 focus:border-0 focus:outline-none"
            value={estimateInputValue}
            onChange={(e) => setEstimateInputValue(e.target.value)}
          >
            <option value={undefined}>None</option>
            {selectDropdownOptions.map((option) => (
              <option key={option?.id} value={option?.value}>
                {option?.value}
              </option>
            ))}
          </Select>
          {error && (
            <>
              <Tooltip tooltipContent={error} position="bottom">
                <div className="flex-shrink-0 w-3.5 h-3.5 overflow-hidden relative flex justify-center items-center text-red-500">
                  <Info size={14} />
                </div>
              </Tooltip>
            </>
          )}
        </div>
      </div>
      {loader ? (
        <div className="w-6 h-6 flex-shrink-0 relative flex justify-center items-center rota">
          <Spinner className="w-4 h-4" />
        </div>
      ) : (
        <div
          className="rounded-sm w-6 h-6 flex-shrink-0 relative flex justify-center items-center hover:bg-custom-background-80 transition-colors cursor-pointer text-red-500"
          onClick={handleCreate}
        >
          <Trash2 size={14} />
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
