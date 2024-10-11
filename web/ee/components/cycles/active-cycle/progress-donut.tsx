import { use, useEffect, useRef, useState } from "react";
import { TCycleProgress } from "@plane/types";
import { CircularProgressIndicator } from "@plane/ui";

type Props = {
  progress: Partial<TCycleProgress> | null | undefined;
  days_left: number;
};

const ProgressDonut = (props: Props) => {
  const { progress, days_left } = props;
  const [hoverStep, setHoverStep] = useState<number>(0);
  const intervalId = useRef<ReturnType<typeof setTimeout> | null>(null);
  const percentage = progress ? ((progress?.completed ?? 0) * 100) / (progress?.scope ?? 1) : 0;
  const handleMouseEnter = () => {
    if (!progress) return;
    if (intervalId.current) return;
    intervalId.current = setInterval(() => {
      setHoverStep((prev) => (prev === 3 ? 1 : prev + 1));
    }, 1000);
  };
  const handleMouseLeave = () => {
    if (!progress) return;
    clear();
    setHoverStep(0);
  };

  const clear = () => {
    if (intervalId.current) {
      clearInterval(intervalId.current);
      intervalId.current = null;
    }
  };
  useEffect(() => {
    if (hoverStep === 3) clear();
  }, [hoverStep]);

  return (
    <div
      className="group flex items-center justify-between py-1 rounded-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <CircularProgressIndicator size={82} percentage={percentage} strokeWidth={3}>
        <span className="text-lg text-custom-primary-200 font-medium">
          {progress ? (hoverStep === 3 ? days_left : `${percentage ? percentage.toFixed(0) : 0}%`) : "0%"}
        </span>

        {hoverStep === 1 && (
          <div className="text-custom-primary-200 text-[9px] uppercase whitespace-nowrap">
            <span className="font-semibold">{progress?.completed || 0}</span> Issues <br /> done
          </div>
        )}
        {hoverStep === 2 && (
          <div className="text-custom-primary-200 text-[9px] uppercase whitespace-nowrap">
            <span className="font-semibold">{progress?.pending || 0}</span> Issues <br /> pending
          </div>
        )}
        {hoverStep === 3 && (
          <div className="text-custom-primary-200 text-[9px] uppercase whitespace-nowrap">
            {days_left === 1 ? "Day" : "Days"} <br /> left
          </div>
        )}
      </CircularProgressIndicator>
    </div>
  );
};
export default ProgressDonut;
