"use client";

import React from "react";

import isEmpty from "lodash/isEmpty";
import { useParams } from "next/navigation";

import useSWR from "swr";

// component
import { AlertCircle } from "lucide-react";
import { Button, TransferIcon } from "@plane/ui";
// icon
// services
import { CYCLE_DETAILS } from "@/constants/fetch-keys";
import { CycleService } from "@/services/cycle.service";
// fetch-key

type Props = {
  handleClick: () => void;
  disabled?: boolean;
};

const cycleService = new CycleService();

export const TransferIssues: React.FC<Props> = (props) => {
  const { handleClick, disabled = false } = props;

  const { workspaceSlug, projectId, cycleId } = useParams();

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

      {isEmpty(cycleDetails?.progress_snapshot) && transferableIssuesCount > 0 && (
        <div>
          <Button
            variant="primary"
            prependIcon={<TransferIcon color="white" />}
            onClick={handleClick}
            disabled={disabled}
          >
            Transfer Issues
          </Button>
        </div>
      )}
    </div>
  );
};
