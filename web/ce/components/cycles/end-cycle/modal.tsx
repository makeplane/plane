import React from "react";

interface Props {
  isOpen: boolean;
  handleClose: () => void;
  cycleId: string;
  projectId: string;
  workspaceSlug: string;
  transferrableIssuesCount: number;
  cycleName: string;
}

export const EndCycleModal: React.FC<Props> = () => <></>;
