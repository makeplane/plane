import { useState } from "react";
import { CircularProgressIndicator, Row } from "@plane/ui";
import { TProgress } from "./types";

type Props = {
  progress: TProgress;
};
const progress = { percentage: 10, pendingIssues: 60, completedIssues: 10, daysLeft: 9 };

const ProgressDonut = (props: Props) => {
  const [hoverStep, setHoverStep] = useState<number>(0);
  //   const { progress } = props;
  {
    /* TODO: fix the stroke color */
  }
  return (
    // <Row
    //   className="group flex items-center justify-between py-1"
    //   //   onMouseEnter={() => setHoverStep(1)}
    //   //   onMouseDown={() => setHoverStep(0)}
    // >
    <CircularProgressIndicator size={70} percentage={50} strokeWidth={2} strokeColor={"text-green-100"}>
      <span className="text-lg text-custom-primary-200 font-medium">{`${hoverStep === 3 ? progress.daysLeft : progress.percentage}%`}</span>
      {hoverStep > 0 && (
        <div className="text-custom-primary-200 text-[7px]">
          {hoverStep < 3 && (
            <span className="font-semibold">{hoverStep === 1 ? progress.completedIssues : progress.pendingIssues}</span>
          )}
          <div className="uppercase">
            {hoverStep === 1 && "Issues done"}
            {hoverStep === 2 && "Issues pending"}
            {hoverStep === 3 && "Days left"}
          </div>
        </div>
      )}
    </CircularProgressIndicator>
    // </Row>
  );
};
export default ProgressDonut;
