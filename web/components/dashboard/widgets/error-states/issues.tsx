"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";
// ui
import { Button } from "@plane/ui";

type Props = {
  isRefreshing: boolean;
  onClick: () => void;
};

export const IssuesErrorState: React.FC<Props> = (props) => {
  const { isRefreshing, onClick } = props;

  return (
    <div className="h-full w-full grid place-items-center">
      <div className="text-center">
        <div className="h-24 w-24 bg-red-500/20 rounded-full grid place-items-center mx-auto">
          <AlertTriangle className="h-12 w-12 text-red-500" />
        </div>
        <p className="mt-7 text-custom-text-300 text-sm font-medium">There was an error in fetching widget details</p>
        <Button
          variant="neutral-primary"
          prependIcon={<RefreshCcw className="h-3 w-3" />}
          className="mt-2 mx-auto"
          onClick={onClick}
          loading={isRefreshing}
        >
          {isRefreshing ? "Retrying" : "Retry"}
        </Button>
      </div>
    </div>
  );
};
