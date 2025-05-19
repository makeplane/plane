import { useState } from "react";
import { TCycleProgress } from "@plane/types";
import { CircularProgressIndicator } from "@plane/ui";

type Props = {
  progress: Partial<TCycleProgress> | null | undefined;
  days_left: number;
};

const ProgressDonut = (props: Props) => {
  const { progress, days_left } = props;
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const percentage = progress ? ((progress?.completed ?? 0) * 100) / (progress?.scope ?? 1) : 0;

  return (
    <div
      className="group flex items-center justify-between py-1 rounded-full"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <CircularProgressIndicator size={65} percentage={percentage} strokeWidth={3}>
        <span className="text-[20px] text-custom-primary-200 font-bold block text-center">
          {progress ? (isHovering ? days_left : `${percentage ? percentage.toFixed(0) : 0}%`) : "0%"}
        </span>

        {isHovering && (
          <div className="text-custom-primary-200 text-[9px] uppercase whitespace-nowrap tracking-[0.9px] font-semibold leading-[11px] text-center">
            {days_left === 1 ? "Day" : "Days"} <br /> left
          </div>
        )}
      </CircularProgressIndicator>
    </div>
  );
};
export default ProgressDonut;
