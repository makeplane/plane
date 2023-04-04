import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// component
import { PrimaryButton, Tooltip } from "components/ui";
// icon
import { ExclamationIcon, TransferIcon } from "components/icons";
// services
import cycleServices from "services/cycles.service";
// fetch-key
import { CYCLE_DETAILS } from "constants/fetch-keys";

type Props = {
  handleClick: () => void;
};

export const TransferIssues: React.FC<Props> = ({ handleClick }) => {
  const router = useRouter();
  const { workspaceSlug, projectId, cycleId } = router.query;

  const { data: cycleDetails } = useSWR(
    cycleId ? CYCLE_DETAILS(cycleId as string) : null,
    workspaceSlug && projectId && cycleId
      ? () =>
          cycleServices.getCycleDetails(
            workspaceSlug as string,
            projectId as string,
            cycleId as string
          )
      : null
  );

  const transferableIssuesCount = cycleDetails
    ? cycleDetails.backlog_issues + cycleDetails.unstarted_issues + cycleDetails.started_issues
    : 0;
  return (
    <div className="flex items-center justify-between -mt-4 mb-4">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <ExclamationIcon height={14} width={14} />
        <span>Completed cycles are not editable.</span>
      </div>

      {transferableIssuesCount > 0 && (
        <div>
          <PrimaryButton onClick={handleClick} className="flex items-center gap-3 rounded-lg">
            <TransferIcon className="h-4 w-4" />
            <span className="text-white">Transfer Issues</span>
          </PrimaryButton>
        </div>
      )}
    </div>
  );
};
