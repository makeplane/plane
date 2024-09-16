import { use, useEffect, useRef, useState } from "react";
import { CircularProgressIndicator, Row } from "@plane/ui";
import { TProgress } from "./types";
import { set } from "lodash";

type Props = {
  progress: TProgress;
};
const progress = { percentage: 10, pendingIssues: 60, completedIssues: 100, daysLeft: 9 };

const ProgressDonut = (props: Props) => {
  const [hoverStep, setHoverStep] = useState<number>(0);
  const intervalId = useRef<NodeJS.Timer | null>(null);

  useEffect(() => {
    if (hoverStep === 1) {
      intervalId.current = setInterval(() => {
        setHoverStep((state) => state + 1);
      }, 1000);
    }
    if (hoverStep === 4) {
      intervalId.current && clearInterval(intervalId.current);
      setHoverStep(0);
    }
  }, [hoverStep]);
  return (
    <div
      className="group flex items-center justify-between py-1"
      onMouseEnter={() => setHoverStep(1)}
      onMouseDown={() => setHoverStep(0)}
    >
      <CircularProgressIndicator size={82} percentage={50} strokeWidth={2} strokeColor={"text-green-100"}>
        <span className="text-lg text-custom-primary-200 font-medium">{`${hoverStep === 3 ? progress.daysLeft : progress.percentage}%`}</span>

        {hoverStep === 1 && (
          <div className="text-custom-primary-200 text-[8px] uppercase whitespace-nowrap">
            <span className="font-semibold">{progress.completedIssues}</span> Issues <br /> done
          </div>
        )}
        {hoverStep === 2 && (
          <div className="text-custom-primary-200 text-[8px] uppercase whitespace-nowrap">
            <span className="font-semibold">{progress.pendingIssues}</span> Issues <br /> pending
          </div>
        )}
        {hoverStep === 3 && (
          <div className="text-custom-primary-200 text-[8px] uppercase whitespace-nowrap">
            Days <br /> left
          </div>
        )}
      </CircularProgressIndicator>
    </div>
  );
};
export default ProgressDonut;
