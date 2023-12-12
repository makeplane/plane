import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// component
import { Button, TransferIcon } from "@plane/ui";
// icon
import { AlertCircle } from "lucide-react";
// services
import { CycleService } from "services/cycle.service";
// fetch-key
import { CYCLE_DETAILS } from "constants/fetch-keys";

type Props = {
  handleClick: () => void;
};

const cycleService = new CycleService();

export const TransferIssues: React.FC<Props> = (props) => {
  const { handleClick } = props;

  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query;

  const { data: cycleDetails } = useSWR(
    cycleId ? CYCLE_DETAILS(cycleId as string) : null,
    workspaceSlug && projectId && cycleId
      ? () => cycleService.getCycleDetails(workspaceSlug as string, projectId as string, cycleId as string)
      : null
  );

  const transferableIssuesCount = cycleDetails
    ? cycleDetails.backlog_issues + cycleDetails.unstarted_issues + cycleDetails.started_issues
    : 0;

  return (
    <div className="-mt-2 mb-4 flex items-center justify-between px-4 pt-6">
      <div className="flex items-center gap-2 text-sm text-custom-text-200">
        <AlertCircle className="h-3.5 w-3.5 text-custom-text-200" />
        <span>Completed cycles are not editable.</span>
      </div>

      {transferableIssuesCount > 0 && (
        <div>
          <Button variant="primary" prependIcon={<TransferIcon color="white" />} onClick={handleClick}>
            Transfer Issues
          </Button>
        </div>
      )}
    </div>
  );
};
