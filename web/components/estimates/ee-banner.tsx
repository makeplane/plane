import { FC } from "react";
import { Button } from "@plane/ui";

export const EstimateEEBanner: FC = (props) => {
  const {} = props;

  return (
    <div className="border border-red-500 rounded overflow-hidden relative flex items-center">
      <div>
        <div className="text-lg">Estimate issues better with points</div>
        <div className="text-base text-custom-text-200">
          Use points to estimate scope of work better, monitor capacity, track the burn-down report for your project.
        </div>
        <div>
          <Button variant="primary" size="sm">
            Upgrade
          </Button>
          <div>Talk custom pricing</div>
        </div>
      </div>

      <div className="border border-red-500 w-full">Image</div>
    </div>
  );
};
