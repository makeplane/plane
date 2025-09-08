import { observer } from "mobx-react";
import { CircleCheck, CircleX } from "lucide-react";

type TProps = {
  failedCount: number;
  successCount: number;
  totalCount: number;
};

export const SuccessFailureIndicator: React.FC<TProps> = observer((props) => {
  const { failedCount, successCount, totalCount } = props;

  if (totalCount === 0) return null;

  const successPercentage = Math.round((successCount / totalCount) * 100);
  const failurePercentage = Math.round((failedCount / totalCount) * 100);

  return (
    <div className="flex flex-shrink-0 items-center gap-2 bg-custom-background-80/70 px-1.5 py-0.5 rounded-full text-xs font-medium">
      <span className="flex flex-shrink-0 items-center gap-1">
        <div className="grid place-items-center bg-[#1FAD40] size-3 rounded-full">
          <CircleCheck size={8} className="text-white" />
        </div>
        <span className="text-custom-text-300">{successPercentage}%</span>
      </span>
      <span className="flex flex-shrink-0 items-center gap-1">
        <div className="grid place-items-center bg-[#FF0000] size-3 rounded-full">
          <CircleX size={8} className="text-white" />
        </div>
        <span className="text-custom-text-300">{failurePercentage}%</span>
      </span>
    </div>
  );
});
