"use client";

import { FC } from "react";
import { MoveRight } from "lucide-react";
import { Tooltip } from "@plane/ui";
// components
import { EmptyState } from "@/components/common";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";
// images
import emptyIssue from "@/public/empty-state/issue.svg";

type TIssuePeekOverviewError = {
  removeRoutePeekId: () => void;
};

export const IssuePeekOverviewError: FC<TIssuePeekOverviewError> = (props) => {
  const { removeRoutePeekId } = props;
  // hooks
  const { isMobile } = usePlatformOS();

  return (
    <div className="w-full h-full overflow-hidden relative flex flex-col">
      <div className="flex-shrink-0 flex justify-start">
        <Tooltip tooltipContent="Close the peek view" isMobile={isMobile}>
          <button onClick={removeRoutePeekId} className="w-5 h-5 m-5">
            <MoveRight className="h-4 w-4 text-custom-text-300 hover:text-custom-text-200" />
          </button>
        </Tooltip>
      </div>

      <div className="w-full h-full">
        <EmptyState
          image={emptyIssue ?? undefined}
          title="Work item does not exist"
          description="The work item you are looking for does not exist, has been archived, or has been deleted."
        />
      </div>
    </div>
  );
};
