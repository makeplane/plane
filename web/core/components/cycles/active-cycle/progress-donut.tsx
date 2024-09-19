import { use, useEffect, useRef, useState } from "react";
import { CircularProgressIndicator } from "@plane/ui";
import { TCycleProgress } from "@plane/types";

type Props = {
  progress: TCycleProgress | null;
  days_left: number;
};

const ProgressDonut = (props: Props) => {
  const { progress, days_left } = props;
  const [hoverStep, setHoverStep] = useState<number>(0);
  const intervalId = useRef<NodeJS.Timer | null>(null);

  const handleMouseEnter = () => {
    if (intervalId.current) return;
    intervalId.current = setInterval(() => {
      setHoverStep((prev) => (prev === 3 ? 1 : prev + 1));
    }, 1000);
  };
  const handleMouseLeave = () => {
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
    progress && (
      <div
        className="group flex items-center justify-between py-1 rounded-full"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <CircularProgressIndicator size={82} percentage={50} strokeWidth={2} strokeColor={"text-green-100"}>
          <span className="text-lg text-custom-primary-200 font-medium">
            {hoverStep === 3
              ? days_left
              : `${(((progress.scope - progress.completed) * 100) / progress.scope).toFixed(0)}%`}
          </span>

          {hoverStep === 1 && (
            <div className="text-custom-primary-200 text-[8px] uppercase whitespace-nowrap">
              <span className="font-semibold">{progress.completed}</span> Issues <br /> done
            </div>
          )}
          {hoverStep === 2 && (
            <div className="text-custom-primary-200 text-[8px] uppercase whitespace-nowrap">
              <span className="font-semibold">{progress.pending}</span> Issues <br /> pending
            </div>
          )}
          {hoverStep === 3 && (
            <div className="text-custom-primary-200 text-[8px] uppercase whitespace-nowrap">
              {days_left === 1 ? "Day" : "Days"} <br /> left
            </div>
          )}
        </CircularProgressIndicator>
      </div>
    )
  );
};
export default ProgressDonut;
